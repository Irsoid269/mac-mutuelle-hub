import { supabase } from '@/integrations/supabase/client';
import { offlineDb, generateUUID, nowISO, PendingChange } from './offlineDb';

// Configuration des tables à synchroniser
const SYNC_TABLES = [
  { name: 'contracts', localTable: offlineDb.contracts, supabaseTable: 'contracts' },
  { name: 'insured', localTable: offlineDb.insured, supabaseTable: 'insured' },
  { name: 'beneficiaries', localTable: offlineDb.beneficiaries, supabaseTable: 'beneficiaries' },
  { name: 'contributions', localTable: offlineDb.contributions, supabaseTable: 'contributions' },
  { name: 'contributionPayments', localTable: offlineDb.contributionPayments, supabaseTable: 'contribution_payments' },
  { name: 'reimbursements', localTable: offlineDb.reimbursements, supabaseTable: 'reimbursements' },
  { name: 'healthcareProviders', localTable: offlineDb.healthcareProviders, supabaseTable: 'healthcare_providers' },
  { name: 'documents', localTable: offlineDb.documents, supabaseTable: 'documents' },
  { name: 'reimbursementCeilings', localTable: offlineDb.reimbursementCeilings, supabaseTable: 'reimbursement_ceilings' },
  { name: 'healthDeclarations', localTable: offlineDb.healthDeclarations, supabaseTable: 'health_declarations' },
  { name: 'auditLogs', localTable: offlineDb.auditLogs, supabaseTable: 'audit_logs' },
  { name: 'careAuthorizations', localTable: offlineDb.careAuthorizations, supabaseTable: 'care_authorizations' },
] as const;

