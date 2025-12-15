import { useState, useEffect } from 'react';
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

export function useDashboardData() {
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

  const fetchStats = async () => {
    try {
      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const endOfCurrentMonth = endOfMonth(now);

      // Fetch total contracts
      const { count: totalContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true });

      // Fetch contracts created this month
      const { count: contractsThisMonth } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfCurrentMonth.toISOString())
        .lte('created_at', endOfCurrentMonth.toISOString());

      // Fetch active insured (status = validee)
      const { count: activeInsured } = await supabase
        .from('insured')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'validee');

      // Fetch pending reimbursements count
      const { count: pendingReimbursementsCount } = await supabase
        .from('reimbursements')
        .select('*', { count: 'exact', head: true })
        .in('status', ['soumis', 'verification']);

      // Fetch monthly contributions total (paid this month)
      const { data: monthlyContributions } = await supabase
        .from('contributions')
        .select('paid_amount, payment_date')
        .in('payment_status', ['paye', 'partiel'])
        .gte('payment_date', startOfCurrentMonth.toISOString().split('T')[0])
        .lte('payment_date', endOfCurrentMonth.toISOString().split('T')[0]);

      const contributionsTotal = monthlyContributions?.reduce(
        (sum, c) => sum + (c.paid_amount || 0),
        0
      ) || 0;

      // Fetch monthly reimbursements total (paid this month)
      const { data: monthlyReimbursements } = await supabase
        .from('reimbursements')
        .select('paid_amount')
        .eq('status', 'paye')
        .gte('paid_at', startOfCurrentMonth.toISOString())
        .lte('paid_at', endOfCurrentMonth.toISOString());

      const reimbursementsTotal = monthlyReimbursements?.reduce(
        (sum, r) => sum + (r.paid_amount || 0),
        0
      ) || 0;

      // Fetch total contributions paid (all time)
      const { data: allContributions } = await supabase
        .from('contributions')
        .select('paid_amount')
        .in('payment_status', ['paye', 'partiel']);

      const totalContributions = allContributions?.reduce(
        (sum, c) => sum + (c.paid_amount || 0),
        0
      ) || 0;

      // Fetch total reimbursements paid (all time)
      const { data: allReimbursements } = await supabase
        .from('reimbursements')
        .select('paid_amount')
        .eq('status', 'paye');

      const totalReimbursements = allReimbursements?.reduce(
        (sum, r) => sum + (r.paid_amount || 0),
        0
      ) || 0;

      setStats({
        totalContracts: totalContracts || 0,
        activeInsured: activeInsured || 0,
        pendingReimbursements: pendingReimbursementsCount || 0,
        monthlyContributionsTotal: contributionsTotal,
        monthlyReimbursementsTotal: reimbursementsTotal,
        totalContributionsPaid: totalContributions,
        totalReimbursementsPaid: totalReimbursements,
        contractsThisMonth: contractsThisMonth || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchMonthlyTrends = async () => {
    try {
      const trends: MonthlyTrend[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        // Count contracts created in this month
        const { count: subscriptions } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        // Count reimbursements created in this month
        const { count: reimbursements } = await supabase
          .from('reimbursements')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        trends.push({
          month: format(monthDate, 'MMM', { locale: fr }),
          subscriptions: subscriptions || 0,
          reimbursements: reimbursements || 0,
        });
      }

      setMonthlyTrends(trends);
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
    }
  };

  const fetchReimbursementsByStatus = async () => {
    try {
      const statuses = ['soumis', 'verification', 'valide', 'paye', 'rejete'] as const;
      const statusCounts: ReimbursementsByStatus = {
        soumis: 0,
        verification: 0,
        valide: 0,
        paye: 0,
        rejete: 0,
      };

      for (const status of statuses) {
        const { count } = await supabase
          .from('reimbursements')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        statusCounts[status] = count || 0;
      }

      setReimbursementsByStatus(statusCounts);
    } catch (error) {
      console.error('Error fetching reimbursements by status:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('id, action, entity_type, details, user_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchPendingReimbursements = async () => {
    try {
      const { data: reimbursements } = await supabase
        .from('reimbursements')
        .select(`
          id,
          reimbursement_number,
          claimed_amount,
          medical_date,
          status,
          insured:insured_id (first_name, last_name)
        `)
        .in('status', ['soumis', 'verification'])
        .order('created_at', { ascending: false })
        .limit(5);

      const formatted = reimbursements?.map((r) => ({
        id: r.id,
        reimbursement_number: r.reimbursement_number,
        insured_name: r.insured
          ? `${(r.insured as any).first_name} ${(r.insured as any).last_name}`
          : 'N/A',
        claimed_amount: r.claimed_amount,
        medical_date: r.medical_date,
        status: r.status,
      })) || [];

      setPendingReimbursements(formatted);
    } catch (error) {
      console.error('Error fetching pending reimbursements:', error);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchStats(),
      fetchMonthlyTrends(),
      fetchReimbursementsByStatus(),
      fetchRecentActivity(),
      fetchPendingReimbursements(),
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();

    // Set up real-time subscriptions
    const contractsChannel = supabase
      .channel('contracts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contracts' },
        () => {
          fetchStats();
          fetchMonthlyTrends();
        }
      )
      .subscribe();

    const insuredChannel = supabase
      .channel('insured-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insured' },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const reimbursementsChannel = supabase
      .channel('reimbursements-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reimbursements' },
        () => {
          fetchStats();
          fetchReimbursementsByStatus();
          fetchPendingReimbursements();
          fetchMonthlyTrends();
        }
      )
      .subscribe();

    const auditChannel = supabase
      .channel('audit-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        () => {
          fetchRecentActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(insuredChannel);
      supabase.removeChannel(reimbursementsChannel);
      supabase.removeChannel(auditChannel);
    };
  }, []);

  return {
    stats,
    monthlyTrends,
    reimbursementsByStatus,
    recentActivity,
    pendingReimbursements,
    isLoading,
    refetch: fetchAllData,
  };
}
