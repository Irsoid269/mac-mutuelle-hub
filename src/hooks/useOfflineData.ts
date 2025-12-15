import { useState, useEffect, useCallback } from 'react';
import { offlineDb, generateUUID, nowISO } from '@/lib/offlineDb';
import { syncService, SyncStatus } from '@/lib/syncService';
import { supabase } from '@/integrations/supabase/client';
import { Table } from 'dexie';

// Mapping des noms de tables locales vers Supabase
const TABLE_MAPPING: Record<string, string> = {
  contracts: 'contracts',
  insured: 'insured',
  beneficiaries: 'beneficiaries',
  contributions: 'contributions',
  contributionPayments: 'contribution_payments',
  reimbursements: 'reimbursements',
  healthcareProviders: 'healthcare_providers',
  documents: 'documents',
  reimbursementCeilings: 'reimbursement_ceilings',
  healthDeclarations: 'health_declarations',
  auditLogs: 'audit_logs',
  careAuthorizations: 'care_authorizations',
};

// Hook générique pour les opérations offline
export function useOfflineData<T extends { id: string }>(
  tableName: keyof typeof offlineDb & keyof typeof TABLE_MAPPING
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    online: navigator.onLine,
    syncing: false,
  });

  // S'abonner aux changements de statut de sync
  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  // Charger les données depuis IndexedDB
  const loadLocalData = useCallback(async () => {
    try {
      const table = offlineDb[tableName] as Table<T, string>;
      const localData = await table.toArray();
      setData(localData);
    } catch (error) {
      console.error(`[useOfflineData] Error loading ${tableName}:`, error);
    }
  }, [tableName]);

  // Récupérer les données (locale d'abord, puis sync si online)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Charger les données locales d'abord
      await loadLocalData();

      // Si online, synchroniser avec le serveur
      if (navigator.onLine) {
        const supabaseTable = TABLE_MAPPING[tableName] as 'contracts' | 'insured' | 'beneficiaries' | 'contributions' | 'contribution_payments' | 'reimbursements' | 'healthcare_providers' | 'documents' | 'reimbursement_ceilings' | 'health_declarations' | 'audit_logs' | 'care_authorizations';
        const { data: serverData, error } = await supabase
          .from(supabaseTable)
          .select('*');

        if (!error && serverData) {
          const table = offlineDb[tableName] as unknown as Table<Record<string, unknown>, string>;
          
          // Mettre à jour la base locale avec les données serveur
          for (const record of serverData) {
            const recordAny = record as Record<string, unknown>;
            const recordId = recordAny.id as string;
            const existingRecord = await table.get(recordId);
            
            if (!existingRecord || (existingRecord as { _syncStatus?: string })._syncStatus === 'synced') {
              const syncTimestamp = (recordAny.updated_at as string) || (recordAny.created_at as string);
              
              await table.put({
                ...recordAny,
                _syncStatus: 'synced',
                _localUpdatedAt: syncTimestamp,
                _serverUpdatedAt: syncTimestamp,
              });
            }
          }
          
          // Recharger les données locales
          await loadLocalData();
        }
      }
    } catch (error) {
      console.error(`[useOfflineData] Error fetching ${tableName}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, loadLocalData]);

  // Créer un enregistrement
  const create = useCallback(async (record: Omit<T, 'id'>): Promise<T | null> => {
    try {
      const newRecord = {
        ...record,
        id: generateUUID(),
        created_at: nowISO(),
        updated_at: nowISO(),
        _syncStatus: navigator.onLine ? 'synced' : 'pending',
        _localUpdatedAt: nowISO(),
      } as unknown as T & { _syncStatus: string; _localUpdatedAt: string };

      const table = offlineDb[tableName] as Table<T, string>;
      await table.add(newRecord as T);

      // Ajouter à la queue de sync
      await syncService.addPendingChange(tableName, newRecord.id, 'insert', newRecord as unknown as Record<string, unknown>);

      // Recharger les données
      await loadLocalData();
      
      return newRecord as T;
    } catch (error) {
      console.error(`[useOfflineData] Error creating ${tableName}:`, error);
      return null;
    }
  }, [tableName, loadLocalData]);

  // Mettre à jour un enregistrement
  const update = useCallback(async (id: string, updates: Partial<T>): Promise<boolean> => {
    try {
      const table = offlineDb[tableName] as unknown as Table<Record<string, unknown>, string>;
      const existing = await table.get(id);
      
      if (!existing) {
        console.error(`[useOfflineData] Record not found: ${tableName}/${id}`);
        return false;
      }

      const updatedRecord = {
        ...existing,
        ...updates,
        updated_at: nowISO(),
        _syncStatus: navigator.onLine ? 'synced' : 'pending',
        _localUpdatedAt: nowISO(),
      };

      await table.put(updatedRecord);

      // Ajouter à la queue de sync
      await syncService.addPendingChange(tableName, id, 'update', updatedRecord);

      // Recharger les données
      await loadLocalData();
      
      return true;
    } catch (error) {
      console.error(`[useOfflineData] Error updating ${tableName}:`, error);
      return false;
    }
  }, [tableName, loadLocalData]);

  // Supprimer un enregistrement
  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const table = offlineDb[tableName] as Table<T, string>;
      const existing = await table.get(id);
      
      if (!existing) {
        console.error(`[useOfflineData] Record not found for delete: ${tableName}/${id}`);
        return false;
      }

      await table.delete(id);

      // Ajouter à la queue de sync
      await syncService.addPendingChange(tableName, id, 'delete', existing as unknown as Record<string, unknown>);

      // Recharger les données
      await loadLocalData();
      
      return true;
    } catch (error) {
      console.error(`[useOfflineData] Error deleting ${tableName}:`, error);
      return false;
    }
  }, [tableName, loadLocalData]);

  // Charger les données au montage
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Écouter les changements de connexion pour recharger
  useEffect(() => {
    const handleOnline = () => {
      console.log('[useOfflineData] Online - refreshing data');
      fetchData();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchData]);

  return {
    data,
    isLoading,
    syncStatus,
    refetch: fetchData,
    create,
    update,
    remove,
  };
}

// Hook pour obtenir le nombre de changements en attente
export function usePendingChangesCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      const pendingCount = await syncService.getPendingCount();
      setCount(pendingCount);
    };

    updateCount();

    // Mettre à jour toutes les 5 secondes
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return count;
}

// Hook pour le statut de synchronisation global
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus & { pendingCount: number }>({
    online: navigator.onLine,
    syncing: false,
    pendingCount: 0,
  });

  useEffect(() => {
    const unsubscribe = syncService.subscribe(async (syncStatus) => {
      const pendingCount = await syncService.getPendingCount();
      setStatus({ ...syncStatus, pendingCount });
    });

    // Initial load
    const init = async () => {
      const pendingCount = await syncService.getPendingCount();
      setStatus(prev => ({ ...prev, pendingCount }));
    };
    init();

    return unsubscribe;
  }, []);

  const forceSync = useCallback(async () => {
    await syncService.syncAll();
  }, []);

  const forceFullSync = useCallback(async () => {
    await syncService.forceFullSync();
  }, []);

  return { ...status, forceSync, forceFullSync };
}
