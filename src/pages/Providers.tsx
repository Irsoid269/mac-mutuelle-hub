import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Building2,
  Stethoscope,
  FlaskConical,
  Pill,
  Hospital,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useProvidersData } from '@/hooks/useProvidersData';
import { Database } from '@/integrations/supabase/types';

type ProviderType = Database['public']['Enums']['provider_type'];

const providerTypeConfig: Record<ProviderType, { label: string; icon: any; color: string }> = {
  hopital: { label: 'Hôpital', icon: Hospital, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  clinique: { label: 'Clinique', icon: Building2, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  laboratoire: { label: 'Laboratoire', icon: FlaskConical, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
  pharmacie: { label: 'Pharmacie', icon: Pill, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  medecin: { label: 'Médecin', icon: Stethoscope, color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300' },
  autre: { label: 'Autre', icon: Building2, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
};

const initialFormData = {
  name: '',
  provider_type: '' as ProviderType | '',
  address: '',
  city: '',
  phone: '',
  email: '',
  is_conventioned: false,
  convention_number: '',
  notes: '',
};

export default function Providers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<any>(null);
  const [formData, setFormData] = useState(initialFormData);

  const {
    providers,
    stats,
    isLoading,
    createProvider,
    updateProvider,
    deleteProvider,
  } = useProvidersData(searchTerm, typeFilter);

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.provider_type) {
        toast({
          title: 'Erreur',
          description: 'Veuillez remplir les champs obligatoires.',
          variant: 'destructive',
        });
        return;
      }

      if (isEditMode && selectedProvider) {
        await updateProvider(selectedProvider.id, {
          name: formData.name,
          provider_type: formData.provider_type as ProviderType,
          address: formData.address || null,
          city: formData.city || null,
          phone: formData.phone || null,
          email: formData.email || null,
          is_conventioned: formData.is_conventioned,
          convention_number: formData.convention_number || null,
          notes: formData.notes || null,
        });
        toast({
          title: 'Prestataire modifié',
          description: `${formData.name} a été mis à jour.`,
        });
      } else {
        await createProvider({
          name: formData.name,
          provider_type: formData.provider_type as ProviderType,
          address: formData.address || null,
          city: formData.city || null,
          phone: formData.phone || null,
          email: formData.email || null,
          is_conventioned: formData.is_conventioned,
          convention_number: formData.convention_number || null,
          notes: formData.notes || null,
        });
        toast({
          title: 'Prestataire créé',
          description: `${formData.name} a été ajouté à la liste.`,
        });
      }

      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le prestataire.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (provider: any) => {
    setSelectedProvider(provider);
    setFormData({
      name: provider.name,
      provider_type: provider.provider_type,
      address: provider.address || '',
      city: provider.city || '',
      phone: provider.phone || '',
      email: provider.email || '',
      is_conventioned: provider.is_conventioned,
      convention_number: provider.convention_number || '',
      notes: provider.notes || '',
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!providerToDelete) return;
    try {
      await deleteProvider(providerToDelete.id, providerToDelete.name);
      toast({
        title: 'Prestataire supprimé',
        description: `${providerToDelete.name} a été supprimé.`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le prestataire.',
        variant: 'destructive',
      });
    }
    setDeleteDialogOpen(false);
    setProviderToDelete(null);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setIsEditMode(false);
    setSelectedProvider(null);
  };

  const openNewForm = () => {
    resetForm();
    setIsFormOpen(true);
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
          <h1 className="page-title">Gestion des Prestataires</h1>
          <p className="page-subtitle">Hôpitaux, cliniques, pharmacies, laboratoires et médecins</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openNewForm}>
              <Plus className="w-4 h-4" />
              Nouveau prestataire
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Modifier le prestataire' : 'Nouveau Prestataire'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Modifiez les informations du prestataire.' : 'Ajoutez un nouveau prestataire de soins.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group col-span-2">
                  <Label className="input-label">Nom du prestataire *</Label>
                  <Input
                    placeholder="CHU El Maarouf"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Type *</Label>
                  <Select
                    value={formData.provider_type}
                    onValueChange={(v) => setFormData({ ...formData, provider_type: v as ProviderType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(providerTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <config.icon className="w-4 h-4" />
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="input-group">
                  <Label className="input-label">Ville</Label>
                  <Input
                    placeholder="Moroni"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <Label className="input-label">Adresse</Label>
                <Input
                  placeholder="Adresse complète"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <Label className="input-label">Téléphone</Label>
                  <Input
                    placeholder="+269 ..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                <div className="space-y-0.5">
                  <Label className="font-medium">Conventionné</Label>
                  <p className="text-sm text-muted-foreground">Ce prestataire a une convention avec MAC Assurance</p>
                </div>
                <Switch
                  checked={formData.is_conventioned}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_conventioned: checked })}
                />
              </div>
              {formData.is_conventioned && (
                <div className="input-group">
                  <Label className="input-label">N° de convention</Label>
                  <Input
                    placeholder="CONV-..."
                    value={formData.convention_number}
                    onChange={(e) => setFormData({ ...formData, convention_number: e.target.value })}
                  />
                </div>
              )}
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
                <Button onClick={handleSubmit} disabled={!formData.name || !formData.provider_type}>
                  {isEditMode ? 'Modifier' : 'Créer'}
                </Button>
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
            placeholder="Rechercher par nom, ville ou N° convention..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(providerTypeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { key: 'total', label: 'Total', count: stats.total, color: 'bg-primary/10 text-primary' },
          { key: 'hopital', label: 'Hôpitaux', count: stats.hopital, color: 'bg-blue-500/10 text-blue-600' },
          { key: 'clinique', label: 'Cliniques', count: stats.clinique, color: 'bg-purple-500/10 text-purple-600' },
          { key: 'laboratoire', label: 'Laboratoires', count: stats.laboratoire, color: 'bg-amber-500/10 text-amber-600' },
          { key: 'pharmacie', label: 'Pharmacies', count: stats.pharmacie, color: 'bg-green-500/10 text-green-600' },
          { key: 'medecin', label: 'Médecins', count: stats.medecin, color: 'bg-cyan-500/10 text-cyan-600' },
          { key: 'conventioned', label: 'Conventionnés', count: stats.conventioned, color: 'bg-success/10 text-success' },
        ].map((stat) => (
          <div
            key={stat.key}
            className="bg-card p-4 rounded-xl border border-border cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => stat.key !== 'total' && stat.key !== 'conventioned' && setTypeFilter(stat.key === typeFilter ? 'all' : stat.key)}
          >
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
                <th>Prestataire</th>
                <th>Type</th>
                <th>Localisation</th>
                <th>Contact</th>
                <th>Convention</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun prestataire trouvé
                  </td>
                </tr>
              ) : (
                providers.map((provider) => {
                  const typeConfig = providerTypeConfig[provider.provider_type];
                  const TypeIcon = typeConfig.icon;
                  return (
                    <tr key={provider.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${typeConfig.color} flex items-center justify-center`}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{provider.name}</p>
                            {provider.convention_number && (
                              <p className="text-xs text-muted-foreground">{provider.convention_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="secondary" className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {provider.city || provider.address || '-'}
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {provider.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="w-3.5 h-3.5" />
                              {provider.phone}
                            </div>
                          )}
                          {provider.email && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="w-3.5 h-3.5" />
                              {provider.email}
                            </div>
                          )}
                          {!provider.phone && !provider.email && <span className="text-muted-foreground">-</span>}
                        </div>
                      </td>
                      <td>
                        {provider.is_conventioned ? (
                          <Badge className="bg-success/10 text-success border-success/30 gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Oui
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Non</Badge>
                        )}
                      </td>
                      <td className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => setSelectedProvider(provider)}>
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(provider)}>
                              <Edit className="w-4 h-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => {
                                setProviderToDelete(provider);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le prestataire "{providerToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={!!selectedProvider && !isEditMode} onOpenChange={(open) => !open && setSelectedProvider(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du prestataire</DialogTitle>
            <DialogDescription>Informations complètes du prestataire de soins.</DialogDescription>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl ${providerTypeConfig[selectedProvider.provider_type as ProviderType].color} flex items-center justify-center`}>
                  {(() => {
                    const Icon = providerTypeConfig[selectedProvider.provider_type as ProviderType].icon;
                    return <Icon className="w-8 h-8" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedProvider.name}</h3>
                  <Badge className={providerTypeConfig[selectedProvider.provider_type as ProviderType].color}>
                    {providerTypeConfig[selectedProvider.provider_type as ProviderType].label}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="font-medium">{selectedProvider.address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ville</p>
                  <p className="font-medium">{selectedProvider.city || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedProvider.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedProvider.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conventionné</p>
                  <p className="font-medium">{selectedProvider.is_conventioned ? 'Oui' : 'Non'}</p>
                </div>
                {selectedProvider.convention_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">N° Convention</p>
                    <p className="font-medium">{selectedProvider.convention_number}</p>
                  </div>
                )}
              </div>
              {selectedProvider.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{selectedProvider.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
