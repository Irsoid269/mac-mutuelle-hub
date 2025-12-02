import { useState } from 'react';
import { Search, Download, Eye, Edit, MoreHorizontal, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockInsured, mockFamilyMembers } from '@/data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Insured() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInsured, setSelectedInsured] = useState<typeof mockInsured[0] | null>(null);

  const filteredInsured = mockInsured.filter((insured) => {
    const fullName = `${insured.firstName} ${insured.lastName}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      insured.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insured.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getFamilyMembers = (insuredId: string) => {
    return mockFamilyMembers.filter((m) => m.insuredId === insuredId);
  };

  const maritalStatusLabels: Record<string, string> = {
    marie: 'Marié(e)',
    celibataire: 'Célibataire',
    veuf: 'Veuf(ve)',
    divorce: 'Divorcé(e)',
    separe: 'Séparé(e)',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Assurés</h1>
          <p className="page-subtitle">{mockInsured.length} assurés enregistrés</p>
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

      {/* Search */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, contrat ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInsured.map((insured) => {
          const familyCount = getFamilyMembers(insured.id).length;
          return (
            <div
              key={insured.id}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {insured.firstName[0]}{insured.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {insured.firstName} {insured.lastName}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {insured.contractNumber}
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
                      onClick={() => setSelectedInsured(insured)}
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
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{insured.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{insured.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{insured.employer}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {maritalStatusLabels[insured.maritalStatus]}
                </span>
                {familyCount > 0 && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {familyCount} ayant(s) droit
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
                      {selectedInsured.firstName[0]}{selectedInsured.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {selectedInsured.firstName} {selectedInsured.lastName}
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedInsured.contractNumber}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">
                      {selectedInsured.birthDate.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Lieu de naissance</p>
                    <p className="font-medium">{selectedInsured.birthPlace}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedInsured.phone}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedInsured.email}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Employeur</p>
                    <p className="font-medium">{selectedInsured.employer}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Poste</p>
                    <p className="font-medium">{selectedInsured.jobTitle}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="font-medium">{selectedInsured.address}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="family" className="mt-4">
                <div className="space-y-3">
                  {getFamilyMembers(selectedInsured.id).length > 0 ? (
                    getFamilyMembers(selectedInsured.id).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-sm font-medium text-secondary-foreground">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.relationship === 'enfant' ? 'Enfant' : 'Autre'} • {member.age} ans
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
