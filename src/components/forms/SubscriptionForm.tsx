import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { User, Users, Heart, FileText } from 'lucide-react';

interface SubscriptionFormProps {
  onClose: () => void;
}

export function SubscriptionForm({ onClose }: SubscriptionFormProps) {
  const [currentTab, setCurrentTab] = useState('contractant');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Souscription créée',
      description: 'La demande de souscription a été enregistrée avec succès.',
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contractant" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Contractant</span>
          </TabsTrigger>
          <TabsTrigger value="assure" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Assuré</span>
          </TabsTrigger>
          <TabsTrigger value="famille" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Famille</span>
          </TabsTrigger>
          <TabsTrigger value="sante" className="gap-2">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Santé</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contractant" className="space-y-4 mt-6">
          <div className="form-section">
            <h3 className="form-section-title">Informations du Contractant</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Code Client</Label>
                <Input placeholder="00225" />
              </div>
              <div className="input-group">
                <Label className="input-label">N° Contrat (SCM)</Label>
                <Input placeholder="MSF25-XXXX-XXX-XXX/AMF" />
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Raison Sociale</Label>
                <Input placeholder="Nom de l'entreprise ou organisation" />
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Adresse</Label>
                <Input placeholder="Adresse complète" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assure" className="space-y-4 mt-6">
          <div className="form-section">
            <h3 className="form-section-title">Informations de l'Assuré Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Nom</Label>
                <Input placeholder="Nom de famille" />
              </div>
              <div className="input-group">
                <Label className="input-label">Prénom</Label>
                <Input placeholder="Prénom" />
              </div>
              <div className="input-group">
                <Label className="input-label">Nom de jeune fille (si applicable)</Label>
                <Input placeholder="Nom de jeune fille" />
              </div>
              <div className="input-group">
                <Label className="input-label">Date de naissance</Label>
                <Input type="date" />
              </div>
              <div className="input-group">
                <Label className="input-label">Lieu de naissance</Label>
                <Input placeholder="Ville de naissance" />
              </div>
              <div className="input-group">
                <Label className="input-label">Téléphone mobile</Label>
                <Input placeholder="+269 XXX XX XX" />
              </div>
              <div className="input-group">
                <Label className="input-label">Email</Label>
                <Input type="email" placeholder="email@exemple.com" />
              </div>
              <div className="input-group">
                <Label className="input-label">Emploi</Label>
                <Input placeholder="Poste occupé" />
              </div>
              <div className="input-group">
                <Label className="input-label">Lieu de travail</Label>
                <Input placeholder="Lieu de travail" />
              </div>
              <div className="input-group">
                <Label className="input-label">Date d'entrée au service</Label>
                <Input type="date" />
              </div>
              <div className="input-group">
                <Label className="input-label">Date d'entrée à l'assurance</Label>
                <Input type="date" />
              </div>
              <div className="input-group">
                <Label className="input-label">Situation familiale</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marie">Marié(e)</SelectItem>
                    <SelectItem value="celibataire">Célibataire</SelectItem>
                    <SelectItem value="veuf">Veuf(ve)</SelectItem>
                    <SelectItem value="divorce">Divorcé(e)</SelectItem>
                    <SelectItem value="separe">Séparé(e)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Adresse</Label>
                <Input placeholder="Adresse complète" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Informations du Conjoint (si marié)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Nom</Label>
                <Input placeholder="Nom du conjoint" />
              </div>
              <div className="input-group">
                <Label className="input-label">Prénom</Label>
                <Input placeholder="Prénom du conjoint" />
              </div>
              <div className="input-group">
                <Label className="input-label">Date de naissance</Label>
                <Input type="date" />
              </div>
              <div className="input-group">
                <Label className="input-label">Lieu de naissance</Label>
                <Input placeholder="Lieu de naissance" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="famille" className="space-y-4 mt-6">
          <div className="form-section">
            <h3 className="form-section-title">Membres de la famille pris en charge</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez les enfants et autres membres de la famille à couvrir
            </p>

            {[1, 2].map((index) => (
              <div key={index} className="p-4 border border-border rounded-lg mb-4">
                <h4 className="text-sm font-medium text-foreground mb-3">Membre {index}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="input-group">
                    <Label className="input-label">Nom</Label>
                    <Input placeholder="Nom" />
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Prénom</Label>
                    <Input placeholder="Prénom" />
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Date de naissance</Label>
                    <Input type="date" />
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Parenté</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Lien" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enfant">Enfant</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Sexe</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sexe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculin</SelectItem>
                        <SelectItem value="F">Féminin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Âge</Label>
                    <Input type="number" placeholder="Âge" />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" className="w-full">
              + Ajouter un membre
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="sante" className="space-y-4 mt-6">
          <div className="form-section">
            <h3 className="form-section-title">Déclaration de Santé</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Veuillez répondre aux questions suivantes concernant votre état de santé
            </p>

            <div className="space-y-4">
              {[
                'Êtes-vous actuellement sous traitement médical ?',
                'Avez-vous été hospitalisé au cours des 5 dernières années ?',
                'Souffrez-vous de maladies chroniques (diabète, hypertension, etc.) ?',
                'Avez-vous subi des interventions chirurgicales ?',
                'Êtes-vous enceinte actuellement ?',
              ].map((question, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Checkbox id={`q-${index}`} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={`q-${index}`} className="text-sm font-medium cursor-pointer">
                      {question}
                    </Label>
                    <Textarea
                      placeholder="Si oui, précisez..."
                      className="mt-2 h-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Engagement</h3>
            <div className="flex items-start gap-3">
              <Checkbox id="engagement" className="mt-1" />
              <Label htmlFor="engagement" className="text-sm text-muted-foreground cursor-pointer">
                Je certifie que les informations fournies sont exactes et complètes. 
                Je comprends qu'une fausse déclaration peut entraîner la nullité du contrat.
              </Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit">
          Enregistrer la souscription
        </Button>
      </div>
    </form>
  );
}
