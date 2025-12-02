import { useState } from 'react';
import { Plus, Search, Edit, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockFamilyMembers, mockInsured } from '@/data/mockData';
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
import { toast } from '@/hooks/use-toast';

export default function Beneficiaries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const getInsuredName = (insuredId: string) => {
    const insured = mockInsured.find((i) => i.id === insuredId);
    return insured ? `${insured.firstName} ${insured.lastName}` : 'N/A';
  };

  const filteredMembers = mockFamilyMembers.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const insuredName = getInsuredName(member.insuredId).toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      insuredName.includes(searchTerm.toLowerCase())
    );
  });

  const handleSave = () => {
    toast({
      title: 'Ayant droit ajouté',
      description: "L'ayant droit a été enregistré avec succès.",
    });
    setIsFormOpen(false);
  };

  const relationshipLabels: Record<string, string> = {
    enfant: 'Enfant',
    parent: 'Parent',
    autre: 'Autre',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Ayants Droit</h1>
          <p className="page-subtitle">
            {mockFamilyMembers.length} ayants droit enregistrés
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
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
                <Label className="input-label">Assuré principal</Label>
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
                  <Label className="input-label">Nom</Label>
                  <Input placeholder="Nom de famille" />
                </div>
                <div className="input-group">
                  <Label className="input-label">Prénom</Label>
                  <Input placeholder="Prénom" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <Label className="input-label">Date de naissance</Label>
                  <Input type="date" />
                </div>
                <div className="input-group">
                  <Label className="input-label">Sexe</Label>
                  <Select>
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
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le lien" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Button onClick={handleSave}>Enregistrer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                      <span className="font-medium text-foreground">
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="text-primary">{getInsuredName(member.insuredId)}</span>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {relationshipLabels[member.relationship]}
                    </span>
                  </td>
                  <td>{member.birthDate.toLocaleDateString('fr-FR')}</td>
                  <td>{member.age} ans</td>
                  <td>{member.gender === 'M' ? 'Masculin' : 'Féminin'}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
