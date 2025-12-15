import { useState, useEffect, useCallback } from 'react';
import { offlineDb, generateUUID, nowISO, LocalReimbursement, LocalInsured, LocalContribution, LocalHealthcareProvider } from '@/lib/offlineDb';
import { syncService } from '@/lib/syncService';
import { supabase } from '@/integrations/supabase/client';

interface Reimbursement {
  id: string;
  reimbursement_number: string;
  insured_id: string;
  claimed_amount: number;
  approved_amount: number | null;
  paid_amount: number | null;
  medical_date: string;
  doctor_name: string | null;
  care_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  validated_at: string | null;
  paid_at: string | null;
  provider_id?: string | null;
  insured?: {
    first_name: string;
    last_name: string;
    matricule: string;
  };
  provider?: {
    name: string;
    provider_type: string;
    is_conventioned: boolean;
  };
}

interface PaidInsured {
  id: string;
  first_name: string;
  last_name: string;
  matricule: string;
  contract_id: string;
}

export function useReimbursementsDataOffline(searchTerm: string = '', statusFilter: string = '') {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [paidInsuredList, setPaidInsuredList] = useState<PaidInsured[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState({
    total: 0,
    soumis: 0,
    verification: 0,
    valide: 0,
    paye: 0,
    rejete: 0,
  });

  // Charger depuis IndexedDB
  const loadFromLocal = useCallback(async () => {
    try {
      const localReimbursements = await offlineDb.reimbursements.toArray();
      const localInsured = await offlineDb.insured.toArray();
      const localContributions = await offlineDb.contributions.toArray();
      const localProviders = await offlineDb.healthcareProviders.toArray();

      // Maps pour les lookups
      const insuredMap = new Map<string, LocalInsured>();
      localInsured.forEach(ins => insuredMap.set(ins.id, ins));

      const providerMap = new Map<string, LocalHealthcareProvider>();
      localProviders.forEach(p => providerMap.set(p.id, p));

      // Contrats avec cotisations payées
      const paidContractIds = new Set(
        localContributions
          .filter(c => c.payment_status === 'paye')
          .map(c => c.contract_id)
      );

      // Liste des assurés ayant payé
      const paidInsured: PaidInsured[] = localInsured
        .filter(ins => paidContractIds.has(ins.contract_id))
        .map(ins => ({
          id: ins.id,
          first_name: ins.first_name,
          last_name: ins.last_name,
          matricule: ins.matricule,
          contract_id: ins.contract_id,
        }));

      // Enrichir les remboursements
      let enriched: Reimbursement[] = localReimbursements.map(r => {
        const ins = insuredMap.get(r.insured_id);
        const prov = r.provider_id ? providerMap.get(r.provider_id) : undefined;

        return {
          id: r.id,
          reimbursement_number: r.reimbursement_number,
          insured_id: r.insured_id,
          claimed_amount: r.claimed_amount,
          approved_amount: r.approved_amount || null,
          paid_amount: r.paid_amount || null,
          medical_date: r.medical_date,
          doctor_name: r.doctor_name || null,
          care_type: r.care_type,
          status: r.status,
          notes: r.notes || null,
          created_at: r.created_at,
          validated_at: r.validated_at || null,
          paid_at: r.paid_at || null,
          provider_id: r.provider_id || null,
          insured: ins ? {
            first_name: ins.first_name,
            last_name: ins.last_name,
            matricule: ins.matricule,
          } : undefined,
          provider: prov ? {
            name: prov.name,
            provider_type: prov.provider_type,
            is_conventioned: prov.is_conventioned,
          } : undefined,
        };
      });

      // Trier par date
      enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculer les stats
      const allStats = {
        total: enriched.length,
        soumis: enriched.filter(r => r.status === 'soumis').length,
        verification: enriched.filter(r => r.status === 'verification').length,
        valide: enriched.filter(r => r.status === 'valide').length,
        paye: enriched.filter(r => r.status === 'paye').length,
        rejete: enriched.filter(r => r.status === 'rejete').length,
      };

      // Appliquer les filtres
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        enriched = enriched.filter(r =>
          r.reimbursement_number.toLowerCase().includes(search) ||
          `${r.insured?.first_name} ${r.insured?.last_name}`.toLowerCase().includes(search)
        );
      }

      if (statusFilter && statusFilter !== 'all') {
        enriched = enriched.filter(r => r.status === statusFilter);
      }

      return { reimbursements: enriched, stats: allStats, paidInsured };
    } catch (error) {
      console.error('[useReimbursementsDataOffline] Error loading local data:', error);
      return { 
        reimbursements: [], 
        stats: { total: 0, soumis: 0, verification: 0, valide: 0, paye: 0, rejete: 0 },
        paidInsured: []
      };
    }
  }, [searchTerm, statusFilter]);

  // Synchroniser avec Supabase
  const syncFromServer = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const [
        { data: serverReimbursements },
        { data: serverInsured },
        { data: serverContributions },
        { data: serverProviders }
      ] = await Promise.all([
        supabase.from('reimbursements').select('*').order('created_at', { ascending: false }),
        supabase.from('insured').select('*'),
        supabase.from('contributions').select('*'),
        supabase.from('healthcare_providers').select('*')
      ]);

      // Mettre à jour IndexedDB
      for (const record of (serverReimbursements || [])) {
        const existing = await offlineDb.reimbursements.get(record.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.reimbursements.put({
            ...record,
            exclusions: record.exclusions ? JSON.stringify(record.exclusions) : undefined,
            _syncStatus: 'synced',
            _localUpdatedAt: record.updated_at,
            _serverUpdatedAt: record.updated_at,
          } as LocalReimbursement);
        }
      }

      for (const record of (serverInsured || [])) {
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

      for (const record of (serverContributions || [])) {
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

      for (const record of (serverProviders || [])) {
        const existing = await offlineDb.healthcareProviders.get(record.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.healthcareProviders.put({
            ...record,
            tarifs: record.tarifs ? JSON.stringify(record.tarifs) : undefined,
            _syncStatus: 'synced',
            _localUpdatedAt: record.updated_at,
            _serverUpdatedAt: record.updated_at,
          });
        }
      }
    } catch (error) {
      console.error('[useReimbursementsDataOffline] Sync error:', error);
    }
  }, []);

  // Fetch principal
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        await syncFromServer();
      }
      const { reimbursements: data, stats: newStats, paidInsured } = await loadFromLocal();
      setReimbursements(data);
      setStats(newStats);
      setPaidInsuredList(paidInsured);
    } catch (error) {
      console.error('[useReimbursementsDataOffline] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadFromLocal, syncFromServer]);

  // Créer un remboursement (offline-first)
  const createReimbursement = useCallback(async (data: {
    insured_id: string;
    claimed_amount: number;
    medical_date: string;
    provider_id?: string;
    care_type: string;
    notes?: string;
    files?: File[];
  }) => {
    const reimbursementNumber = `RMB-${Date.now().toString(36).toUpperCase()}`;
    const id = generateUUID();
    const now = nowISO();

    const newRecord: LocalReimbursement = {
      id,
      reimbursement_number: reimbursementNumber,
      insured_id: data.insured_id,
      claimed_amount: data.claimed_amount,
      medical_date: data.medical_date,
      provider_id: data.provider_id,
      care_type: data.care_type,
      notes: data.notes,
      status: 'soumis',
      created_at: now,
      updated_at: now,
      _syncStatus: navigator.onLine ? 'synced' : 'pending',
      _localUpdatedAt: now,
    };

    // Sauvegarder localement
    await offlineDb.reimbursements.add(newRecord);

    // Ajouter à la queue de sync
    await syncService.addPendingChange('reimbursements', id, 'insert', newRecord as unknown as Record<string, unknown>);

    // Si online et avec fichiers, les uploader
    if (navigator.onLine && data.files && data.files.length > 0) {
      for (const file of data.files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        await supabase.storage
          .from('reimbursement-documents')
          .upload(fileName, file);

        await supabase.from('documents').insert({
          name: file.name,
          file_url: fileName,
          file_size: file.size,
          mime_type: file.type,
          document_type: 'justificatif',
          related_type: 'reimbursement',
          related_id: id,
        });
      }
    }

    await fetchData();
  }, [fetchData]);

  // Mettre à jour le statut
  const updateStatus = useCallback(async (id: string, newStatus: string, approvedAmount?: number, paidAmount?: number) => {
    const existing = await offlineDb.reimbursements.get(id);
    if (!existing) return;

    const now = nowISO();
    const updates: Partial<LocalReimbursement> = {
      status: newStatus,
      updated_at: now,
      _syncStatus: navigator.onLine ? 'synced' : 'pending',
      _localUpdatedAt: now,
    };

    if (newStatus === 'valide') {
      updates.validated_at = now;
      if (approvedAmount !== undefined) {
        updates.approved_amount = approvedAmount;
      }
    }

    if (newStatus === 'paye') {
      updates.paid_at = now;
      if (paidAmount !== undefined) {
        updates.paid_amount = paidAmount;
      }
    }

    await offlineDb.reimbursements.update(id, updates);
    await syncService.addPendingChange('reimbursements', id, 'update', { ...existing, ...updates } as unknown as Record<string, unknown>);

    await fetchData();
  }, [fetchData]);

  // Documents functions (require online)
  const getReimbursementDocuments = async (reimbursementId: string) => {
    if (!navigator.onLine) return [];
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('related_type', 'reimbursement')
      .eq('related_id', reimbursementId);
    
    if (error) throw error;
    return data || [];
  };

  const getDocumentUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('reimbursement-documents')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  // Charger au montage
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription si online
  useEffect(() => {
    if (!navigator.onLine) return;

    const channel = supabase
      .channel('reimbursements-offline-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reimbursements' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return {
    reimbursements,
    paidInsuredList,
    stats,
    isLoading,
    isOnline,
    refetch: fetchData,
    createReimbursement,
    updateStatus,
    getReimbursementDocuments,
    getDocumentUrl,
  };
}
