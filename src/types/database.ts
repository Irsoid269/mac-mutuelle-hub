// Database types for MAC ASSURANCE
export type AppRole = 'admin' | 'agent' | 'medecin' | 'comptabilite' | 'dirigeant';
export type SubscriptionStatus = 'en_attente' | 'validee' | 'rejetee' | 'reserve_medicale';
export type ReimbursementStatus = 'soumis' | 'verification' | 'valide' | 'paye' | 'rejete';
export type CareStatus = 'soumis' | 'en_verification' | 'valide' | 'ferme' | 'rejete';
export type MaritalStatus = 'marie' | 'celibataire' | 'veuf' | 'divorce' | 'separe';
export type Gender = 'M' | 'F';
export type RelationshipType = 'conjoint' | 'enfant' | 'parent' | 'autre';
export type DocumentType = 'souscription' | 'remboursement' | 'prise_en_charge' | 'quittance' | 'justificatif' | 'autre';
export type ProviderType = 'hopital' | 'clinique' | 'laboratoire' | 'pharmacie' | 'medecin' | 'autre';
export type PaymentStatus = 'en_attente' | 'paye' | 'partiel' | 'annule';

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Contract {
  id: string;
  contract_number: string;
  client_code: string;
  raison_sociale: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Insured {
  id: string;
  contract_id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  maiden_name: string | null;
  birth_date: string;
  birth_place: string | null;
  gender: Gender;
  marital_status: MaritalStatus;
  address: string | null;
  phone: string | null;
  email: string | null;
  employer: string | null;
  job_title: string | null;
  work_location: string | null;
  insurance_start_date: string;
  insurance_end_date: string | null;
  photo_url: string | null;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface Beneficiary {
  id: string;
  insured_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string | null;
  gender: Gender;
  relationship: RelationshipType;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthDeclaration {
  id: string;
  insured_id: string;
  question: string;
  answer: boolean;
  details: string | null;
  declaration_date: string;
  created_at: string;
}

export interface HealthcareProvider {
  id: string;
  name: string;
  provider_type: ProviderType;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  convention_number: string | null;
  is_conventioned: boolean;
  tarifs: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContributionFormula {
  id: string;
  name: string;
  description: string | null;
  base_rate: number;
  family_rate: number | null;
  ceiling: number | null;
  options: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  contract_id: string;
  formula_id: string | null;
  period_start: string;
  period_end: string;
  amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  payment_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CareAuthorization {
  id: string;
  authorization_number: string;
  insured_id: string;
  beneficiary_id: string | null;
  provider_id: string | null;
  care_type: string;
  care_date: string;
  estimated_amount: number;
  approved_amount: number | null;
  ceiling_amount: number | null;
  status: CareStatus;
  doctor_name: string | null;
  diagnosis: string | null;
  notes: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reimbursement {
  id: string;
  reimbursement_number: string;
  insured_id: string;
  beneficiary_id: string | null;
  care_authorization_id: string | null;
  provider_id: string | null;
  medical_date: string;
  care_type: string;
  claimed_amount: number;
  approved_amount: number | null;
  paid_amount: number | null;
  exclusions: Record<string, unknown> | null;
  status: ReimbursementStatus;
  doctor_name: string | null;
  paid_by: string | null;
  payment_reference: string | null;
  notes: string | null;
  validated_by: string | null;
  validated_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  name: string;
  document_type: DocumentType;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  related_type: string;
  related_id: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Dashboard stats
export interface DashboardStats {
  totalContracts: number;
  activeInsured: number;
  pendingReimbursements: number;
  monthlyReimbursementTotal: number;
  subscriptionsThisMonth: number;
  contributionsCollected: number;
  reimbursementsByStatus: Record<ReimbursementStatus, number>;
  monthlyTrends: {
    month: string;
    subscriptions: number;
    reimbursements: number;
    contributions: number;
  }[];
}
