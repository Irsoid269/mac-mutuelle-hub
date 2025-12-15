import { useState } from 'react';
import { Save, User, Shield, Bell, Database, Mail, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ReimbursementCeilingsTab } from '@/components/settings/ReimbursementCeilingsTab';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertNotifications, setAlertNotifications] = useState(true);

  const handleSave = () => {
    toast({
      title: 'Paramètres enregistrés',
      description: 'Vos modifications ont été sauvegardées.',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-subtitle">Configuration du système</p>
        </div>
        <Button className="gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" />
          Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card border border-border p-1">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="w-4 h-4" />
            Rôles
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Database className="w-4 h-4" />
            Système
          </TabsTrigger>
          <TabsTrigger value="ceilings" className="gap-2">
            <Calculator className="w-4 h-4" />
            Barèmes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="form-section">
            <h3 className="form-section-title">Informations du profil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Nom complet</Label>
                <Input defaultValue="Administrateur Principal" />
              </div>
              <div className="input-group">
                <Label className="input-label">Email</Label>
                <Input type="email" defaultValue="admin@macassurances.com" />
              </div>
              <div className="input-group">
                <Label className="input-label">Téléphone</Label>
                <Input defaultValue="+269 321 00 00" />
              </div>
              <div className="input-group">
                <Label className="input-label">Rôle</Label>
                <Input defaultValue="Administrateur" disabled />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Changer le mot de passe</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Mot de passe actuel</Label>
                <Input type="password" />
              </div>
              <div />
              <div className="input-group">
                <Label className="input-label">Nouveau mot de passe</Label>
                <Input type="password" />
              </div>
              <div className="input-group">
                <Label className="input-label">Confirmer le mot de passe</Label>
                <Input type="password" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="form-section">
            <h3 className="form-section-title">Gestion des rôles</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Définissez les permissions pour chaque rôle du système
            </p>

            <div className="space-y-4">
              {[
                {
                  name: 'Administrateur',
                  description: 'Accès complet à toutes les fonctionnalités',
                  color: 'bg-primary/10 text-primary',
                },
                {
                  name: 'Agent',
                  description: 'Gestion des souscriptions et remboursements',
                  color: 'bg-info/10 text-info',
                },
                {
                  name: 'Médecin-conseil',
                  description: 'Validation médicale des souscriptions',
                  color: 'bg-success/10 text-success',
                },
                {
                  name: 'Comptabilité',
                  description: 'Gestion des paiements et rapports financiers',
                  color: 'bg-warning/10 text-warning',
                },
              ].map((role) => (
                <div
                  key={role.name}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${role.color}`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{role.name}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurer
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="form-section">
            <h3 className="form-section-title">Préférences de notification</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Notifications par email</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des emails pour les événements importants
                    </p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Alertes système</p>
                    <p className="text-sm text-muted-foreground">
                      Afficher les alertes dans le tableau de bord
                    </p>
                  </div>
                </div>
                <Switch
                  checked={alertNotifications}
                  onCheckedChange={setAlertNotifications}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Types de notifications</h3>
            <div className="space-y-3">
              {[
                'Nouvelles souscriptions',
                'Demandes de remboursement',
                'Réserves médicales',
                'Paiements effectués',
                'Documents expirés',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm text-foreground">{item}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="form-section">
            <h3 className="form-section-title">Configuration système</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Devise</Label>
                <Select defaultValue="KMF">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KMF">Franc Comorien (KMF)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="USD">Dollar US (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="input-group">
                <Label className="input-label">Langue</Label>
                <Select defaultValue="fr">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ar">Arabe</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="input-group">
                <Label className="input-label">Format de date</Label>
                <Select defaultValue="dd/mm/yyyy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">JJ/MM/AAAA</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/JJ/AAAA</SelectItem>
                    <SelectItem value="yyyy-mm-dd">AAAA-MM-JJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="input-group">
                <Label className="input-label">Fuseau horaire</Label>
                <Select defaultValue="Africa/Nairobi">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Nairobi">Comores (EAT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Informations de l'organisation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group md:col-span-2">
                <Label className="input-label">Nom de l'organisation</Label>
                <Input defaultValue="MAC ASSURANCES - Mutuelles et Assurances des Comores" />
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Adresse</Label>
                <Input defaultValue="Avenue de Strasbourg, Moroni-Bacha" />
              </div>
              <div className="input-group">
                <Label className="input-label">Email</Label>
                <Input defaultValue="mac.assurances@gmail.com" />
              </div>
              <div className="input-group">
                <Label className="input-label">Site web</Label>
                <Input defaultValue="www.macassurances.com" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ceilings">
          <ReimbursementCeilingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
