import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContributionPayment {
  id: string;
  contribution_id: string;
  amount: number;
  payment_reference: string | null;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

interface Contribution {
  id: string;
  contract_id: string;
  amount: number;
  paid_amount: number;
  period_start: string;
  period_end: string;
  payment_status: string;
  payment_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  contract?: {
    contract_number: string;
    raison_sociale: string;
    client_code: string;
  };
}

interface Contract {
  id: string;
  contract_number: string;
  raison_sociale: string;
  client_code: string;
}

export function useContributionsData(searchTerm: string = '', statusFilter: string = '') {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    partial: 0,
    totalAmount: 0,
    paidAmount: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch contributions with contracts
      const { data: contributionsData, error } = await supabase
        .from('contributions')
        .select(`
          *,
          contract:contract_id (
            contract_number,
            raison_sociale,
            client_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch all contracts for the form
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, contract_number, raison_sociale, client_code')
        .order('raison_sociale');

      setContracts(contractsData || []);

      // Calculate stats
      const allContributions = contributionsData || [];
      const statsCalc = {
        total: allContributions.length,
        paid: allContributions.filter(c => c.payment_status === 'paye').length,
        pending: allContributions.filter(c => c.payment_status === 'en_attente').length,
        partial: allContributions.filter(c => c.payment_status === 'partiel').length,
        totalAmount: allContributions.reduce((sum, c) => sum + c.amount, 0),
        paidAmount: allContributions.reduce((sum, c) => sum + c.paid_amount, 0),
      };
      setStats(statsCalc);

      // Apply filters
      let filtered = allContributions;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(c =>
          c.contract?.raison_sociale?.toLowerCase().includes(search) ||
          c.contract?.contract_number?.toLowerCase().includes(search) ||
          c.payment_reference?.toLowerCase().includes(search)
        );
      }

      if (statusFilter) {
        filtered = filtered.filter(c => c.payment_status === statusFilter);
      }

      setContributions(filtered);
    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createContribution = async (data: {
    contract_id: string;
    amount: number;
    period_start: string;
    period_end: string;
    notes?: string;
  }) => {
    const { error } = await supabase.from('contributions').insert(data);
    if (error) throw error;
    fetchData();
  };

  const updatePaymentStatus = async (
    id: string,
    status: string,
    paidAmount: number,
    paymentReference?: string,
    contractId?: string,
    previousPaidAmount: number = 0
  ) => {
    // Calculate the new payment amount (what was just paid)
    const newPaymentAmount = paidAmount - previousPaidAmount;

    const updateData: any = {
      payment_status: status,
      paid_amount: paidAmount,
    };

    if (status === 'paye') {
      updateData.payment_date = new Date().toISOString().split('T')[0];
    }

    if (paymentReference) {
      updateData.payment_reference = paymentReference;
    }

    const { error } = await supabase
      .from('contributions')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    // Record the payment in the payment history
    if (newPaymentAmount > 0) {
      await supabase.from('contribution_payments').insert({
        contribution_id: id,
        amount: newPaymentAmount,
        payment_reference: paymentReference,
        notes: status === 'partiel' ? 'Paiement partiel' : 'Paiement complet',
      });
    }

    // Si le paiement est complet, mettre à jour le statut du contrat et des assurés à "validee"
    if (status === 'paye' && contractId) {
      await supabase
        .from('contracts')
        .update({ status: 'validee' })
        .eq('id', contractId);

      await supabase
        .from('insured')
        .update({ status: 'validee' })
        .eq('contract_id', contractId);
    }

    fetchData();
  };

  const getPaymentHistory = async (contributionId: string): Promise<ContributionPayment[]> => {
    const { data, error } = await supabase
      .from('contribution_payments')
      .select('*')
      .eq('contribution_id', contributionId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }

    return data || [];
  };

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('contributions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchTerm, statusFilter]);

  return {
    contributions,
    contracts,
    stats,
    isLoading,
    refetch: fetchData,
    createContribution,
    updatePaymentStatus,
    getPaymentHistory,
  };
}

export type { ContributionPayment };
