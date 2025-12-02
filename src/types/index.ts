// Types for MAC ASSURANCE Health Insurance Management System

export type UserRole = 'admin' | 'agent' | 'medecin' | 'comptabilite';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export type SubscriptionStatus = 'en_attente' | 'validee' | 'rejetee' | 'reserve_medicale';

export interface Subscription {
  id: string;
  contractNumber: string;
  clientCode: string;
  raisonSociale: string;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
  insuredId: string;
}

export interface Insured {
  id: string;
  contractNumber: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  birthDate: Date;
  birthPlace: string;
  address: string;
  phone: string;
  email: string;
  employer: string;
  jobTitle: string;
  workLocation: string;
  insuranceStartDate: Date;
  maritalStatus: 'marie' | 'celibataire' | 'veuf' | 'divorce' | 'separe';
  createdAt: Date;
}

export interface Spouse {
  id: string;
  insuredId: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  birthPlace: string;
  address: string;
  employer: string;
  jobTitle: string;
  workLocation: string;
  insuranceStartDate: Date;
}

export interface FamilyMember {
  id: string;
  insuredId: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  relationship: 'enfant' | 'parent' | 'autre';
  gender: 'M' | 'F';
  age: number;
}

export interface HealthDeclaration {
  id: string;
  insuredId: string;
  question: string;
  answer: boolean;
  details?: string;
}

export type ReimbursementStatus = 'soumis' | 'verification' | 'valide' | 'paye' | 'rejete';

export interface Reimbursement {
  id: string;
  reimbursementNumber: string;
  insuredId: string;
  insuredName: string;
  matricule: string;
  amount: number;
  amountInWords: string;
  medicalDate: Date;
  doctorName: string;
  paidBy: string;
  status: ReimbursementStatus;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
  validatedBy?: string;
  paidAt?: Date;
}

export interface Document {
  id: string;
  name: string;
  type: 'souscription' | 'remboursement' | 'justificatif' | 'autre';
  url: string;
  uploadedAt: Date;
  relatedId: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface DashboardStats {
  totalSubscriptions: number;
  activeInsured: number;
  pendingReimbursements: number;
  monthlyReimbursementTotal: number;
  subscriptionsThisMonth: number;
  reimbursementsByStatus: {
    soumis: number;
    verification: number;
    valide: number;
    paye: number;
    rejete: number;
  };
  monthlyTrends: {
    month: string;
    subscriptions: number;
    reimbursements: number;
  }[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
