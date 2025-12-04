import { useState, useEffect } from 'react';
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

export function useInsuredData(filters: InsuredFilters = {}) {
  const [insured, setInsured] = useState<Insured[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsured = async () => {
    setIsLoading(true);
    try {
      // Fetch insured with their contracts
      const { data: insuredData, error } = await supabase
        .from('insured')
        .select(`
          *,
          contract:contract_id (
            contract_number,
            raison_sociale
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch paid contributions to determine which insured have paid
      const { data: paidContributions } = await supabase
        .from('contributions')
        .select('contract_id')
        .eq('payment_status', 'paye');

      const paidContractIds = new Set(paidContributions?.map(c => c.contract_id) || []);

      // Mark insured who have paid contributions
      const enrichedInsured = (insuredData || []).map(ins => ({
        ...ins,
        has_paid_contribution: paidContractIds.has(ins.contract_id)
      }));

      // Apply filters
      let filtered = enrichedInsured;

      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(ins =>
          `${ins.first_name} ${ins.last_name}`.toLowerCase().includes(search) ||
          ins.matricule.toLowerCase().includes(search) ||
          ins.email?.toLowerCase().includes(search) ||
          ins.contract?.contract_number?.toLowerCase().includes(search)
        );
      }

      if (filters.status) {
        filtered = filtered.filter(ins => ins.status === filters.status);
      }

      if (filters.paidOnly) {
        filtered = filtered.filter(ins => ins.has_paid_contribution);
      }

      setInsured(filtered);
    } catch (error) {
      console.error('Error fetching insured:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsured();

    // Real-time subscription
    const channel = supabase
      .channel('insured-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insured' }, fetchInsured)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, fetchInsured)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters.searchTerm, filters.status, filters.paidOnly]);

  return { insured, isLoading, refetch: fetchInsured };
}
