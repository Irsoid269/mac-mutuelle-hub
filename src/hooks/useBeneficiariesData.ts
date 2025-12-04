import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Beneficiary {
  id: string;
  insured_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string | null;
  gender: 'M' | 'F';
  relationship: string;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  created_at: string;
  insured?: {
    first_name: string;
    last_name: string;
    matricule: string;
    contract_id: string;
  };
}

export function useBeneficiariesData(searchTerm: string = '') {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [paidInsuredList, setPaidInsuredList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch paid contributions to get contract IDs
      const { data: paidContributions } = await supabase
        .from('contributions')
        .select('contract_id')
        .eq('payment_status', 'paye');

      const paidContractIds = paidContributions?.map(c => c.contract_id) || [];

      // Fetch insured who have paid
      const { data: paidInsured } = await supabase
        .from('insured')
        .select('id, first_name, last_name, matricule, contract_id')
        .in('contract_id', paidContractIds.length > 0 ? paidContractIds : ['']);

      setPaidInsuredList(paidInsured || []);
      const paidInsuredIds = paidInsured?.map(i => i.id) || [];

      // Fetch beneficiaries only for insured who have paid
      if (paidInsuredIds.length > 0) {
        const { data: beneficiariesData, error } = await supabase
          .from('beneficiaries')
          .select(`
            *,
            insured:insured_id (
              first_name,
              last_name,
              matricule,
              contract_id
            )
          `)
          .in('insured_id', paidInsuredIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Apply search filter
        let filtered = beneficiariesData || [];
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          filtered = filtered.filter(b =>
            `${b.first_name} ${b.last_name}`.toLowerCase().includes(search) ||
            `${b.insured?.first_name} ${b.insured?.last_name}`.toLowerCase().includes(search)
          );
        }

        setBeneficiaries(filtered);
      } else {
        setBeneficiaries([]);
      }
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('beneficiaries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'beneficiaries' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchTerm]);

  return { beneficiaries, paidInsuredList, isLoading, refetch: fetchData };
}
