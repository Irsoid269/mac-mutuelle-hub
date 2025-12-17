import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface Document {
  id: string;
  name: string;
  document_type: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  related_type: string;
  related_id: string;
  uploaded_by: string | null;
  created_at: string;
}

export function useDocumentsData(searchTerm?: string, categoryFilter?: string) {
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['documents', searchTerm, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('document_type', categoryFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Document[];
    },
  });

  // Calculate stats by category
  const stats = {
    souscription: documents.filter(d => d.document_type === 'souscription').length,
    remboursement: documents.filter(d => d.document_type === 'remboursement').length,
    prise_en_charge: documents.filter(d => d.document_type === 'prise_en_charge').length,
    quittance: documents.filter(d => d.document_type === 'quittance').length,
    justificatif: documents.filter(d => d.document_type === 'justificatif').length,
    autre: documents.filter(d => d.document_type === 'autre').length,
    total: documents.length,
  };

  // Format file size
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get document type icon mapping
  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      souscription: 'Souscription',
      remboursement: 'Remboursement',
      prise_en_charge: 'Prise en charge',
      quittance: 'Quittance',
      justificatif: 'Justificatif',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  // Download document
  const downloadDocument = async (doc: Document) => {
    try {
      // Check if it's a Supabase storage URL
      if (doc.file_url.includes('supabase') || doc.file_url.includes('storage')) {
        // Extract the path from the URL - handle different URL formats
        let storagePath = '';
        
        // Try to extract path from full URL
        const urlParts = doc.file_url.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          // Format: bucket/path
          const bucketAndPath = urlParts[1];
          const firstSlashIndex = bucketAndPath.indexOf('/');
          if (firstSlashIndex > -1) {
            storagePath = bucketAndPath.substring(firstSlashIndex + 1);
            const bucketName = bucketAndPath.substring(0, firstSlashIndex);
            
            const { data } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(storagePath, 3600);
            
            if (data?.signedUrl) {
              window.open(data.signedUrl, '_blank');
              return;
            }
          }
        }
        
        // Try with reimbursement-documents bucket as fallback
        const path = doc.file_url.split('/').pop();
        if (path) {
          const { data } = await supabase.storage
            .from('reimbursement-documents')
            .createSignedUrl(path, 3600);
          
          if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
            return;
          }
        }
      }
      
      // For external URLs or if signed URL failed, just open directly
      window.open(doc.file_url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  };

  // Delete document
  const deleteDocument = async (id: string) => {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    refetch();
  };

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return {
    documents,
    stats,
    isLoading,
    refetch,
    formatFileSize,
    getDocumentTypeLabel,
    downloadDocument,
    deleteDocument,
  };
}
