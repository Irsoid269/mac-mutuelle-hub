import { useState } from 'react';
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
  Upload,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockReimbursements, mockInsured } from '@/data/mockData';
import { ReimbursementStatus } from '@/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

export default function Reimbursements() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState<typeof mockReimbursements[0] | null>(null);

  const filteredReimbursements = mockReimbursements.filter((r) => {
    const matchesSearch =
      r.reimbursementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.insuredName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-KM', {
      style: 'currency',
      currency: 'KMF',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = (id: string, newStatus: ReimbursementStatus) => {
    toast({
      title: 'Statut mis à jour',
      description: `Le remboursement a été passé en "${newStatus}"`,
    });
  };

  const handleSubmit = () => {
    toast({
      title: 'Demande soumise',
      description: 'La demande de remboursement a été enregistrée.',
    });
    setIsFormOpen(false);
  };

  const workflowSteps = [
    { status: 'soumis', label: 'Soumis', description: 'Demande reçue' },
    { status: 'verification', label: 'Vérification', description: 'En cours d\'analyse' },
    { status: 'valide', label: 'Validé', description: 'Approuvé par le médecin-conseil' },
    { status: 'paye', label: 'Payé', description: 'Paiement effectué' },
  ];

  const getCurrentStep = (status: ReimbursementStatus) => {
    return workflowSteps.findIndex((s) => s.status === status);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Remboursements</h1>
          <p className="page-subtitle">
            Workflow: Soumis → Vérification → Validé → Payé
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
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
                <Label className="input-label">Assuré</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'assuré" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockInsured.map((insured) => (
                      <SelectItem key={insured.id} value={insured.id}>
                        {insured.firstName} {insured.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <Label className="input-label">Matricule</Label>
                  <Input placeholder="Matricule employé" />
                </div>
                <div className="input-group">
                  <Label className="input-label">Montant (KMF)</Label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
              <div className="input-group">
                <Label className="input-label">Montant en lettres</Label>
                <Input placeholder="Ex: Cent mille francs comoriens" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <Label className="input-label">Date des soins</Label>
                  <Input type="date" />
                </div>
                <div className="input-group">
                  <Label className="input-label">Médecin traitant</Label>
                  <Input placeholder="Dr. ..." />
                </div>
              </div>
              <div className="input-group">
                <Label className="input-label">Justificatifs</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Glissez vos fichiers ici ou cliquez pour parcourir
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG (max 10MB)
                  </p>
                </div>
              </div>
              <div className="input-group">
                <Label className="input-label">Notes</Label>
                <Textarea placeholder="Informations complémentaires..." />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit}>Soumettre</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
          { status: 'soumis', label: 'Soumis', color: 'bg-warning/10 text-warning' },
          { status: 'verification', label: 'Vérification', color: 'bg-info/10 text-info' },
          { status: 'valide', label: 'Validés', color: 'bg-success/10 text-success' },
          { status: 'paye', label: 'Payés', color: 'bg-primary/10 text-primary' },
          { status: 'rejete', label: 'Rejetés', color: 'bg-destructive/10 text-destructive' },
        ].map((stat) => (
          <div key={stat.status} className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>
              {mockReimbursements.filter((r) => r.status === stat.status).length}
            </p>
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
                <th>Montant</th>
                <th>Date soins</th>
                <th>Médecin</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReimbursements.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="font-mono text-sm font-medium text-foreground">
                      {r.reimbursementNumber}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-foreground">{r.insuredName}</p>
                      <p className="text-xs text-muted-foreground">{r.matricule}</p>
                    </div>
                  </td>
                  <td className="font-semibold text-foreground">
                    {formatCurrency(r.amount)}
                  </td>
                  <td>{r.medicalDate.toLocaleDateString('fr-FR')}</td>
                  <td>{r.doctorName}</td>
                  <td>
                    <StatusBadge status={r.status} />
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
                        <DropdownMenuItem className="gap-2">
                          <FileText className="w-4 h-4" />
                          Générer PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
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
                  <p className="font-mono font-medium">{selectedReimbursement.reimbursementNumber}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Assuré</p>
                  <p className="font-medium">{selectedReimbursement.insuredName}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Montant</p>
                  <p className="font-bold text-lg text-primary">
                    {formatCurrency(selectedReimbursement.amount)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Médecin</p>
                  <p className="font-medium">{selectedReimbursement.doctorName}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                  <p className="text-xs text-muted-foreground">Montant en lettres</p>
                  <p className="font-medium">{selectedReimbursement.amountInWords}</p>
                </div>
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
