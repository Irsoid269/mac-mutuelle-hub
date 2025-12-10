import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  FileText,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload, type UploadedFile } from '@/components/ui/file-upload';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { useReimbursementsData } from '@/hooks/useReimbursementsData';
import { useProvidersData } from '@/hooks/useProvidersData';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateReimbursementPDF, type ReimbursementPDFData } from '@/lib/pdfGenerator';

export default function Reimbursements() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState<any>(null);
  const [filteredProviders, setFilteredProviders] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    insured_id: '',
    claimed_amount: '',
    medical_date: '',
    provider_id: '',
    care_type: '',
    notes: '',
  });

  const {
    reimbursements,
    paidInsuredList,
    stats,
    isLoading,
    createReimbursement,
    updateStatus,
  } = useReimbursementsData(searchTerm, statusFilter);

  const { providers, getProvidersByType } = useProvidersData();

  // Update filtered providers when care type changes
  useEffect(() => {
    if (formData.care_type) {
      setFilteredProviders(getProvidersByType(formData.care_type));
    } else {
      setFilteredProviders([]);
    }
  }, [formData.care_type, providers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-KM', {
      style: 'currency',
      currency: 'KMF',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus(id, newStatus);
      toast.success('Statut mis à jour', {
        description: `Le remboursement a été passé en "${newStatus}"`,
      });
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de mettre à jour le statut.',
      });
    }
  };

  const handleSubmit = async () => {
    try {
      await createReimbursement({
        insured_id: formData.insured_id,
        claimed_amount: parseFloat(formData.claimed_amount),
        medical_date: formData.medical_date,
        provider_id: formData.provider_id || undefined,
        care_type: formData.care_type,
        notes: formData.notes || undefined,
      });
      toast.success('Demande soumise', {
        description: 'La demande de remboursement a été enregistrée.',
      });
      setIsFormOpen(false);
      setFormData({
        insured_id: '',
        claimed_amount: '',
        medical_date: '',
        provider_id: '',
        care_type: '',
        notes: '',
      });
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de créer la demande de remboursement.',
      });
    }
  };

  const handleGeneratePDF = (reimbursement: any) => {
    const pdfData: ReimbursementPDFData = {
      reimbursement_number: reimbursement.reimbursement_number,
      insured: reimbursement.insured,
      provider: reimbursement.provider,
      care_type: reimbursement.care_type,
      medical_date: reimbursement.medical_date,
      claimed_amount: reimbursement.claimed_amount,
      approved_amount: reimbursement.approved_amount,
      paid_amount: reimbursement.paid_amount,
      status: reimbursement.status,
      notes: reimbursement.notes,
      created_at: reimbursement.created_at,
      validated_at: reimbursement.validated_at,
      paid_at: reimbursement.paid_at,
    };
    
    generateReimbursementPDF(pdfData);
    toast.success('PDF généré', {
      description: 'La fiche de remboursement a été téléchargée.',
    });
  };

  const workflowSteps = [
    { status: 'soumis', label: 'Soumis', description: 'Demande reçue' },
    { status: 'verification', label: 'Vérification', description: "En cours d'analyse" },
    { status: 'valide', label: 'Validé', description: 'Approuvé par le médecin-conseil' },
    { status: 'paye', label: 'Payé', description: 'Paiement effectué' },
  ];

  const getCurrentStep = (status: string) => {
    return workflowSteps.findIndex((s) => s.status === status);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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
          <h1 className="page-title">Gestion des Remboursements</h1>
          <p className="page-subtitle">Workflow: Soumis → Vérification → Validé → Payé</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={paidInsuredList.length === 0}>
              <Plus className="w-4 h-4" />
              Nouveau remboursement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle Demande de Remboursement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="input-group">
                <Label className="input-label">Assuré (ayant payé sa cotisation)</Label>
                <Select
                  value={formData.insured_id}
                  onValueChange={(v) => setFormData({ ...formData, insured_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'assuré" />
                  </SelectTrigger>
                  <SelectContent>
                    {paidInsuredList.map((insured) => (
                      <SelectItem key={insured.id} value={insured.id}>
                        {insured.first_name} {insured.last_name} ({insured.matricule})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <Label className="input-label">Montant réclamé (KMF)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.claimed_amount}
                    onChange={(e) => setFormData({ ...formData, claimed_amount: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Type de soin</Label>
                  <Select
                    value={formData.care_type}
                    onValueChange={(v) => setFormData({ ...formData, care_type: v, provider_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="hospitalisation">Hospitalisation</SelectItem>
                      <SelectItem value="pharmacie">Pharmacie</SelectItem>
                      <SelectItem value="analyses">Analyses</SelectItem>
                      <SelectItem value="radiologie">Radiologie</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <Label className="input-label">Date des soins</Label>
                  <Input
                    type="date"
                    value={formData.medical_date}
                    onChange={(e) => setFormData({ ...formData, medical_date: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Prestataire</Label>
                  <Select
                    value={formData.provider_id}
                    onValueChange={(v) => setFormData({ ...formData, provider_id: v })}
                    disabled={!formData.care_type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.care_type ? "Sélectionner le prestataire" : "Choisir d'abord le type de soin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProviders.length === 0 ? (
                        <SelectItem value="none" disabled>Aucun prestataire disponible</SelectItem>
                      ) : (
                        filteredProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <span className="flex items-center gap-2">
                              <Building2 className="w-3 h-3" />
                              {provider.name}
                              {provider.is_conventioned && (
                                <span className="text-xs text-success">(Conv.)</span>
                              )}
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="input-group">
                <Label className="input-label">Justificatifs</Label>
                <FileUpload
                  onFilesChange={(files) => {
                    // Files are available for upload
                    console.log('Files selected:', files);
                  }}
                  maxFiles={5}
                  maxSizeMB={10}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Notes</Label>
                <Textarea
                  placeholder="Informations complémentaires..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.insured_id ||
                    !formData.claimed_amount ||
                    !formData.medical_date ||
                    !formData.care_type
                  }
                >
                  Soumettre
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Alert */}
      {paidInsuredList.length === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Aucun assuré avec cotisation payée
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Les remboursements ne peuvent être demandés que pour les assurés ayant payé leur cotisation.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° ou nom d'assuré..."
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
            <SelectItem value="soumis">Soumis</SelectItem>
            <SelectItem value="verification">En vérification</SelectItem>
            <SelectItem value="valide">Validé</SelectItem>
            <SelectItem value="paye">Payé</SelectItem>
            <SelectItem value="rejete">Rejeté</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { status: 'soumis', label: 'Soumis', count: stats.soumis, color: 'bg-warning/10 text-warning' },
          { status: 'verification', label: 'Vérification', count: stats.verification, color: 'bg-info/10 text-info' },
          { status: 'valide', label: 'Validés', count: stats.valide, color: 'bg-success/10 text-success' },
          { status: 'paye', label: 'Payés', count: stats.paye, color: 'bg-primary/10 text-primary' },
          { status: 'rejete', label: 'Rejetés', count: stats.rejete, color: 'bg-destructive/10 text-destructive' },
        ].map((stat) => (
          <div key={stat.status} className="bg-card p-4 rounded-xl border border-border">
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
                <th>N° Remboursement</th>
                <th>Assuré</th>
                <th>Type de soin</th>
                <th>Montant</th>
                <th>Date soins</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reimbursements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun remboursement trouvé
                  </td>
                </tr>
              ) : (
                reimbursements.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-mono text-sm font-medium text-foreground">
                        {r.reimbursement_number}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">
                          {r.insured?.first_name} {r.insured?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{r.insured?.matricule}</p>
                      </div>
                    </td>
                    <td className="capitalize">{r.care_type}</td>
                    <td className="font-semibold text-foreground">
                      {formatCurrency(r.claimed_amount)}
                    </td>
                    <td>{format(new Date(r.medical_date), 'dd/MM/yyyy', { locale: fr })}</td>
                    <td>
                      <StatusBadge status={r.status as any} />
                    </td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => setSelectedReimbursement(r)}
                          >
                            <Eye className="w-4 h-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {r.status === 'soumis' && (
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => handleStatusChange(r.id, 'verification')}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Passer en vérification
                            </DropdownMenuItem>
                          )}
                          {r.status === 'verification' && (
                            <>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleStatusChange(r.id, 'valide')}
                              >
                                <CheckCircle className="w-4 h-4" />
                                Valider
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onClick={() => handleStatusChange(r.id, 'rejete')}
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                          {r.status === 'valide' && (
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => handleStatusChange(r.id, 'paye')}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Marquer comme payé
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2" onClick={() => handleGeneratePDF(r)}>
                            <FileText className="w-4 h-4" />
                            Générer PDF
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

      {/* Detail Dialog with Workflow */}
      <Dialog open={!!selectedReimbursement} onOpenChange={() => setSelectedReimbursement(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du Remboursement</DialogTitle>
          </DialogHeader>
          {selectedReimbursement && (
            <div className="space-y-6">
              {/* Workflow Progress */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-4">Progression</h4>
                <div className="flex items-center justify-between">
                  {workflowSteps.map((step, index) => {
                    const currentIndex = getCurrentStep(selectedReimbursement.status);
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                      <div key={step.status} className="flex flex-col items-center flex-1">
                        <div className="flex items-center w-full">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                              isCompleted
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                          >
                            {index + 1}
                          </div>
                          {index < workflowSteps.length - 1 && (
                            <div
                              className={`flex-1 h-1 mx-2 ${
                                index < currentIndex ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground mt-2">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">N° Remboursement</p>
                  <p className="font-mono font-medium">{selectedReimbursement.reimbursement_number}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Assuré</p>
                  <p className="font-medium">
                    {selectedReimbursement.insured?.first_name} {selectedReimbursement.insured?.last_name}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Montant réclamé</p>
                  <p className="font-bold text-lg text-primary">
                    {formatCurrency(selectedReimbursement.claimed_amount)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Type de soin</p>
                  <p className="font-medium capitalize">{selectedReimbursement.care_type}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Date des soins</p>
                  <p className="font-medium">
                    {format(new Date(selectedReimbursement.medical_date), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Médecin</p>
                  <p className="font-medium">{selectedReimbursement.doctor_name || '-'}</p>
                </div>
                {selectedReimbursement.notes && (
                  <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="font-medium">{selectedReimbursement.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Télécharger fiche
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
