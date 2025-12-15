import Dexie, { Table } from 'dexie';

// Interface pour les métadonnées de sync
interface SyncMetadata {
  _syncStatus: 'synced' | 'pending' | 'conflict';
  _localUpdatedAt: string;
  _serverUpdatedAt?: string;
}

// Types pour les tables locales (miroir de Supabase + métadonnées sync)
export interface LocalContract extends SyncMetadata {
  id: string;
  contract_number: string;
  client_code: string;
  raison_sociale: string;
  address?: string;
  phone?: string;
  email?: string;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface LocalInsured extends SyncMetadata {
  id: string;
  contract_id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  maiden_name?: string;
  birth_date: string;
  birth_place?: string;
  gender: string;
  marital_status: string;
  address?: string;
  phone?: string;
  email?: string;
  employer?: string;
  job_title?: string;
  work_location?: string;
  insurance_start_date: string;
  insurance_end_date?: string;
  photo_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LocalBeneficiary extends SyncMetadata {
  id: string;
  insured_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place?: string;
  gender: string;
  relationship: string;
  phone?: string;
  address?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalContribution extends SyncMetadata {
  id: string;
  contract_id: string;
  formula_id?: string;
  period_start: string;
  period_end: string;
  amount: number;
  paid_amount: number;
  payment_status: string;
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalContributionPayment extends SyncMetadata {
  id: string;
  contribution_id: string;
  amount: number;
  payment_date: string;
  payment_reference?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface LocalReimbursement extends SyncMetadata {
  id: string;
  reimbursement_number: string;
  insured_id: string;
  beneficiary_id?: string;
  care_authorization_id?: string;
  provider_id?: string;
  medical_date: string;
  care_type: string;
  claimed_amount: number;
  approved_amount?: number;
  paid_amount?: number;
  exclusions?: string;
  status: string;
  doctor_name?: string;
  paid_by?: string;
  payment_reference?: string;
  notes?: string;
  validated_by?: string;
  validated_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalHealthcareProvider extends SyncMetadata {
  id: string;
  name: string;
  provider_type: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  convention_number?: string;
  is_conventioned: boolean;
  tarifs?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalDocument extends SyncMetadata {
  id: string;
  name: string;
  document_type: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  related_id: string;
  related_type: string;
  uploaded_by?: string;
  created_at: string;
}

export interface LocalReimbursementCeiling extends SyncMetadata {
  id: string;
  care_type: string;
  reimbursement_rate: number;
  ceiling_amount: number;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalHealthDeclaration extends SyncMetadata {
  id: string;
  insured_id: string;
  question: string;
  answer: boolean;
  details?: string;
  declaration_date: string;
  created_at: string;
}

export interface LocalAuditLog extends SyncMetadata {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  created_at: string;
}

export interface LocalCareAuthorization extends SyncMetadata {
  id: string;
  authorization_number: string;
  insured_id: string;
  beneficiary_id?: string;
  provider_id?: string;
  care_date: string;
  care_type: string;
  estimated_amount: number;
  approved_amount?: number;
  ceiling_amount?: number;
  status: string;
  diagnosis?: string;
  doctor_name?: string;
  notes?: string;
  validated_by?: string;
  validated_at?: string;
  created_at: string;
  updated_at: string;
}

// Métadonnées de synchronisation
export interface SyncInfo {
  id: string;
  tableName: string;
  lastSyncAt: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
}

export interface PendingChange {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'insert' | 'update' | 'delete';
  data: string; // JSON stringified
  createdAt: string;
  retryCount: number;
}

// Classe de base de données Dexie
class MACOfflineDatabase extends Dexie {
  contracts!: Table<LocalContract, string>;
  insured!: Table<LocalInsured, string>;
  beneficiaries!: Table<LocalBeneficiary, string>;
  contributions!: Table<LocalContribution, string>;
  contributionPayments!: Table<LocalContributionPayment, string>;
  reimbursements!: Table<LocalReimbursement, string>;
  healthcareProviders!: Table<LocalHealthcareProvider, string>;
  documents!: Table<LocalDocument, string>;
  reimbursementCeilings!: Table<LocalReimbursementCeiling, string>;
  healthDeclarations!: Table<LocalHealthDeclaration, string>;
  auditLogs!: Table<LocalAuditLog, string>;
  careAuthorizations!: Table<LocalCareAuthorization, string>;
  
  // Tables de gestion de la sync
  syncInfo!: Table<SyncInfo, string>;
  pendingChanges!: Table<PendingChange, string>;

  constructor() {
    super('MACAssuranceDB');

    this.version(1).stores({
      // Tables métier avec index pour recherche et sync
      contracts: 'id, contract_number, client_code, raison_sociale, status, _syncStatus, created_at',
      insured: 'id, contract_id, matricule, [first_name+last_name], status, _syncStatus, created_at',
      beneficiaries: 'id, insured_id, [first_name+last_name], relationship, _syncStatus, created_at',
      contributions: 'id, contract_id, payment_status, period_start, _syncStatus, created_at',
      contributionPayments: 'id, contribution_id, payment_date, _syncStatus, created_at',
      reimbursements: 'id, reimbursement_number, insured_id, status, care_type, _syncStatus, created_at',
      healthcareProviders: 'id, name, provider_type, city, is_conventioned, _syncStatus',
      documents: 'id, related_id, related_type, document_type, _syncStatus, created_at',
      reimbursementCeilings: 'id, care_type, is_active, _syncStatus',
      healthDeclarations: 'id, insured_id, _syncStatus, created_at',
      auditLogs: 'id, entity_type, entity_id, action, _syncStatus, created_at',
      careAuthorizations: 'id, authorization_number, insured_id, status, _syncStatus, created_at',
      
      // Tables de gestion sync
      syncInfo: 'id, tableName, syncStatus',
      pendingChanges: 'id, tableName, recordId, operation, createdAt'
    });
  }
}

// Instance singleton de la base de données
export const offlineDb = new MACOfflineDatabase();

// Helper pour générer un UUID
export function generateUUID(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

// Helper pour le timestamp actuel
export function nowISO(): string {
  return new Date().toISOString();
}
