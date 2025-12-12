import { useState } from 'react';
import { Search, Download, Eye, Edit, MoreHorizontal, Phone, Mail, MapPin, CheckCircle, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInsuredData } from '@/hooks/useInsuredData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState as useStateEffect } from 'react';

export default function Insured() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInsured, setSelectedInsured] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  const { insured, isLoading } = useInsuredData({ searchTerm });

  const fetchFamilyMembers = async (insuredId: string) => {
    const { data } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('insured_id', insuredId);
    setFamilyMembers(data || []);
  };

  const handleViewInsured = (ins: any) => {
    setSelectedInsured(ins);
    fetchFamilyMembers(ins.id);
  };

  const maritalStatusLabels: Record<string, string> = {
    marie: 'Marié(e)',
    celibataire: 'Célibataire',
    veuf: 'Veuf(ve)',
    divorce: 'Divorcé(e)',
    separe: 'Séparé(e)',
  };

  const statusLabels: Record<string, string> = {
    en_attente: 'En attente',
    validee: 'Validé',
    rejetee: 'Rejeté',
    reserve_medicale: 'Réserve médicale',
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Assurés</h1>
          <p className="page-subtitle">{insured.length} assurés enregistrés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-blue-800 dark:text-blue-200">
            Gestion des ayants droit
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Seuls les assurés ayant le badge <span className="inline-flex items-center gap-1 font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-xs"><CheckCircle className="w-3 h-3" />Cotisation payée</span> peuvent avoir des ayants droit. Les assurés avec une cotisation impayée ne peuvent pas être sélectionnés lors de l'ajout d'un ayant droit.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, matricule ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {insured.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Aucun assuré trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insured.map((ins) => (
            <div
              key={ins.id}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {ins.first_name[0]}{ins.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {ins.first_name} {ins.last_name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {ins.matricule}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => handleViewInsured(ins)}
                    >
                      <Eye className="w-4 h-4" />
                      Voir fiche
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Edit className="w-4 h-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2">
                      <Download className="w-4 h-4" />
                      Export PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm">
                {ins.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{ins.email}</span>
                  </div>
                )}
                {ins.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{ins.phone}</span>
                  </div>
                )}
                {ins.employer && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{ins.employer}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {maritalStatusLabels[ins.marital_status] || ins.marital_status}
                </span>
                <div className="flex items-center gap-2">
                  {ins.has_paid_contribution ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Cotisation payée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                      <XCircle className="w-3 h-3" />
                      Non payé
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedInsured} onOpenChange={() => setSelectedInsured(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fiche Assuré</DialogTitle>
          </DialogHeader>
          {selectedInsured && (
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="family">Famille</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {selectedInsured.first_name[0]}{selectedInsured.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {selectedInsured.first_name} {selectedInsured.last_name}
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedInsured.matricule}
                    </p>
                    {selectedInsured.has_paid_contribution && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Cotisation à jour
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">
                      {format(new Date(selectedInsured.birth_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Lieu de naissance</p>
                    <p className="font-medium">{selectedInsured.birth_place || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedInsured.phone || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedInsured.email || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Employeur</p>
                    <p className="font-medium">{selectedInsured.employer || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Poste</p>
                    <p className="font-medium">{selectedInsured.job_title || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Contrat</p>
                    <p className="font-medium">{selectedInsured.contract?.contract_number || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Entreprise</p>
                    <p className="font-medium">{selectedInsured.contract?.raison_sociale || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="font-medium">{selectedInsured.address || '-'}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="family" className="mt-4">
                <div className="space-y-3">
                  {familyMembers.length > 0 ? (
                    familyMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-sm font-medium text-secondary-foreground">
                              {member.first_name[0]}{member.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.relationship === 'enfant' ? 'Enfant' : 
                               member.relationship === 'conjoint' ? 'Conjoint(e)' :
                               member.relationship === 'parent' ? 'Parent' : 'Autre'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {member.gender === 'M' ? 'Masculin' : 'Féminin'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun ayant droit enregistré
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <p className="text-center text-muted-foreground py-8">
                  Historique des remboursements à venir
                </p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
