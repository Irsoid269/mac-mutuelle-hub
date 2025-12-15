import { useState, useEffect, useCallback } from 'react';
import { offlineDb, generateUUID, nowISO, LocalInsured, LocalContribution, LocalContract } from '@/lib/offlineDb';
import { syncService } from '@/lib/syncService';
import { supabase } from '@/integrations/supabase/client';

interface Insured {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  maiden_name: string | null;
  birth_date: string;
  birth_place: string | null;
  gender: 'M' | 'F';
  marital_status: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  employer: string | null;
  job_title: string | null;
  work_location: string | null;
  insurance_start_date: string;
  insurance_end_date: string | null;
  status: string;
  photo_url: string | null;
  contract_id: string;
  created_at: string;
  contract?: {
    contract_number: string;
    raison_sociale: string;
  };
  has_paid_contribution?: boolean;
}

interface InsuredFilters {
  searchTerm?: string;
  status?: string;
  paidOnly?: boolean;
}

export function useInsuredDataOffline(filters: InsuredFilters = {}) {
  const [insured, setInsured] = useState<Insured[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Charger depuis IndexedDB
  const loadFromLocal = useCallback(async () => {
    try {
      const localInsured = await offlineDb.insured.toArray();
      const localContracts = await offlineDb.contracts.toArray();
      const localContributions = await offlineDb.contributions.toArray();

      // Créer un map des contrats
      const contractsMap = new Map<string, LocalContract>();
      localContracts.forEach(c => contractsMap.set(c.id, c));

      // Trouver les contrats avec cotisations payées
      const paidContractIds = new Set(
        localContributions
          .filter(c => c.payment_status === 'paye')
          .map(c => c.contract_id)
      );

      // Enrichir les données
      let enriched: Insured[] = localInsured.map(ins => ({
        id: ins.id,
        matricule: ins.matricule,
        first_name: ins.first_name,
        last_name: ins.last_name,
        maiden_name: ins.maiden_name || null,
        birth_date: ins.birth_date,
        birth_place: ins.birth_place || null,
        gender: ins.gender as 'M' | 'F',
        marital_status: ins.marital_status,
        address: ins.address || null,
        phone: ins.phone || null,
        email: ins.email || null,
        employer: ins.employer || null,
        job_title: ins.job_title || null,
        work_location: ins.work_location || null,
        insurance_start_date: ins.insurance_start_date,
        insurance_end_date: ins.insurance_end_date || null,
        status: ins.status,
        photo_url: ins.photo_url || null,
        contract_id: ins.contract_id,
        created_at: ins.created_at,
        contract: contractsMap.has(ins.contract_id) ? {
          contract_number: contractsMap.get(ins.contract_id)!.contract_number,
          raison_sociale: contractsMap.get(ins.contract_id)!.raison_sociale,
        } : undefined,
        has_paid_contribution: paidContractIds.has(ins.contract_id),
      }));

      // Trier par date de création
      enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Appliquer les filtres
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        enriched = enriched.filter(ins =>
          `${ins.first_name} ${ins.last_name}`.toLowerCase().includes(search) ||
          ins.matricule.toLowerCase().includes(search) ||
          ins.email?.toLowerCase().includes(search) ||
          ins.contract?.contract_number?.toLowerCase().includes(search)
        );
      }

      if (filters.status) {
        enriched = enriched.filter(ins => ins.status === filters.status);
      }

      if (filters.paidOnly) {
        enriched = enriched.filter(ins => ins.has_paid_contribution);
      }

      return enriched;
    } catch (error) {
      console.error('[useInsuredDataOffline] Error loading local data:', error);
      return [];
    }
  }, [filters.searchTerm, filters.status, filters.paidOnly]);

  // Synchroniser avec Supabase
  const syncFromServer = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      // Fetch insured from server
      const { data: serverInsured, error: insuredError } = await supabase
        .from('insured')
        .select('*')
        .order('created_at', { ascending: false });

      if (insuredError) throw insuredError;

      // Fetch contracts
      const { data: serverContracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*');

      if (contractsError) throw contractsError;

      // Fetch contributions
      const { data: serverContributions, error: contribError } = await supabase
        .from('contributions')
        .select('*');

      if (contribError) throw contribError;

      // Mettre à jour IndexedDB
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

      for (const record of (serverContracts || [])) {
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
    } catch (error) {
      console.error('[useInsuredDataOffline] Sync error:', error);
    }
  }, []);

  // Fetch principal
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Si online, synchroniser d'abord
      if (navigator.onLine) {
        await syncFromServer();
      }
      // Charger depuis IndexedDB
      const data = await loadFromLocal();
      setInsured(data);
    } catch (error) {
      console.error('[useInsuredDataOffline] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadFromLocal, syncFromServer]);

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

  // Charger au montage et quand les filtres changent
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription si online
  useEffect(() => {
    if (!navigator.onLine) return;

    const channel = supabase
      .channel('insured-offline-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insured' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { insured, isLoading, isOnline, refetch: fetchData };
}