type SyncTableName = typeof SYNC_TABLES[number]['name'];

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    // Écouter les changements de connexion
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  // Obtenir le statut actuel
  get online(): boolean {
    return this.isOnline;
  }

  get syncing(): boolean {
    return this.isSyncing;
  }

  // S'abonner aux changements de statut
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  private notifyListeners() {
    const status: SyncStatus = {
      online: this.isOnline,
      syncing: this.isSyncing,
    };
    this.syncListeners.forEach(listener => listener(status));
  }

  private handleOnline() {
    console.log('[SyncService] Online detected');
    this.isOnline = true;
    this.notifyListeners();
    // Déclencher la synchronisation
    this.syncAll();
  }

  private handleOffline() {
    console.log('[SyncService] Offline detected');
    this.isOnline = false;
    this.notifyListeners();
  }

  // Ajouter un changement en attente
  async addPendingChange(
    tableName: string,
    recordId: string,
    operation: 'insert' | 'update' | 'delete',
    data: Record<string, unknown>
  ): Promise<void> {
    const change: PendingChange = {
      id: generateUUID(),
      tableName,
      recordId,
      operation,
      data: JSON.stringify(data),
      createdAt: nowISO(),
      retryCount: 0,
    };
    await offlineDb.pendingChanges.add(change);
    console.log(`[SyncService] Added pending ${operation} for ${tableName}/${recordId}`);

    // Si on est en ligne, synchroniser immédiatement
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingChanges();
    }
  }

  // Synchroniser les changements en attente vers Supabase
  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    const pendingChanges = await offlineDb.pendingChanges.orderBy('createdAt').toArray();
    if (pendingChanges.length === 0) return;

    console.log(`[SyncService] Syncing ${pendingChanges.length} pending changes...`);
    this.isSyncing = true;
    this.notifyListeners();

    for (const change of pendingChanges) {
      try {
        const tableConfig = SYNC_TABLES.find(t => t.name === change.tableName);
        if (!tableConfig) {
          console.warn(`[SyncService] Unknown table: ${change.tableName}`);
          continue;
        }

        const data = JSON.parse(change.data);
        // Retirer les métadonnées de sync avant d'envoyer à Supabase
        const { _syncStatus, _localUpdatedAt, _serverUpdatedAt, ...cleanData } = data;

        let error: Error | null = null;

        switch (change.operation) {
          case 'insert':
            const insertResult = await supabase
              .from(tableConfig.supabaseTable)
              .insert(cleanData);
            error = insertResult.error as Error | null;
            break;

          case 'update':
            const updateResult = await supabase
              .from(tableConfig.supabaseTable)
              .update(cleanData)
              .eq('id', change.recordId);
            error = updateResult.error as Error | null;
            break;

          case 'delete':
            const deleteResult = await supabase
              .from(tableConfig.supabaseTable)
              .delete()
              .eq('id', change.recordId);
            error = deleteResult.error as Error | null;
            break;
        }

        if (error) {
          console.error(`[SyncService] Error syncing ${change.operation} for ${change.tableName}:`, error);
          // Incrémenter le compteur de retry
          await offlineDb.pendingChanges.update(change.id, {
            retryCount: change.retryCount + 1
          });
        } else {
          // Succès - supprimer le changement en attente et mettre à jour le statut local
          await offlineDb.pendingChanges.delete(change.id);
          
          // Mettre à jour le statut de sync dans la table locale
          if (change.operation !== 'delete') {
            const localTable = tableConfig.localTable as any;
            await localTable.update(change.recordId, {
              _syncStatus: 'synced',
              _serverUpdatedAt: nowISO()
            });
          }
          
          console.log(`[SyncService] Successfully synced ${change.operation} for ${change.tableName}/${change.recordId}`);
        }
      } catch (err) {
        console.error(`[SyncService] Exception syncing change:`, err);
        await offlineDb.pendingChanges.update(change.id, {
          retryCount: change.retryCount + 1
        });
      }
    }

    this.isSyncing = false;
    this.notifyListeners();
  }

  // Télécharger les données du serveur vers le local
  async pullFromServer(tableName?: SyncTableName): Promise<void> {
    if (!this.isOnline) {
      console.log('[SyncService] Offline - cannot pull from server');
      return;
    }

    const tablesToSync = tableName 
      ? SYNC_TABLES.filter(t => t.name === tableName)
      : SYNC_TABLES;

    this.isSyncing = true;
    this.notifyListeners();

    for (const tableConfig of tablesToSync) {
      try {
        console.log(`[SyncService] Pulling ${tableConfig.name} from server...`);
        
        const { data, error } = await supabase
          .from(tableConfig.supabaseTable)
          .select('*');

        if (error) {
          console.error(`[SyncService] Error pulling ${tableConfig.name}:`, error);
          continue;
        }

        if (!data || data.length === 0) {
          console.log(`[SyncService] No data for ${tableConfig.name}`);
          continue;
        }

        // Pour chaque enregistrement du serveur
        const localTable = tableConfig.localTable as any;
        
        for (const serverRecord of data) {
          const localRecord = await localTable.get(serverRecord.id);
          
          const record = serverRecord as Record<string, unknown>;
          const syncTimestamp = (record.updated_at as string) || (record.created_at as string);
          
          if (!localRecord) {
            // Nouveau record du serveur - insérer localement
            await localTable.add({
              ...serverRecord,
              _syncStatus: 'synced',
              _localUpdatedAt: syncTimestamp,
              _serverUpdatedAt: syncTimestamp,
            });
          } else if (localRecord._syncStatus === 'synced') {
            // Record local synchronisé - mettre à jour avec les données serveur
            await localTable.update(serverRecord.id, {
              ...serverRecord,
              _syncStatus: 'synced',
              _localUpdatedAt: syncTimestamp,
              _serverUpdatedAt: syncTimestamp,
            });
          } else if (localRecord._syncStatus === 'pending') {
            // Le local gagne - ne pas écraser les modifications locales
            console.log(`[SyncService] Skipping ${tableConfig.name}/${serverRecord.id} - local changes pending`);
          }
        }

        // Mettre à jour l'info de sync
        await offlineDb.syncInfo.put({
          id: tableConfig.name,
          tableName: tableConfig.name,
          lastSyncAt: nowISO(),
          syncStatus: 'idle'
        });

        console.log(`[SyncService] Pulled ${data.length} records for ${tableConfig.name}`);
      } catch (err) {
        console.error(`[SyncService] Exception pulling ${tableConfig.name}:`, err);
      }
    }

    this.isSyncing = false;
    this.notifyListeners();
  }

  // Synchronisation complète bidirectionnelle
  async syncAll(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    console.log('[SyncService] Starting full sync...');
    
    // D'abord, pousser les changements locaux
    await this.syncPendingChanges();
    
    // Ensuite, tirer les données du serveur
    await this.pullFromServer();
    
    console.log('[SyncService] Full sync complete');
  }

  // Obtenir le nombre de changements en attente
  async getPendingCount(): Promise<number> {
    return await offlineDb.pendingChanges.count();
  }

  // Forcer une resynchronisation complète (efface les données locales et retélécharge)
  async forceFullSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot force sync while offline');
    }

    console.log('[SyncService] Force full sync - clearing local data...');
    
    // Effacer toutes les tables locales
    await Promise.all([
      offlineDb.contracts.clear(),
      offlineDb.insured.clear(),
      offlineDb.beneficiaries.clear(),
      offlineDb.contributions.clear(),
      offlineDb.contributionPayments.clear(),
      offlineDb.reimbursements.clear(),
      offlineDb.healthcareProviders.clear(),
      offlineDb.documents.clear(),
      offlineDb.reimbursementCeilings.clear(),
      offlineDb.healthDeclarations.clear(),
      offlineDb.auditLogs.clear(),
      offlineDb.careAuthorizations.clear(),
      offlineDb.syncInfo.clear(),
      offlineDb.pendingChanges.clear(),
    ]);

    // Retélécharger depuis le serveur
    await this.pullFromServer();
    
    console.log('[SyncService] Force full sync complete');
  }
}

export interface SyncStatus {
  online: boolean;
  syncing: boolean;
}

// Instance singleton
export const syncService = new SyncService();
