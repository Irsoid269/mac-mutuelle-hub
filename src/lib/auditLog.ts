import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'EXPORT' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'STATUS_CHANGE' 
  | 'ROLE_ASSIGN' 
  | 'ROLE_REMOVE'
  | 'PAYMENT';

export type EntityType = 
  | 'user' 
  | 'contract' 
  | 'insured' 
  | 'beneficiary' 
  | 'contribution' 
  | 'reimbursement' 
  | 'document' 
  | 'healthcare_providers' 
  | 'settings'
  | 'user_roles';

interface AuditLogParams {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  details: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export async function logAuditAction({
  action,
  entityType,
  entityId,
  details,
  oldValues,
  newValues,
}: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No user found for audit log');
      return;
    }

    // Get user profile for the name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();

    const userName = profile 
      ? `${profile.first_name} ${profile.last_name}` 
      : user.email || 'Système';

    const { error } = await supabase.from('audit_logs').insert({
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details,
      user_id: user.id,
      user_name: userName,
      old_values: oldValues || null,
      new_values: newValues || null,
    });

    if (error) {
      console.error('Error creating audit log:', error);
    }
  } catch (error) {
    console.error('Error in logAuditAction:', error);
  }
}

// Helper functions for common audit actions
export const auditLog = {
  create: (entityType: EntityType, entityName: string, entityId?: string) =>
    logAuditAction({
      action: 'CREATE',
      entityType,
      entityId,
      details: `Création: ${entityName}`,
    }),

  update: (entityType: EntityType, entityName: string, entityId?: string, changes?: { old?: Record<string, any>; new?: Record<string, any> }) =>
    logAuditAction({
      action: 'UPDATE',
      entityType,
      entityId,
      details: `Modification: ${entityName}`,
      oldValues: changes?.old,
      newValues: changes?.new,
    }),

  delete: (entityType: EntityType, entityName: string, entityId?: string) =>
    logAuditAction({
      action: 'DELETE',
      entityType,
      entityId,
      details: `Suppression: ${entityName}`,
    }),

  statusChange: (entityType: EntityType, entityName: string, oldStatus: string, newStatus: string, entityId?: string) =>
    logAuditAction({
      action: 'STATUS_CHANGE',
      entityType,
      entityId,
      details: `Changement de statut: ${entityName} (${oldStatus} → ${newStatus})`,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
    }),

  roleAssign: (userName: string, role: string, userId?: string) =>
    logAuditAction({
      action: 'ROLE_ASSIGN',
      entityType: 'user_roles',
      entityId: userId,
      details: `Attribution du rôle "${role}" à ${userName}`,
      newValues: { role },
    }),

  roleRemove: (userName: string, role: string, userId?: string) =>
    logAuditAction({
      action: 'ROLE_REMOVE',
      entityType: 'user_roles',
      entityId: userId,
      details: `Retrait du rôle "${role}" de ${userName}`,
      oldValues: { role },
    }),

  payment: (entityType: EntityType, entityName: string, amount: number, entityId?: string) =>
    logAuditAction({
      action: 'PAYMENT',
      entityType,
      entityId,
      details: `Paiement enregistré: ${entityName} - ${amount.toLocaleString('fr-KM')} KMF`,
      newValues: { amount },
    }),

  login: (userEmail: string, userId?: string) =>
    logAuditAction({
      action: 'LOGIN',
      entityType: 'user',
      entityId: userId,
      details: `Connexion de ${userEmail}`,
    }),

  logout: (userEmail: string, userId?: string) =>
    logAuditAction({
      action: 'LOGOUT',
      entityType: 'user',
      entityId: userId,
      details: `Déconnexion de ${userEmail}`,
    }),

  export: (entityType: EntityType, count: number) =>
    logAuditAction({
      action: 'EXPORT',
      entityType,
      details: `Export de ${count} enregistrement(s) - ${entityType}`,
    }),
};
