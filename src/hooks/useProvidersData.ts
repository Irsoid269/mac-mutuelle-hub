import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Provider = Database['public']['Tables']['healthcare_providers']['Row'];
type ProviderInsert = Database['public']['Tables']['healthcare_providers']['Insert'];
type ProviderUpdate = Database['public']['Tables']['healthcare_providers']['Update'];

export function useProvidersData(searchTerm: string = '', typeFilter: string = '') {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    hopital: 0,
    clinique: 0,
    laboratoire: 0,
    pharmacie: 0,
    medecin: 0,
    autre: 0,
    conventioned: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('healthcare_providers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const allProviders = data || [];

      // Calculate stats
      setStats({
        total: allProviders.length,
        hopital: allProviders.filter(p => p.provider_type === 'hopital').length,
        clinique: allProviders.filter(p => p.provider_type === 'clinique').length,
        laboratoire: allProviders.filter(p => p.provider_type === 'laboratoire').length,
        pharmacie: allProviders.filter(p => p.provider_type === 'pharmacie').length,
        medecin: allProviders.filter(p => p.provider_type === 'medecin').length,
        autre: allProviders.filter(p => p.provider_type === 'autre').length,
        conventioned: allProviders.filter(p => p.is_conventioned).length,
      });

      // Apply filters
      let filtered = allProviders;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.city?.toLowerCase().includes(search) ||
          p.convention_number?.toLowerCase().includes(search)
        );
      }

      if (typeFilter && typeFilter !== 'all') {
        filtered = filtered.filter(p => p.provider_type === typeFilter);
      }

      setProviders(filtered);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProvider = async (data: ProviderInsert) => {
    const { error } = await supabase.from('healthcare_providers').insert(data);
    if (error) throw error;
    
    // Log audit
    await logAudit('CREATE', 'healthcare_providers', data.name, `Nouveau prestataire: ${data.name} (${data.provider_type})`);
    
    fetchData();
  };

  const updateProvider = async (id: string, data: ProviderUpdate) => {
    const { error } = await supabase
      .from('healthcare_providers')
      .update(data)
      .eq('id', id);
    if (error) throw error;
    
    // Log audit
    await logAudit('UPDATE', 'healthcare_providers', data.name || '', `Modification prestataire: ${data.name}`);
    
    fetchData();
  };

  const deleteProvider = async (id: string, name: string) => {
    const { error } = await supabase
      .from('healthcare_providers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    
    // Log audit
    await logAudit('DELETE', 'healthcare_providers', name, `Suppression prestataire: ${name}`);
    
    fetchData();
  };

  const logAudit = async (action: string, entity_type: string, entity_name: string, details: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user?.id)
        .single();

      const userName = profile ? `${profile.first_name} ${profile.last_name}` : user?.email || 'Système';

      await supabase.from('audit_logs').insert({
        action,
        entity_type,
        details,
        user_id: user?.id,
        user_name: userName,
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  };

  const getProvidersByType = (careType: string) => {
    // Map care types to provider types
    const typeMapping: Record<string, string[]> = {
      consultation: ['medecin', 'clinique', 'hopital'],
      hospitalisation: ['hopital', 'clinique'],
      pharmacie: ['pharmacie'],
      analyses: ['laboratoire', 'hopital', 'clinique'],
      radiologie: ['laboratoire', 'hopital', 'clinique'],
      autre: ['hopital', 'clinique', 'laboratoire', 'pharmacie', 'medecin', 'autre'],
    };

    const allowedTypes = typeMapping[careType] || typeMapping.autre;
    return providers.filter(p => allowedTypes.includes(p.provider_type));
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('providers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'healthcare_providers' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchTerm, typeFilter]);

  return {
    providers,
    stats,
    isLoading,
    refetch: fetchData,
    createProvider,
    updateProvider,
    deleteProvider,
    getProvidersByType,
  };
}
