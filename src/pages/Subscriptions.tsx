import { useState } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, MoreHorizontal, FileText, Trash2 } from 'lucide-react';
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
import { useContractsDataOffline } from '@/hooks/useContractsDataOffline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SubscriptionForm } from '@/components/forms/SubscriptionForm';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateSubscriptionPDF, generateSubscriptionSummaryPDF, type SubscriptionPDFData, type SubscriptionSummaryPDFData } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { offlineDb } from '@/lib/offlineDb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auditLog } from '@/lib/auditLog';


export default function Subscriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [contractInsured, setContractInsured] = useState<any[]>([]);
  const [contractBeneficiaries, setContractBeneficiaries] = useState<any[]>([]);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<any>(null);

  const { contracts, stats, isLoading, isOnline, refetch } = useContractsDataOffline(searchTerm, statusFilter);

  const getInsuredName = (insuredList?: { first_name: string; last_name: string }[]) => {
    if (!insuredList || insuredList.length === 0) return 'N/A';
    const first = insuredList[0];
    return `${first.first_name} ${first.last_name}`;
  };

  const handleViewDetails = async (contract: any) => {
    setSelectedContract(contract);
    
    // Fetch insured data
    const { data: insuredData } = await supabase
      .from('insured')
      .select('*')
      .eq('contract_id', contract.id);
    setContractInsured(insuredData || []);

    // Fetch beneficiaries
    if (insuredData && insuredData.length > 0) {
      const { data: beneficiaries } = await supabase
        .from('beneficiaries')
        .select('*')
        .in('insured_id', insuredData.map(i => i.id));
      setContractBeneficiaries(beneficiaries || []);
    } else {
      setContractBeneficiaries([]);
    }

    setIsViewOpen(true);
    
    // Log audit
    auditLog.create('contract', `Consultation du contrat ${contract.contract_number}`, contract.id);
  };

  const handleEditContract = async (contract: any) => {
    setSelectedContract(contract);
    
    // Fetch insured data
    const { data: insuredData } = await supabase
      .from('insured')
      .select('*')
      .eq('contract_id', contract.id);
    setContractInsured(insuredData || []);

    setIsEditOpen(true);
  };

  const handleDeleteContract = (contract: any) => {
    setContractToDelete(contract);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteContract = async () => {
    if (!contractToDelete) return;
    
    try {
      // First delete all beneficiaries linked to insured of this contract
      const { data: insuredData } = await supabase
        .from('insured')
        .select('id')
        .eq('contract_id', contractToDelete.id);
      
      if (insuredData && insuredData.length > 0) {
        const insuredIds = insuredData.map(i => i.id);
        await supabase.from('beneficiaries').delete().in('insured_id', insuredIds);
        await supabase.from('insured').delete().eq('contract_id', contractToDelete.id);
        
        // Delete from IndexedDB
        for (const insuredId of insuredIds) {
          await offlineDb.insured.delete(insuredId);
        }
      }
      
      // Delete contributions linked to this contract
      await supabase.from('contributions').delete().eq('contract_id', contractToDelete.id);
      
      // Delete the contract from Supabase
      const { error } = await supabase.from('contracts').delete().eq('id', contractToDelete.id);
      
      if (error) throw error;
      
      // Also delete from local IndexedDB
      await offlineDb.contracts.delete(contractToDelete.id);
      
      toast.success('Suppression réussie', { description: `Le contrat ${contractToDelete.contract_number} a été supprimé.` });
      auditLog.delete('contract', `Suppression du contrat ${contractToDelete.contract_number}`, contractToDelete.id);
      refetch();
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('Erreur', { description: 'Impossible de supprimer le contrat.' });
    } finally {
      setIsDeleteDialogOpen(false);
      setContractToDelete(null);
    }
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
    
    // Log audit
    auditLog.export('contract', 1);
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
    
    // Log audit
    auditLog.export('contract', contracts.length);
  };

  const statusLabels: Record<string, string> = {
    en_attente: 'En attente',
    validee: 'Validé',
    rejetee: 'Rejeté',
    reserve_medicale: 'Réserve médicale',
  };

  const maritalStatusLabels: Record<string, string> = {
    marie: 'Marié(e)',
    celibataire: 'Célibataire',
    veuf: 'Veuf(ve)',
    divorce: 'Divorcé(e)',
    separe: 'Séparé(e)',
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
                <th>Type</th>
                <th>Assuré principal</th>
                <th>Date création</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
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
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contract.contract_type === 'entreprise' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {contract.contract_type === 'entreprise' ? 'Entreprise' : 'Famille'}
                      </span>
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
                          <DropdownMenuItem className="gap-2" onClick={() => handleViewDetails(contract)}>
                            <Eye className="w-4 h-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleEditContract(contract)}>
                            <Edit className="w-4 h-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2" onClick={() => handleGeneratePDF(contract)}>
                            <FileText className="w-4 h-4" />
                            Télécharger PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-destructive focus:text-destructive" 
                            onClick={() => handleDeleteContract(contract)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
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

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Contrat</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <Tabs defaultValue="contract">
              <TabsList>
                <TabsTrigger value="contract">Contrat</TabsTrigger>
                <TabsTrigger value="insured">Assurés ({contractInsured.length})</TabsTrigger>
                <TabsTrigger value="beneficiaries">Ayants droit ({contractBeneficiaries.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="contract" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">N° Contrat</p>
                    <p className="font-mono font-medium">{selectedContract.contract_number}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Code Client</p>
                    <p className="font-mono font-medium">{selectedContract.client_code}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Raison Sociale</p>
                    <p className="font-medium">{selectedContract.raison_sociale}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Type de contrat</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedContract.contract_type === 'entreprise' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {selectedContract.contract_type === 'entreprise' ? 'Entreprise' : 'Famille'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <StatusBadge status={selectedContract.status as any} />
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Date de début</p>
                    <p className="font-medium">{format(new Date(selectedContract.start_date), 'dd/MM/yyyy', { locale: fr })}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedContract.phone || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedContract.email || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="font-medium">{selectedContract.address || '-'}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="insured" className="mt-4">
                <div className="space-y-3">
                  {contractInsured.length > 0 ? (
                    contractInsured.map((ins) => (
                      <div key={ins.id} className="p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {ins.first_name[0]}{ins.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{ins.first_name} {ins.last_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{ins.matricule}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date de naissance:</span>{' '}
                            {format(new Date(ins.birth_date), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Statut:</span>{' '}
                            {statusLabels[ins.status] || ins.status}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Téléphone:</span>{' '}
                            {ins.phone || '-'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>{' '}
                            {ins.email || '-'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Aucun assuré</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="beneficiaries" className="mt-4">
                <div className="space-y-3">
                  {contractBeneficiaries.length > 0 ? (
                    contractBeneficiaries.map((ben) => (
                      <div key={ben.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-sm font-medium text-secondary-foreground">
                              {ben.first_name[0]}{ben.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{ben.first_name} {ben.last_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ben.relationship === 'enfant' ? 'Enfant' : 
                               ben.relationship === 'conjoint' ? 'Conjoint(e)' :
                               ben.relationship === 'parent' ? 'Parent' : 'Autre'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {ben.gender === 'M' ? 'Masculin' : 'Féminin'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Aucun ayant droit</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le Contrat</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <EditContractForm 
              contract={selectedContract} 
              insured={contractInsured[0]}
              onClose={() => { 
                setIsEditOpen(false); 
                refetch(); 
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le contrat <strong>{contractToDelete?.contract_number}</strong> de <strong>{contractToDelete?.raison_sociale}</strong> ? 
              Cette action est irréversible et supprimera également tous les assurés, ayants droit et cotisations associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteContract} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Edit Contract Form Component
function EditContractForm({ contract, insured, onClose }: { contract: any; insured: any; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [raisonSociale, setRaisonSociale] = useState(contract.raison_sociale || '');
  const [contractPhone, setContractPhone] = useState(contract.phone || '');
  const [contractEmail, setContractEmail] = useState(contract.email || '');
  const [contractAddress, setContractAddress] = useState(contract.address || '');
  const [status, setStatus] = useState(contract.status || 'en_attente');
  
  // Insured fields
  const [firstName, setFirstName] = useState(insured?.first_name || '');
  const [lastName, setLastName] = useState(insured?.last_name || '');
  const [insuredPhone, setInsuredPhone] = useState(insured?.phone || '');
  const [insuredEmail, setInsuredEmail] = useState(insured?.email || '');
  const [employer, setEmployer] = useState(insured?.employer || '');
  const [jobTitle, setJobTitle] = useState(insured?.job_title || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update contract
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          raison_sociale: raisonSociale,
          phone: contractPhone || null,
          email: contractEmail || null,
          address: contractAddress || null,
          status: status as any,
        })
        .eq('id', contract.id);

      if (contractError) throw contractError;

      // Update insured if exists
      if (insured) {
        const { error: insuredError } = await supabase
          .from('insured')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: insuredPhone || null,
            email: insuredEmail || null,
            employer: employer || null,
            job_title: jobTitle || null,
            status: status as any,
          })
          .eq('id', insured.id);

        if (insuredError) throw insuredError;
      }

      // Log audit
      auditLog.update('contract', `Contrat ${contract.contract_number}`, contract.id);

      toast.success('Contrat mis à jour');
      onClose();
    } catch (error: any) {
      console.error('Error updating contract:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations du Contrat</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Raison Sociale *</label>
            <Input value={raisonSociale} onChange={(e) => setRaisonSociale(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Statut</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="validee">Validée</SelectItem>
                <SelectItem value="rejetee">Rejetée</SelectItem>
                <SelectItem value="reserve_medicale">Réserve médicale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Téléphone</label>
            <Input value={contractPhone} onChange={(e) => setContractPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={contractEmail} onChange={(e) => setContractEmail(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">Adresse</label>
            <Input value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
          </div>
        </div>
      </div>

      {insured && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informations de l'Assuré Principal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Prénom *</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Nom *</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Téléphone</label>
              <Input value={insuredPhone} onChange={(e) => setInsuredPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={insuredEmail} onChange={(e) => setInsuredEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Employeur</label>
              <Input value={employer} onChange={(e) => setEmployer(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Poste</label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
