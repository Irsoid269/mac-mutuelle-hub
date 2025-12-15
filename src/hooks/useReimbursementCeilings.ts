import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReimbursementCeiling {
  id: string;
  care_type: string;
  reimbursement_rate: number;
  ceiling_amount: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useReimbursementCeilings() {
  const queryClient = useQueryClient();

  const { data: ceilings = [], isLoading, error } = useQuery({
    queryKey: ['reimbursement-ceilings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reimbursement_ceilings')
        .select('*')
        .order('care_type');

      if (error) throw error;
      return data as ReimbursementCeiling[];
    },
  });

  const updateCeiling = useMutation({
    mutationFn: async (ceiling: Partial<ReimbursementCeiling> & { id: string }) => {
      const { data, error } = await supabase
        .from('reimbursement_ceilings')
        .update({
          reimbursement_rate: ceiling.reimbursement_rate,
          ceiling_amount: ceiling.ceiling_amount,
          is_active: ceiling.is_active,
          description: ceiling.description,
        })
        .eq('id', ceiling.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement-ceilings'] });
      toast({
        title: 'Barème mis à jour',
        description: 'Le barème a été modifié avec succès.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le barème.',
        variant: 'destructive',
      });
      console.error('Error updating ceiling:', error);
    },
  });

  const createCeiling = useMutation({
    mutationFn: async (ceiling: Omit<ReimbursementCeiling, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('reimbursement_ceilings')
        .insert(ceiling)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement-ceilings'] });
      toast({
        title: 'Barème créé',
        description: 'Le nouveau barème a été ajouté avec succès.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le barème.',
        variant: 'destructive',
      });
      console.error('Error creating ceiling:', error);
    },
  });

  const deleteCeiling = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reimbursement_ceilings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement-ceilings'] });
      toast({
        title: 'Barème supprimé',
        description: 'Le barème a été supprimé avec succès.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le barème.',
        variant: 'destructive',
      });
      console.error('Error deleting ceiling:', error);
    },
  });

  // Get ceiling for a specific care type
  const getCeilingForCareType = (careType: string): ReimbursementCeiling | undefined => {
    return ceilings.find(c => c.care_type === careType && c.is_active);
  };

  // Calculate approved amount based on ceiling rules
  const calculateApprovedAmount = (careType: string, claimedAmount: number): { 
    approvedAmount: number; 
    rate: number; 
    ceiling: number;
    appliedCeiling: boolean;
  } => {
    const ceilingConfig = getCeilingForCareType(careType);
    
    if (!ceilingConfig) {
      // No ceiling configured, approve full amount
      return { 
        approvedAmount: claimedAmount, 
        rate: 100, 
        ceiling: 0,
        appliedCeiling: false 
      };
    }

    const rate = ceilingConfig.reimbursement_rate;
    const maxCeiling = ceilingConfig.ceiling_amount;
    
    // Calculate based on percentage
    let calculatedAmount = (claimedAmount * rate) / 100;
    
    // Apply ceiling if exceeded
    const appliedCeiling = calculatedAmount > maxCeiling;
    if (appliedCeiling) {
      calculatedAmount = maxCeiling;
    }

    return {
      approvedAmount: Math.round(calculatedAmount),
      rate,
      ceiling: maxCeiling,
      appliedCeiling,
    };
  };

  return {
    ceilings,
    isLoading,
    error,
    updateCeiling,
    createCeiling,
    deleteCeiling,
    getCeilingForCareType,
    calculateApprovedAmount,
  };
}
