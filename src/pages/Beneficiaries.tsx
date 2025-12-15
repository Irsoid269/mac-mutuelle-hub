import { useState } from 'react';
import { Plus, Search, Edit, Trash2, User, AlertCircle, MoreHorizontal, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBeneficiariesData } from '@/hooks/useBeneficiariesData';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateBeneficiaryCardPDF } from '@/lib/pdfGenerator';


export default function Beneficiaries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  

  // Form state
  const [formData, setFormData] = useState({
    insured_id: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'M' as 'M' | 'F',
    relationship: '',
  });

  const { beneficiaries, paidInsuredList, isLoading, refetch } = useBeneficiariesData(searchTerm);

  const handleDownloadCard = async (beneficiary: (typeof beneficiaries)[number]) => {
    try {
      // Fetch full insured data with contract
      const { data: insuredData, error } = await supabase
        .from('insured')
        .select(
          'first_name, last_name, matricule, insurance_start_date, insurance_end_date, contracts:contract_id(raison_sociale, contract_number)',
        )
        .eq('id', beneficiary.insured_id)
        .single();

      if (error) throw error;

      const cardData = {
        ...beneficiary,
        insured: insuredData
          ? {
              first_name: insuredData.first_name,
              last_name: insuredData.last_name,
              matricule: insuredData.matricule,
              insurance_start_date: insuredData.insurance_start_date,
              insurance_end_date: insuredData.insurance_end_date,
              contract: insuredData.contracts
                ? {
                    raison_sociale: insuredData.contracts.raison_sociale,
                    contract_number: insuredData.contracts.contract_number,
                  }
                : undefined,
            }
          : undefined,
      };

      await generateBeneficiaryCardPDF(cardData);
      toast({ title: 'Téléchargement', description: "La carte d'ayant droit a été téléchargée." });
    } catch {
      toast({
        title: 'Erreur',
        description: "Impossible de télécharger la carte.",
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('beneficiaries').insert({
        insured_id: formData.insured_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_date: formData.birth_date,
        gender: formData.gender,
        relationship: formData.relationship as 'conjoint' | 'enfant' | 'parent' | 'autre',
      });

      if (error) throw error;

      toast({
        title: 'Ayant droit ajouté',
        description: "L'ayant droit a été enregistré avec succès.",
      });
      setIsFormOpen(false);
      setFormData({
        insured_id: '',
        first_name: '',
        last_name: '',
        birth_date: '',
        gender: 'M',
        relationship: '',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter l'ayant droit.",
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('beneficiaries').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Ayant droit supprimé',
        description: "L'ayant droit a été supprimé avec succès.",
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'ayant droit.",
        variant: 'destructive',
      });
    }
  };

  const relationshipLabels: Record<string, string> = {
    conjoint: 'Conjoint(e)',
    enfant: 'Enfant',
    parent: 'Parent',
    autre: 'Autre',
  };

  const calculateAge = (birthDate: string) => {
    return differenceInYears(new Date(), new Date(birthDate));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Ayants Droit</h1>
          <p className="page-subtitle">
            {beneficiaries.length} ayants droit enregistrés
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={paidInsuredList.length === 0}>
              <Plus className="w-4 h-4" />
              Ajouter un ayant droit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel Ayant Droit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="input-group">
                <Label className="input-label">Assuré principal (ayant payé sa cotisation)</Label>
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
                  <Label className="input-label">Nom</Label>
                  <Input
                    placeholder="Nom de famille"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Prénom</Label>
                  <Input
                    placeholder="Prénom"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <Label className="input-label">Date de naissance</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Sexe</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) => setFormData({ ...formData, gender: v as 'M' | 'F' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="input-group">
                <Label className="input-label">Lien de parenté</Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(v) => setFormData({ ...formData, relationship: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le lien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conjoint">Conjoint(e)</SelectItem>
                    <SelectItem value="enfant">Enfant</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    !formData.insured_id ||
                    !formData.first_name ||
                    !formData.last_name ||
                    !formData.birth_date ||
                    !formData.relationship
                  }
                >
                  Enregistrer
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
              Les ayants droit ne peuvent être ajoutés qu'aux assurés ayant payé leur cotisation.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou assuré principal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ayant droit</th>
                <th>Assuré principal</th>
                <th>Lien de parenté</th>
                <th>Date de naissance</th>
                <th>Âge</th>
                <th>Sexe</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun ayant droit trouvé
                  </td>
                </tr>
              ) : (
                beneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                          <User className="w-4 h-4 text-secondary-foreground" />
                        </div>
                        <span className="font-medium text-foreground">
                          {beneficiary.first_name} {beneficiary.last_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="text-primary font-medium">
                          {beneficiary.insured?.first_name} {beneficiary.insured?.last_name}
                        </span>
                        <p className="text-xs text-muted-foreground font-mono">
                          {beneficiary.insured?.matricule}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {relationshipLabels[beneficiary.relationship] || beneficiary.relationship}
                      </span>
                    </td>
                    <td>{format(new Date(beneficiary.birth_date), 'dd/MM/yyyy', { locale: fr })}</td>
                    <td>{calculateAge(beneficiary.birth_date)} ans</td>
                    <td>{beneficiary.gender === 'M' ? 'Masculin' : 'Féminin'}</td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              void handleDownloadCard(beneficiary);
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger la carte
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(beneficiary.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
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

    </div>
  );
}
