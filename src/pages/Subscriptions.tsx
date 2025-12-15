import { useState } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, MoreHorizontal, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/status-badge';
import { useContractsData } from '@/hooks/useContractsData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SubscriptionForm } from '@/components/forms/SubscriptionForm';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateSubscriptionPDF, generateSubscriptionSummaryPDF, type SubscriptionPDFData, type SubscriptionSummaryPDFData } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';


export default function Subscriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  

  const { contracts, stats, isLoading, refetch } = useContractsData(searchTerm, statusFilter);

  const getInsuredName = (insuredList?: { first_name: string; last_name: string }[]) => {
    if (!insuredList || insuredList.length === 0) return 'N/A';
    const first = insuredList[0];
    return `${first.first_name} ${first.last_name}`;
  };

  const handleGeneratePDF = async (contract: any) => {
    // Fetch full insured data with beneficiaries
    const { data: insuredData } = await supabase
      .from('insured')
      .select('first_name, last_name, matricule, birth_date, gender, marital_status, phone, email, job_title, employer')
      .eq('contract_id', contract.id);

    // Fetch beneficiaries for the contract's insured
    let beneficiariesData: any[] = [];
    if (insuredData && insuredData.length > 0) {
      const { data: beneficiaries } = await supabase
        .from('beneficiaries')
        .select('first_name, last_name, relationship, birth_date, gender')
        .in('insured_id', insuredData.map(() => contract.id));
      beneficiariesData = beneficiaries || [];
    }

    const pdfData: SubscriptionPDFData = {
      contract_number: contract.contract_number,
      client_code: contract.client_code,
      raison_sociale: contract.raison_sociale,
      status: contract.status,
      start_date: contract.start_date,
      created_at: contract.created_at,
      address: contract.address,
      phone: contract.phone,
      email: contract.email,
      insured: insuredData || [],
      beneficiaries: beneficiariesData,
    };

    generateSubscriptionPDF(pdfData);
    toast.success('PDF généré', { description: "L'attestation de souscription a été téléchargée." });
  };

  const handleGenerateSummaryPDF = () => {
    const summaryData: SubscriptionSummaryPDFData = {
      contracts: contracts.map(c => ({
        contract_number: c.contract_number,
        client_code: c.client_code,
        raison_sociale: c.raison_sociale,
        status: c.status,
        start_date: c.start_date,
        created_at: c.created_at,
        insured_count: c.insured?.length || 0,
      })),
      stats: {
        total: stats.total,
        en_attente: stats.en_attente,
        validee: stats.validee,
        rejetee: stats.rejetee,
        reserve_medicale: stats.reserve_medicale,
      },
    };

    generateSubscriptionSummaryPDF(summaryData);
    toast.success('PDF généré', { description: 'Le récapitulatif a été téléchargé.' });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Souscriptions</h1>
          <p className="page-subtitle">
            {stats.total} souscriptions au total
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle souscription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Formulaire de Souscription Familiale</DialogTitle>
            </DialogHeader>
            <SubscriptionForm onClose={() => { setIsFormOpen(false); refetch(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° contrat ou raison sociale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="validee">Validée</SelectItem>
            <SelectItem value="rejetee">Rejetée</SelectItem>
            <SelectItem value="reserve_medicale">Réserve médicale</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2" onClick={handleGenerateSummaryPDF}>
          <FileText className="w-4 h-4" />
          Récapitulatif PDF
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'En attente', count: stats.en_attente, color: 'bg-warning/10 text-warning' },
          { label: 'Validées', count: stats.validee, color: 'bg-success/10 text-success' },
          { label: 'Rejetées', count: stats.rejetee, color: 'bg-destructive/10 text-destructive' },
          { label: 'Réserve médicale', count: stats.reserve_medicale, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Contrat</th>
                <th>Client</th>
                <th>Assuré principal</th>
                <th>Date création</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune souscription trouvée
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>
                      <span className="font-mono text-sm font-medium text-foreground">
                        {contract.contract_number}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">{contract.raison_sociale}</p>
                        <p className="text-xs text-muted-foreground">Code: {contract.client_code}</p>
                      </div>
                    </td>
                    <td>{getInsuredName(contract.insured)}</td>
                    <td>{format(new Date(contract.created_at), 'dd/MM/yyyy', { locale: fr })}</td>
                    <td>
                      <StatusBadge status={contract.status as any} />
                    </td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="w-4 h-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="w-4 h-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2" onClick={() => handleGeneratePDF(contract)}>
                            <FileText className="w-4 h-4" />
                            Télécharger PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
