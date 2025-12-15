import { useState, useEffect, useCallback } from 'react';
import { offlineDb } from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  totalContracts: number;
  activeInsured: number;
  pendingReimbursements: number;
  monthlyContributionsTotal: number;
  monthlyReimbursementsTotal: number;
  totalContributionsPaid: number;
  totalReimbursementsPaid: number;
  contractsThisMonth: number;
}

interface MonthlyTrend {
  month: string;
  subscriptions: number;
  reimbursements: number;
}

interface ReimbursementsByStatus {
  soumis: number;
  verification: number;
  valide: number;
  paye: number;
  rejete: number;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  details: string | null;
  user_name: string | null;
  created_at: string;
}

interface PendingReimbursement {
  id: string;
  reimbursement_number: string;
  insured_name: string;
  claimed_amount: number;
  medical_date: string;
  status: string;
}

export function useDashboardDataOffline() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    activeInsured: 0,
    pendingReimbursements: 0,
    monthlyContributionsTotal: 0,
    monthlyReimbursementsTotal: 0,
    totalContributionsPaid: 0,
    totalReimbursementsPaid: 0,
    contractsThisMonth: 0,
  });
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [reimbursementsByStatus, setReimbursementsByStatus] = useState<ReimbursementsByStatus>({
    soumis: 0,
    verification: 0,
    valide: 0,
    paye: 0,
    rejete: 0,
  });
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [pendingReimbursements, setPendingReimbursements] = useState<PendingReimbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Charger les stats depuis IndexedDB
  const loadStatsFromLocal = useCallback(async () => {
    try {
      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const endOfCurrentMonth = endOfMonth(now);

      const contracts = await offlineDb.contracts.toArray();
      const insured = await offlineDb.insured.toArray();
      const reimbursements = await offlineDb.reimbursements.toArray();
      const contributions = await offlineDb.contributions.toArray();

      // Stats de base
      const totalContracts = contracts.length;
      const activeInsured = insured.filter(i => i.status === 'validee').length;
      const pendingReimbursementsCount = reimbursements.filter(r => 
        ['soumis', 'verification'].includes(r.status)
      ).length;

      // Contrats ce mois-ci
      const contractsThisMonth = contracts.filter(c => {
        const createdAt = new Date(c.created_at);
        return createdAt >= startOfCurrentMonth && createdAt <= endOfCurrentMonth;
      }).length;

      // Cotisations mensuelles
      const monthlyContributions = contributions.filter(c => {
        if (!c.payment_date || !['paye', 'partiel'].includes(c.payment_status)) return false;
        const paymentDate = new Date(c.payment_date);
        return paymentDate >= startOfCurrentMonth && paymentDate <= endOfCurrentMonth;
      });
      const monthlyContributionsTotal = monthlyContributions.reduce((sum, c) => sum + (c.paid_amount || 0), 0);

      // Remboursements mensuels payés
      const monthlyReimbursementsPaid = reimbursements.filter(r => {
        if (r.status !== 'paye' || !r.paid_at) return false;
        const paidAt = new Date(r.paid_at);
        return paidAt >= startOfCurrentMonth && paidAt <= endOfCurrentMonth;
      });
      const monthlyReimbursementsTotal = monthlyReimbursementsPaid.reduce(
        (sum, r) => sum + (r.paid_amount || r.approved_amount || r.claimed_amount || 0), 0
      );

      // Totaux globaux
      const totalContributionsPaid = contributions
        .filter(c => ['paye', 'partiel'].includes(c.payment_status))
        .reduce((sum, c) => sum + (c.paid_amount || 0), 0);

      const totalReimbursementsPaid = reimbursements
        .filter(r => r.status === 'paye')
        .reduce((sum, r) => sum + (r.paid_amount || r.approved_amount || r.claimed_amount || 0), 0);

      setStats({
        totalContracts,
        activeInsured,
        pendingReimbursements: pendingReimbursementsCount,
        monthlyContributionsTotal,
        monthlyReimbursementsTotal,
        totalContributionsPaid,
        totalReimbursementsPaid,
        contractsThisMonth,
      });

      // Remboursements par statut
      setReimbursementsByStatus({
        soumis: reimbursements.filter(r => r.status === 'soumis').length,
        verification: reimbursements.filter(r => r.status === 'verification').length,
        valide: reimbursements.filter(r => r.status === 'valide').length,
        paye: reimbursements.filter(r => r.status === 'paye').length,
        rejete: reimbursements.filter(r => r.status === 'rejete').length,
      });

      // Tendances mensuelles (6 derniers mois)
      const trends: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const subscriptionsCount = contracts.filter(c => {
          const createdAt = new Date(c.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length;

        const reimbursementsCount = reimbursements.filter(r => {
          const createdAt = new Date(r.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length;

        trends.push({
          month: format(monthDate, 'MMM', { locale: fr }),
          subscriptions: subscriptionsCount,
          reimbursements: reimbursementsCount,
        });
      }
      setMonthlyTrends(trends);

      // Activité récente
      const auditLogs = await offlineDb.auditLogs
        .orderBy('created_at')
        .reverse()
        .limit(5)
        .toArray();
      setRecentActivity(auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        entity_type: log.entity_type,
        details: log.details || null,
        user_name: log.user_name || null,
        created_at: log.created_at,
      })));

      // Remboursements en attente
      const pendingRemb = reimbursements
        .filter(r => ['soumis', 'verification'].includes(r.status))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      const insuredMap = new Map(insured.map(i => [i.id, i]));
      setPendingReimbursements(pendingRemb.map(r => {
        const ins = insuredMap.get(r.insured_id);
        return {
          id: r.id,
          reimbursement_number: r.reimbursement_number,
          insured_name: ins ? `${ins.first_name} ${ins.last_name}` : 'N/A',
          claimed_amount: r.claimed_amount,
          medical_date: r.medical_date,
          status: r.status,
        };
      }));

    } catch (error) {
      console.error('[useDashboardDataOffline] Error loading local data:', error);
    }
  }, []);

  // Synchroniser avec le serveur si en ligne
  const syncFromServer = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      // Synchroniser contracts
      const { data: contractsData } = await supabase.from('contracts').select('*');
      for (const record of (contractsData || [])) {
        const existing = await offlineDb.contracts.get(record.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.contracts.put({
            ...record,
            _syncStatus: 'synced',
            _localUpdatedAt: record.updated_at,
            _serverUpdatedAt: record.updated_at,
          });
        }
      }

      // Synchroniser insured
      const { data: insuredData } = await supabase.from('insured').select('*');
      for (const record of (insuredData || [])) {
        const existing = await offlineDb.insured.get(record.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.insured.put({
            ...record,
            _syncStatus: 'synced',
            _localUpdatedAt: record.updated_at,
            _serverUpdatedAt: record.updated_at,
          });
        }
      }

      // Synchroniser reimbursements
      const { data: reimbursementsData } = await supabase.from('reimbursements').select('*');
      for (const record of (reimbursementsData || [])) {
        const existing = await offlineDb.reimbursements.get(record.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.reimbursements.put({
            ...record,
            exclusions: record.exclusions ? JSON.stringify(record.exclusions) : undefined,
            _syncStatus: 'synced',
            _localUpdatedAt: record.updated_at,
            _serverUpdatedAt: record.updated_at,
          });
        }
      }

      // Synchroniser contributions
      const { data: contributionsData } = await supabase.from('contributions').select('*');
      for (const record of (contributionsData || [])) {
        const existing = await offlineDb.contributions.get(record.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.contributions.put({
            ...record,
            _syncStatus: 'synced',
            _localUpdatedAt: record.updated_at,
            _serverUpdatedAt: record.updated_at,
          });
        }
      }

      // Synchroniser audit_logs
      const { data: auditData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      for (const record of (auditData || [])) {
        const existing = await offlineDb.auditLogs.get(record.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.auditLogs.put({
            ...record,
            old_values: record.old_values ? JSON.stringify(record.old_values) : undefined,
            new_values: record.new_values ? JSON.stringify(record.new_values) : undefined,
            _syncStatus: 'synced',
            _localUpdatedAt: record.created_at,
            _serverUpdatedAt: record.created_at,
          });
        }
      }
    } catch (error) {
      console.error('[useDashboardDataOffline] Sync error:', error);
    }
  }, []);

  // Fetch principal
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        await syncFromServer();
      }
      await loadStatsFromLocal();
    } catch (error) {
      console.error('[useDashboardDataOffline] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadStatsFromLocal, syncFromServer]);

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchAllData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchAllData]);

  // Charger au montage
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Real-time subscription si online
  useEffect(() => {
    if (!navigator.onLine) return;

    const channel = supabase
      .channel('dashboard-offline-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insured' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reimbursements' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, fetchAllData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, fetchAllData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  return {
    stats,
    monthlyTrends,
    reimbursementsByStatus,
    recentActivity,
    pendingReimbursements,
    isLoading,
    isOnline,
    refetch: fetchAllData,
  };
}
