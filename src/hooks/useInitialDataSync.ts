import { useEffect, useState, useCallback } from 'react';
import { offlineDb } from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';
import { syncService } from '@/lib/syncService';

/**
 * Hook qui synchronise les données initiales depuis Supabase vers IndexedDB
 * au démarrage de l'application (si en ligne)
 */
export function useInitialDataSync() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 12 });

  const initializeData = useCallback(async () => {
    if (!navigator.onLine) {
      console.log('[InitialSync] Offline - using cached data');
      setIsInitializing(false);
      return;
    }

    console.log('[InitialSync] Starting initial data sync...');
    setIsInitializing(true);

    try {
      // Sync contracts
      setProgress({ current: 1, total: 12 });
      const { data: contracts } = await supabase.from('contracts').select('*');
      for (const r of (contracts || [])) {
        const existing = await offlineDb.contracts.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.contracts.put({
            ...r,
            _syncStatus: 'synced',
            _localUpdatedAt: r.updated_at,
            _serverUpdatedAt: r.updated_at,
          });
        }
      }

      // Sync insured
      setProgress({ current: 2, total: 12 });
      const { data: insured } = await supabase.from('insured').select('*');
      for (const r of (insured || [])) {
        const existing = await offlineDb.insured.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.insured.put({
            ...r,
            _syncStatus: 'synced',
            _localUpdatedAt: r.updated_at,
            _serverUpdatedAt: r.updated_at,
          });
        }
      }

      // Sync beneficiaries
      setProgress({ current: 3, total: 12 });
      const { data: beneficiaries } = await supabase.from('beneficiaries').select('*');
      for (const r of (beneficiaries || [])) {
        const existing = await offlineDb.beneficiaries.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.beneficiaries.put({
            ...r,
            _syncStatus: 'synced',
            _localUpdatedAt: r.updated_at,
            _serverUpdatedAt: r.updated_at,
          });
        }
      }

      // Sync contributions
      setProgress({ current: 4, total: 12 });
      const { data: contributions } = await supabase.from('contributions').select('*');
      for (const r of (contributions || [])) {
        const existing = await offlineDb.contributions.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.contributions.put({
            ...r,
            _syncStatus: 'synced',
            _localUpdatedAt: r.updated_at,
            _serverUpdatedAt: r.updated_at,
          });
        }
      }

      // Sync contribution_payments
      setProgress({ current: 5, total: 12 });
      const { data: payments } = await supabase.from('contribution_payments').select('*');
      for (const r of (payments || [])) {
        const existing = await offlineDb.contributionPayments.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.contributionPayments.put({
            ...r,
            _syncStatus: 'synced',
            _localUpdatedAt: r.created_at,
            _serverUpdatedAt: r.created_at,
          });
        }
      }

      // Sync reimbursements
      setProgress({ current: 6, total: 12 });
      const { data: reimbursements } = await supabase.from('reimbursements').select('*');
      for (const r of (reimbursements || [])) {
        const existing = await offlineDb.reimbursements.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.reimbursements.put({
            ...r,
            exclusions: r.exclusions ? JSON.stringify(r.exclusions) : undefined,
            _syncStatus: 'synced',
            _localUpdatedAt: r.updated_at,
            _serverUpdatedAt: r.updated_at,
          });
        }
      }

      // Sync healthcare_providers
      setProgress({ current: 7, total: 12 });
      const { data: providers } = await supabase.from('healthcare_providers').select('*');
      for (const r of (providers || [])) {
        const existing = await offlineDb.healthcareProviders.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.healthcareProviders.put({
            ...r,
            tarifs: r.tarifs ? JSON.stringify(r.tarifs) : undefined,
            _syncStatus: 'synced',
            _localUpdatedAt: r.updated_at,
            _serverUpdatedAt: r.updated_at,
          });
        }
      }

      // Sync documents
      setProgress({ current: 8, total: 12 });
      const { data: documents } = await supabase.from('documents').select('*');
      for (const r of (documents || [])) {
        const existing = await offlineDb.documents.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.documents.put({
            ...r,
            _syncStatus: 'synced',
            _localUpdatedAt: r.created_at,
            _serverUpdatedAt: r.created_at,
          });
        }
      }

      // Sync reimbursement_ceilings
      setProgress({ current: 9, total: 12 });
      const { data: ceilings } = await supabase.from('reimbursement_ceilings').select('*');
      for (const r of (ceilings || [])) {
        const existing = await offlineDb.reimbursementCeilings.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.reimbursementCeilings.put({
            ...r,
            _syncStatus: 'synced',
            _localUpdatedAt: r.updated_at,
            _serverUpdatedAt: r.updated_at,
          });
        }
      }

      // Sync health_declarations
      setProgress({ current: 10, total: 12 });
      const { data: declarations } = await supabase.from('health_declarations').select('*');
      for (const r of (declarations || [])) {
        const existing = await offlineDb.healthDeclarations.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.healthDeclarations.put({
            ...r,
            _syncStatus: 'synced',
            _localUpdatedAt: r.created_at,
            _serverUpdatedAt: r.created_at,
          });
        }
      }

      // Sync audit_logs (only last 100)
      setProgress({ current: 11, total: 12 });
      const { data: auditLogs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      for (const r of (auditLogs || [])) {
        const existing = await offlineDb.auditLogs.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.auditLogs.put({
            ...r,
            old_values: r.old_values ? JSON.stringify(r.old_values) : undefined,
            new_values: r.new_values ? JSON.stringify(r.new_values) : undefined,
            _syncStatus: 'synced',
            _localUpdatedAt: r.created_at,
            _serverUpdatedAt: r.created_at,
          });
        }
      }

      // Sync care_authorizations
      setProgress({ current: 12, total: 12 });
      const { data: authorizations } = await supabase.from('care_authorizations').select('*');
      for (const r of (authorizations || [])) {
        const existing = await offlineDb.careAuthorizations.get(r.id);
        if (!existing || existing._syncStatus === 'synced') {
          await offlineDb.careAuthorizations.put({
            ...r,
            _syncStatus: 'synced',
            _localUpdatedAt: r.updated_at,
            _serverUpdatedAt: r.updated_at,
          });
        }
      }

      console.log('[InitialSync] Initial data sync complete');
    } catch (error) {
      console.error('[InitialSync] Error during initial sync:', error);
    }

    setIsInitializing(false);
  }, []);

  useEffect(() => {
    initializeData();

    // Écouter les changements de connexion
    const handleOnline = () => {
      console.log('[InitialSync] Back online - resyncing...');
      syncService.syncAll();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [initializeData]);

  return { isInitializing, progress };
}
