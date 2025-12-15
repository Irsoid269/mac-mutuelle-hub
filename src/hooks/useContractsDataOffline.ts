import { useState, useEffect, useCallback } from 'react';
import { offlineDb, LocalContract, LocalInsured } from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';

interface Contract {
  id: string;
  contract_number: string;
  client_code: string;
  raison_sociale: string;
  status: string;
  start_date: string;
  end_date: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  insured?: {
    id: string;
    first_name: string;
    last_name: string;
    matricule: string;
  }[];
}

export function useContractsDataOffline(searchTerm: string = '', statusFilter: string = '') {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState({
    total: 0,
    en_attente: 0,
    validee: 0,
    rejetee: 0,
    reserve_medicale: 0,
  });

  // Charger depuis IndexedDB
  const loadFromLocal = useCallback(async () => {
    try {
      const localContracts = await offlineDb.contracts.toArray();
      const localInsured = await offlineDb.insured.toArray();

      // Grouper les assurés par contrat
      const insuredByContract = new Map<string, LocalInsured[]>();
      localInsured.forEach(ins => {
        const list = insuredByContract.get(ins.contract_id) || [];
        list.push(ins);
        insuredByContract.set(ins.contract_id, list);
      });

      // Enrichir les contrats
      let enriched: Contract[] = localContracts.map(contract => ({
        id: contract.id,
        contract_number: contract.contract_number,
        client_code: contract.client_code,
        raison_sociale: contract.raison_sociale,
        status: contract.status,
        start_date: contract.start_date,
        end_date: contract.end_date || null,
        address: contract.address || null,
        phone: contract.phone || null,
        email: contract.email || null,
        created_at: contract.created_at,
        insured: insuredByContract.get(contract.id)?.map(ins => ({
          id: ins.id,
          first_name: ins.first_name,
          last_name: ins.last_name,
          matricule: ins.matricule,
        })),
      }));

      // Trier par date
      enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculer les stats sur toutes les données
      const allStats = {
        total: enriched.length,
        en_attente: enriched.filter(c => c.status === 'en_attente').length,
        validee: enriched.filter(c => c.status === 'validee').length,
        rejetee: enriched.filter(c => c.status === 'rejetee').length,
        reserve_medicale: enriched.filter(c => c.status === 'reserve_medicale').length,
      };

      // Appliquer les filtres
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        enriched = enriched.filter(c =>
          c.contract_number.toLowerCase().includes(search) ||
          c.raison_sociale.toLowerCase().includes(search) ||
          c.client_code.toLowerCase().includes(search)
        );
      }

      if (statusFilter && statusFilter !== 'all') {
        enriched = enriched.filter(c => c.status === statusFilter);
      }

      return { contracts: enriched, stats: allStats };
    } catch (error) {
      console.error('[useContractsDataOffline] Error loading local data:', error);
      return { contracts: [], stats: { total: 0, en_attente: 0, validee: 0, rejetee: 0, reserve_medicale: 0 } };
    }
  }, [searchTerm, statusFilter]);

  // Synchroniser avec Supabase
  const syncFromServer = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const { data: serverContracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      const { data: serverInsured, error: insuredError } = await supabase
        .from('insured')
        .select('*');

      if (insuredError) throw insuredError;

      // Mettre à jour IndexedDB
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
    } catch (error) {
      console.error('[useContractsDataOffline] Sync error:', error);
    }
  }, []);

  // Fetch principal
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        await syncFromServer();
      }
      const { contracts: data, stats: newStats } = await loadFromLocal();
      setContracts(data);
      setStats(newStats);
    } catch (error) {
      console.error('[useContractsDataOffline] Error:', error);
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

  // Charger au montage
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription si online
  useEffect(() => {
    if (!navigator.onLine) return;

    const channel = supabase
      .channel('contracts-offline-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insured' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { contracts, stats, isLoading, isOnline, refetch: fetchData };
}
