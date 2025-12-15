import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Reimbursement {
  id: string;
  reimbursement_number: string;
  insured_id: string;
  claimed_amount: number;
  approved_amount: number | null;
  paid_amount: number | null;
  medical_date: string;
  doctor_name: string | null;
  care_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  validated_at: string | null;
  paid_at: string | null;
  insured?: {
    first_name: string;
    last_name: string;
    matricule: string;
  };
}

export function useReimbursementsData(searchTerm: string = '', statusFilter: string = '') {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [paidInsuredList, setPaidInsuredList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    soumis: 0,
    verification: 0,
    valide: 0,
    paye: 0,
    rejete: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch paid contributions to get insured who can request reimbursements
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

      // Fetch reimbursements with insured and provider info
      const { data, error } = await supabase
        .from('reimbursements')
        .select(`
          *,
          insured:insured_id (
            first_name,
            last_name,
            matricule
          ),
          provider:provider_id (
            name,
            provider_type,
            is_conventioned
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allReimbursements = data || [];

      // Calculate stats
      setStats({
        total: allReimbursements.length,
        soumis: allReimbursements.filter(r => r.status === 'soumis').length,
        verification: allReimbursements.filter(r => r.status === 'verification').length,
        valide: allReimbursements.filter(r => r.status === 'valide').length,
        paye: allReimbursements.filter(r => r.status === 'paye').length,
        rejete: allReimbursements.filter(r => r.status === 'rejete').length,
      });

      // Apply filters
      let filtered = allReimbursements;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(r =>
          r.reimbursement_number.toLowerCase().includes(search) ||
          `${r.insured?.first_name} ${r.insured?.last_name}`.toLowerCase().includes(search)
        );
      }

      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(r => r.status === statusFilter);
      }

      setReimbursements(filtered);
    } catch (error) {
      console.error('Error fetching reimbursements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createReimbursement = async (data: {
    insured_id: string;
    claimed_amount: number;
    medical_date: string;
    provider_id?: string;
    care_type: string;
    notes?: string;
    files?: File[];
  }) => {
    // Generate reimbursement number
    const reimbursementNumber = `RMB-${Date.now().toString(36).toUpperCase()}`;

    const { data: reimbursement, error } = await supabase.from('reimbursements').insert({
      insured_id: data.insured_id,
      claimed_amount: data.claimed_amount,
      medical_date: data.medical_date,
      provider_id: data.provider_id || null,
      care_type: data.care_type,
      notes: data.notes || null,
      reimbursement_number: reimbursementNumber,
      status: 'soumis',
    }).select().single();

    if (error) throw error;

    // Upload files if any
    if (data.files && data.files.length > 0 && reimbursement) {
      for (const file of data.files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${reimbursement.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        await supabase.storage
          .from('reimbursement-documents')
          .upload(fileName, file);

        // Save document reference
        await supabase.from('documents').insert({
          name: file.name,
          file_url: fileName,
          file_size: file.size,
          mime_type: file.type,
          document_type: 'justificatif',
          related_type: 'reimbursement',
          related_id: reimbursement.id,
        });
      }
    }

    fetchData();
  };

  const getReimbursementDocuments = async (reimbursementId: string) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('related_type', 'reimbursement')
      .eq('related_id', reimbursementId);
    
    if (error) throw error;
    return data || [];
  };

  const getDocumentUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('reimbursement-documents')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const updateStatus = async (id: string, newStatus: string, approvedAmount?: number, paidAmount?: number) => {
    const updateData: any = { status: newStatus };

    if (newStatus === 'valide') {
      updateData.validated_at = new Date().toISOString();
      if (approvedAmount !== undefined) {
        updateData.approved_amount = approvedAmount;
      }
    }

    if (newStatus === 'paye') {
      updateData.paid_at = new Date().toISOString();
      
      // Si paidAmount est fourni, l'utiliser, sinon utiliser approved_amount ou claimed_amount
      if (paidAmount !== undefined) {
        updateData.paid_amount = paidAmount;
      } else {
        // Récupérer le remboursement pour obtenir le montant
        const { data: reimbursement } = await supabase
          .from('reimbursements')
          .select('approved_amount, claimed_amount')
          .eq('id', id)
          .single();
        
        if (reimbursement) {
          updateData.paid_amount = reimbursement.approved_amount || reimbursement.claimed_amount;
        }
      }
    }

    const { error } = await supabase
      .from('reimbursements')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    fetchData();
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('reimbursements-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reimbursements' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchTerm, statusFilter]);

  return {
    reimbursements,
    paidInsuredList,
    stats,
    isLoading,
    refetch: fetchData,
    createReimbursement,
    updateStatus,
    getReimbursementDocuments,
    getDocumentUrl,
  };
}
