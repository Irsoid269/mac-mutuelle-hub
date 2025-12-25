import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Contract {
  id: string;
  contract_number: string;
  client_code: string;
  raison_sociale: string;
  contract_type: 'entreprise' | 'famille';
  status: string;
  start_date: string;
  end_date: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  insured?: {
    id: string;
    first_name: string;
    last_name: string;
    matricule: string;
  }[];
}

export function useContractsData(searchTerm: string = '', statusFilter: string = '') {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    en_attente: 0,
    validee: 0,
    rejetee: 0,
    reserve_medicale: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch contracts with their insured
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          insured (
            id,
            first_name,
            last_name,
            matricule
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allContracts = data || [];

      // Calculate stats
      setStats({
        total: allContracts.length,
        en_attente: allContracts.filter(c => c.status === 'en_attente').length,
        validee: allContracts.filter(c => c.status === 'validee').length,
        rejetee: allContracts.filter(c => c.status === 'rejetee').length,
        reserve_medicale: allContracts.filter(c => c.status === 'reserve_medicale').length,
      });

      // Apply filters
      let filtered = allContracts;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(c =>
          c.contract_number.toLowerCase().includes(search) ||
          c.raison_sociale.toLowerCase().includes(search) ||
          c.client_code.toLowerCase().includes(search)
        );
      }

      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === statusFilter);
      }

      setContracts(filtered);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('contracts-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insured' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchTerm, statusFilter]);

  return { contracts, stats, isLoading, refetch: fetchData };
}
