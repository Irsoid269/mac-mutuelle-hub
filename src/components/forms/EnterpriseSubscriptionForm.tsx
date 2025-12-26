import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Building2, Users, CheckCircle, Loader2, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { auditLog } from '@/lib/auditLog';

interface EnterpriseSubscriptionFormProps {
  onClose: () => void;
}

interface Employee {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  job_title: string;
}

export function EnterpriseSubscriptionForm({ onClose }: EnterpriseSubscriptionFormProps) {
  const [currentTab, setCurrentTab] = useState('entreprise');
  const [isLoading, setIsLoading] = useState(false);

  // Enterprise data
  const [clientCode, setClientCode] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [raisonSociale, setRaisonSociale] = useState('');
  const [secteurActivite, setSecteurActivite] = useState('');
  const [siret, setSiret] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [contractPhone, setContractPhone] = useState('');
  const [contractEmail, setContractEmail] = useState('');
  const [insuranceStartDate, setInsuranceStartDate] = useState('');

  // Representative data
  const [representantNom, setRepresentantNom] = useState('');
  const [representantPrenom, setRepresentantPrenom] = useState('');
  const [representantFonction, setRepresentantFonction] = useState('');
  const [representantPhone, setRepresentantPhone] = useState('');
  const [representantEmail, setRepresentantEmail] = useState('');

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([
    { first_name: '', last_name: '', birth_date: '', gender: 'M', phone: '', email: '', job_title: '' },
  ]);

  const [engagement, setEngagement] = useState(false);

  // Generate codes on mount
  useEffect(() => {
    const generateCodes = async () => {
      try {
        const { data: lastContract } = await supabase
          .from('contracts')
          .select('client_code')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let nextCode = 1;
        if (lastContract?.client_code) {
          const lastNumber = parseInt(lastContract.client_code, 10);
          if (!isNaN(lastNumber)) {
            nextCode = lastNumber + 1;
          }
        }
        const newClientCode = nextCode.toString().padStart(5, '0');
        setClientCode(newClientCode);

        const year = new Date().getFullYear().toString().slice(-2);
        const random1 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const random2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const random3 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const newContractNumber = `ENT${year}-${random1}-${random2}-${random3}/MAC`;
        setContractNumber(newContractNumber);
      } catch (error) {
        console.error('Error generating codes:', error);
      }
    };
    generateCodes();
  }, []);

  const generateMatricule = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `MAC${year}${random}`;
  };

  const addEmployee = () => {
    setEmployees([...employees, { first_name: '', last_name: '', birth_date: '', gender: 'M', phone: '', email: '', job_title: '' }]);
  };

  const updateEmployee = (index: number, field: keyof Employee, value: string) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: value };
    setEmployees(updated);
  };

  const removeEmployee = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientCode || !contractNumber || !raisonSociale) {
      toast.error("Veuillez remplir les informations de l'entreprise");
      setCurrentTab('entreprise');
      return;
    }

    const validEmployees = employees.filter(m => m.first_name && m.last_name && m.birth_date);
    if (validEmployees.length === 0) {
      toast.error("Veuillez ajouter au moins un employé à assurer");
      setCurrentTab('employes');
      return;
    }

    if (!engagement) {
      toast.error("Veuillez accepter l'engagement");
      setCurrentTab('validation');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create the contract
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert({
          client_code: clientCode,
          contract_number: contractNumber,
          raison_sociale: raisonSociale,
          contract_type: 'entreprise',
          address: contractAddress || null,
          phone: contractPhone || null,
          email: contractEmail || null,
          status: 'en_attente',
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // 2. Create employees as insured
      for (const employee of validEmployees) {
        const employeeMatricule = generateMatricule();
        const { error: employeeError } = await supabase
          .from('insured')
          .insert({
            contract_id: contractData.id,
            matricule: employeeMatricule,
            first_name: employee.first_name,
            last_name: employee.last_name,
            birth_date: employee.birth_date,
            gender: employee.gender,
            marital_status: 'celibataire',
            employer: raisonSociale,
            job_title: employee.job_title || null,
            phone: employee.phone || null,
            email: employee.email || null,
            insurance_start_date: insuranceStartDate || new Date().toISOString().split('T')[0],
            status: 'en_attente',
          });

        if (employeeError) console.error('Error creating employee:', employeeError);
      }

      // Log audit
      auditLog.create('contract', `Nouveau contrat entreprise ${contractNumber} - ${raisonSociale}`, contractData.id);

      toast.success(`Contrat entreprise créé - ${validEmployees.length} employé(s) enregistré(s)`);
      onClose();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error.message || 'Une erreur est survenue lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entreprise" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Entreprise</span>
          </TabsTrigger>
          <TabsTrigger value="employes" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Employés</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Validation</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entreprise" className="space-y-4 mt-6">
          <div className="form-section">
            <h3 className="form-section-title flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Informations de l'Entreprise
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Code Client *</Label>
                <Input
                  value={clientCode}
                  readOnly
                  className="bg-muted font-mono"
                />
              </div>
              <div className="input-group">
                <Label className="input-label">N° Contrat *</Label>
                <Input
                  value={contractNumber}
                  readOnly
                  className="bg-muted font-mono"
                />
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Raison Sociale *</Label>
                <Input
                  placeholder="Nom de l'entreprise"
                  value={raisonSociale}
                  onChange={(e) => setRaisonSociale(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Secteur d'activité</Label>
                <Input
                  placeholder="Ex: Commerce, BTP, Services..."
                  value={secteurActivite}
                  onChange={(e) => setSecteurActivite(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">N° SIRET / RC</Label>
                <Input
                  placeholder="Numéro d'identification"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Téléphone</Label>
                <Input
                  placeholder="+269 XXX XX XX"
                  value={contractPhone}
                  onChange={(e) => setContractPhone(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Email</Label>
                <Input
                  type="email"
                  placeholder="contact@entreprise.com"
                  value={contractEmail}
                  onChange={(e) => setContractEmail(e.target.value)}
                />
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Adresse du siège</Label>
                <Input
                  placeholder="Adresse complète"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Date de début de couverture</Label>
                <Input
                  type="date"
                  value={insuranceStartDate}
                  onChange={(e) => setInsuranceStartDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Représentant Légal (Optionnel)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Nom</Label>
                <Input
                  placeholder="Nom du représentant"
                  value={representantNom}
                  onChange={(e) => setRepresentantNom(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Prénom</Label>
                <Input
                  placeholder="Prénom du représentant"
                  value={representantPrenom}
                  onChange={(e) => setRepresentantPrenom(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Fonction</Label>
                <Input
                  placeholder="Ex: Directeur Général, Gérant..."
                  value={representantFonction}
                  onChange={(e) => setRepresentantFonction(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Téléphone</Label>
                <Input
                  placeholder="+269 XXX XX XX"
                  value={representantPhone}
                  onChange={(e) => setRepresentantPhone(e.target.value)}
                />
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Email</Label>
                <Input
                  type="email"
                  placeholder="representant@entreprise.com"
                  value={representantEmail}
                  onChange={(e) => setRepresentantEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="employes" className="space-y-4 mt-6">
          <div className="form-section">
            <h3 className="form-section-title flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Liste des Employés à Assurer
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez tous les employés qui seront couverts par ce contrat d'assurance groupe.
            </p>

            {employees.map((employee, index) => (
              <div key={index} className="p-4 border border-border rounded-lg mb-4 bg-card">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    Employé {index + 1}
                  </h4>
                  {employees.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmployee(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="input-group">
                    <Label className="input-label">Nom *</Label>
                    <Input
                      placeholder="Nom de famille"
                      value={employee.last_name}
                      onChange={(e) => updateEmployee(index, 'last_name', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Prénom *</Label>
                    <Input
                      placeholder="Prénom"
                      value={employee.first_name}
                      onChange={(e) => updateEmployee(index, 'first_name', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Date de naissance *</Label>
                    <Input
                      type="date"
                      value={employee.birth_date}
                      onChange={(e) => updateEmployee(index, 'birth_date', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Sexe</Label>
                    <Select
                      value={employee.gender}
                      onValueChange={(v) => updateEmployee(index, 'gender', v)}
                    >
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
                    <Label className="input-label">Poste / Fonction</Label>
                    <Input
                      placeholder="Ex: Comptable, Chauffeur..."
                      value={employee.job_title}
                      onChange={(e) => updateEmployee(index, 'job_title', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Téléphone</Label>
                    <Input
                      placeholder="+269 XXX XX XX"
                      value={employee.phone}
                      onChange={(e) => updateEmployee(index, 'phone', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" className="w-full" onClick={addEmployee}>
              + Ajouter un employé
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4 mt-6">
          <div className="form-section">
            <h3 className="form-section-title flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Récapitulatif du Contrat
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                <span className="text-muted-foreground">Entreprise :</span>
                <span className="font-semibold text-primary">{raisonSociale || '-'}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground">N° Contrat :</span>
                <span className="font-medium font-mono">{contractNumber}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground">Code Client :</span>
                <span className="font-medium font-mono">{clientCode}</span>
              </div>
              {secteurActivite && (
                <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Secteur :</span>
                  <span className="font-medium">{secteurActivite}</span>
                </div>
              )}
              <div className="flex justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-muted-foreground">Employés à assurer :</span>
                <span className="font-bold text-green-600">{employees.filter(m => m.first_name && m.last_name && m.birth_date).length}</span>
              </div>
              {representantNom && (
                <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Représentant :</span>
                  <span className="font-medium">{representantPrenom} {representantNom}</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Engagement</h3>
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
              <Checkbox
                id="engagement"
                className="mt-1"
                checked={engagement}
                onCheckedChange={(checked) => setEngagement(!!checked)}
              />
              <Label htmlFor="engagement" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                En tant que représentant légal de l'entreprise <strong>{raisonSociale || '[Nom entreprise]'}</strong>, 
                je certifie que les informations fournies sont exactes et complètes. 
                Je m'engage à respecter les conditions générales du contrat d'assurance groupe 
                et à informer MAC Assurance de tout changement concernant les employés assurés.
              </Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Créer le contrat entreprise'
          )}
        </Button>
      </div>
    </form>
  );
}
