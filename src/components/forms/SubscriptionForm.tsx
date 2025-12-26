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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Users, Heart, FileText, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateFicheSubscriptionPDF, FicheSubscriptionPDFData } from '@/lib/pdfGenerator';
import { auditLog } from '@/lib/auditLog';

interface SubscriptionFormProps {
  onClose: () => void;
}

interface FamilyMember {
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  relationship: 'enfant' | 'parent' | 'autre' | 'conjoint';
  gender: 'M' | 'F';
  age: string;
}

interface HealthInfo {
  taille: string;
  poids: string;
  tension: string;
}

export function SubscriptionForm({ onClose }: SubscriptionFormProps) {
  const [currentTab, setCurrentTab] = useState('contractant');
  const [isLoading, setIsLoading] = useState(false);

  // Contract data - auto-generated
  const [clientCode, setClientCode] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [raisonSociale, setRaisonSociale] = useState('');
  const [contractType, setContractType] = useState<'entreprise' | 'famille'>('entreprise');
  const [contractAddress, setContractAddress] = useState('');
  const [contractPhone, setContractPhone] = useState('');
  const [contractEmail, setContractEmail] = useState('');

  // Génération automatique du Code Client et N° Contrat au chargement
  useEffect(() => {
    const generateCodes = async () => {
      try {
        // Récupérer le dernier code client pour incrémenter
        const { data: lastContract } = await supabase
          .from('contracts')
          .select('client_code')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Générer le nouveau code client (format: 00001, 00002, etc.)
        let nextCode = 1;
        if (lastContract?.client_code) {
          const lastNumber = parseInt(lastContract.client_code, 10);
          if (!isNaN(lastNumber)) {
            nextCode = lastNumber + 1;
          }
        }
        const newClientCode = nextCode.toString().padStart(5, '0');
        setClientCode(newClientCode);

        // Générer le N° Contrat (format: MSF25-XXXX-XXX-XXX/AMF)
        const year = new Date().getFullYear().toString().slice(-2);
        const random1 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const random2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const random3 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const newContractNumber = `MSF${year}-${random1}-${random2}-${random3}/AMF`;
        setContractNumber(newContractNumber);
      } catch (error) {
        console.error('Error generating codes:', error);
      }
    };
    generateCodes();
  }, []);

  // Insured data
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [maidenName, setMaidenName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [employer, setEmployer] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [insuranceStartDate, setInsuranceStartDate] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<string>('celibataire');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');

  // Spouse data
  const [spouseLastName, setSpouseLastName] = useState('');
  const [spouseFirstName, setSpouseFirstName] = useState('');
  const [spouseBirthDate, setSpouseBirthDate] = useState('');
  const [spouseBirthPlace, setSpouseBirthPlace] = useState('');

  // Family members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { first_name: '', last_name: '', birth_date: '', birth_place: '', relationship: 'enfant', gender: 'M', age: '' },
  ]);

  // Health info for main insured
  const [healthInfo, setHealthInfo] = useState<HealthInfo>({
    taille: '',
    poids: '',
    tension: '',
  });

  // Health declarations
  const [healthDeclarations, setHealthDeclarations] = useState<{ question: string; answer: boolean; details: string }[]>([
    { question: 'Êtes-vous actuellement en bonne santé ?', answer: false, details: '' },
    { question: 'Avez-vous un défaut de constitution, une infirmité ou une maladie chronique ?', answer: false, details: '' },
    { question: "Avez-vous dans le passé été atteint d'affection pulmonaire, nerveuse, cardiaque, rénale, d'albumine, de diabète, de maladie de foi, de cancer ?", answer: false, details: '' },
    { question: "Préciser les maladies antérieures et l'époque à laquelle vous les avez contractées.", answer: false, details: '' },
    { question: "Pour les Femmes : Souffrez-vous ou avez-vous souffert de maladie liée à votre état de femme ?", answer: false, details: '' },
    { question: 'Vos couches sont-elles normales ?', answer: false, details: '' },
    { question: 'Avez-vous des cas particuliers autres à signaler ?', answer: false, details: '' },
  ]);

  const [engagement, setEngagement] = useState(false);

  const generateMatricule = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `MAC${year}${random}`;
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { first_name: '', last_name: '', birth_date: '', birth_place: '', relationship: 'enfant', gender: 'M', age: '' }]);
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientCode || !contractNumber || !raisonSociale) {
      toast.error("Veuillez remplir les informations du contractant");
      setCurrentTab('contractant');
      return;
    }

    // Pour les contrats famille, l'assuré principal est obligatoire
    // Pour les contrats entreprise, le représentant est optionnel mais les employés sont obligatoires
    if (contractType === 'famille') {
      if (!lastName || !firstName || !birthDate) {
        toast.error("Veuillez remplir les informations de l'assuré principal");
        setCurrentTab('assure');
        return;
      }
    } else {
      // Pour entreprise, vérifier qu'il y a au moins un employé
      const validEmployees = familyMembers.filter(m => m.first_name && m.last_name && m.birth_date);
      if (validEmployees.length === 0) {
        toast.error("Veuillez ajouter au moins un employé à assurer");
        setCurrentTab('famille');
        return;
      }
    }

    if (!engagement) {
      toast.error("Veuillez accepter l'engagement");
      setCurrentTab('sante');
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
          contract_type: contractType,
          address: contractAddress || null,
          phone: contractPhone || null,
          email: contractEmail || null,
          status: 'en_attente',
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // 2. Pour les contrats famille, créer l'assuré principal
      // Pour les contrats entreprise, on saute cette étape (l'entreprise est le contractant)
      let insuredData: { id: string } | null = null;
      
      if (contractType === 'famille') {
        const matricule = generateMatricule();
        const { data, error: insuredError } = await supabase
          .from('insured')
          .insert({
            contract_id: contractData.id,
            matricule,
            first_name: firstName,
            last_name: lastName,
            maiden_name: maidenName || null,
            birth_date: birthDate,
            birth_place: birthPlace || null,
            gender,
            marital_status: maritalStatus as any,
            phone: phone || null,
            email: email || null,
            job_title: jobTitle || null,
            employer: employer || null,
            work_location: workLocation || null,
            address: address || null,
            insurance_start_date: insuranceStartDate || new Date().toISOString().split('T')[0],
            status: 'en_attente',
          })
          .select()
          .single();

        if (insuredError) throw insuredError;
        insuredData = data;
      }

      // 3. Create spouse as beneficiary if married and spouse info provided (only for famille)
      if (contractType === 'famille' && insuredData && maritalStatus === 'marie' && spouseFirstName && spouseLastName && spouseBirthDate) {
        const { error: spouseError } = await supabase
          .from('beneficiaries')
          .insert({
            insured_id: insuredData.id,
            first_name: spouseFirstName,
            last_name: spouseLastName,
            birth_date: spouseBirthDate,
            birth_place: spouseBirthPlace || null,
            relationship: 'conjoint',
            gender: gender === 'M' ? 'F' : 'M',
          });

        if (spouseError) console.error('Error creating spouse:', spouseError);
      }

      // 4. Create employees as insured OR family members as beneficiaries
      const validMembers = familyMembers.filter(m => m.first_name && m.last_name && m.birth_date);
      if (validMembers.length > 0) {
        if (contractType === 'entreprise') {
          // For enterprise contracts, add employees as insured
          for (const member of validMembers) {
            const employeeMatricule = generateMatricule();
            const { error: employeeError } = await supabase
              .from('insured')
              .insert({
                contract_id: contractData.id,
                matricule: employeeMatricule,
                first_name: member.first_name,
                last_name: member.last_name,
                birth_date: member.birth_date,
                gender: member.gender as 'M' | 'F',
                marital_status: 'celibataire',
                employer: raisonSociale, // L'employeur est l'entreprise contractante
                insurance_start_date: insuranceStartDate || new Date().toISOString().split('T')[0],
                status: 'en_attente',
              });

            if (employeeError) console.error('Error creating employee:', employeeError);
          }
        } else if (insuredData) {
          // For family contracts, add members as beneficiaries
          const { error: membersError } = await supabase
            .from('beneficiaries')
            .insert(
              validMembers.map(member => ({
                insured_id: insuredData.id,
                first_name: member.first_name,
                last_name: member.last_name,
                birth_date: member.birth_date,
                relationship: member.relationship,
                gender: member.gender,
              }))
            );

          if (membersError) console.error('Error creating family members:', membersError);
        }
      }

      // 5. Create health declarations (only for famille contracts with insured)
      if (contractType === 'famille' && insuredData) {
        const declarations = healthDeclarations.filter(d => d.answer);
        if (declarations.length > 0) {
          const { error: declarationsError } = await supabase
            .from('health_declarations')
            .insert(
              declarations.map(d => ({
                insured_id: insuredData.id,
                question: d.question,
                answer: d.answer,
                details: d.details || null,
              }))
            );

          if (declarationsError) console.error('Error creating health declarations:', declarationsError);
        }
      }

      // Log audit
      auditLog.create('contract', `Nouvelle souscription ${contractNumber} - ${raisonSociale}`, contractData.id);

      const successMessage = contractType === 'entreprise' 
        ? `Contrat entreprise créé - ${validMembers.length} employé(s) enregistré(s)`
        : `Souscription créée - Matricule: ${insuredData ? 'OK' : 'N/A'}`;
      toast.success(successMessage);

      onClose();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error.message || 'Une erreur est survenue lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  // Générer la fiche de souscription PDF
  const handleGeneratePDF = () => {
    const pdfData: FicheSubscriptionPDFData = {
      client_code: clientCode,
      contract_number: contractNumber,
      raison_sociale: raisonSociale,
      address: contractAddress,
      insured: {
        last_name: lastName,
        first_name: firstName,
        maiden_name: maidenName,
        birth_date: birthDate,
        birth_place: birthPlace,
        address: address,
        job_title: jobTitle,
        work_location: workLocation,
        phone: phone,
        email: email,
        insurance_start_date: insuranceStartDate,
        marital_status: maritalStatus,
        gender: gender,
      },
      spouse: maritalStatus === 'marie' && spouseFirstName ? {
        last_name: spouseLastName,
        first_name: spouseFirstName,
        birth_date: spouseBirthDate,
        birth_place: spouseBirthPlace,
      } : undefined,
      family_members: familyMembers.filter(m => m.first_name && m.last_name).map(m => ({
        last_name: m.last_name,
        first_name: m.first_name,
        birth_date: m.birth_date,
        relationship: m.relationship,
        gender: m.gender,
      })),
      health_declarations: [],
      signature_location: 'Moroni',
      signature_date: new Date().toISOString(),
    };
    
    generateFicheSubscriptionPDF(pdfData);
    toast.success('Fiche de souscription générée avec succès');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className={`grid w-full ${contractType === 'entreprise' ? 'grid-cols-3' : 'grid-cols-4'}`}>
          <TabsTrigger value="contractant" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{contractType === 'entreprise' ? 'Entreprise' : 'Contractant'}</span>
          </TabsTrigger>
          {contractType === 'famille' && (
            <TabsTrigger value="assure" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Assuré Principal</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="famille" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{contractType === 'entreprise' ? 'Employés' : 'Famille'}</span>
          </TabsTrigger>
          <TabsTrigger value="sante" className="gap-2">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">{contractType === 'entreprise' ? 'Validation' : 'Santé'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contractant" className="space-y-4 mt-6">
          <div className="form-section">
            <h3 className="form-section-title">Informations du Contractant</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Code Client *</Label>
                <Input
                  placeholder="00001"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  readOnly
                  className="bg-muted font-mono"
                  required
                />
              </div>
              <div className="input-group">
                <Label className="input-label">N° Contrat (SCM) *</Label>
                <Input
                  placeholder="MSF25-XXXX-XXX-XXX/AMF"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  readOnly
                  className="bg-muted font-mono"
                  required
                />
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Raison Sociale *</Label>
                <Input
                  placeholder="Nom de l'entreprise ou organisation"
                  value={raisonSociale}
                  onChange={(e) => setRaisonSociale(e.target.value)}
                  required
                />
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Type de contrat *</Label>
                <Select value={contractType} onValueChange={(v) => setContractType(v as 'entreprise' | 'famille')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entreprise">Entreprise</SelectItem>
                    <SelectItem value="famille">Famille</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label className="input-label">Adresse</Label>
                <Input
                  placeholder="Adresse complète"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {contractType === 'famille' && (
        <TabsContent value="assure" className="space-y-4 mt-6">
          <div className="form-section">
            <h3 className="form-section-title">Informations de l'Assuré Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Nom *</Label>
                <Input
                  placeholder="Nom de famille"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Prénom *</Label>
                <Input
                  placeholder="Prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Sexe *</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as 'M' | 'F')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="input-group">
                <Label className="input-label">Nom de jeune fille</Label>
                <Input
                  placeholder="Nom de jeune fille"
                  value={maidenName}
                  onChange={(e) => setMaidenName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Date de naissance *</Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Lieu de naissance</Label>
                <Input
                  placeholder="Ville de naissance"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Téléphone mobile</Label>
                <Input
                  placeholder="+269 XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Email</Label>
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Emploi</Label>
                <Input
                  placeholder="Poste occupé"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Employeur</Label>
                <Input
                  placeholder="Nom de l'employeur"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Lieu de travail</Label>
                <Input
                  placeholder="Lieu de travail"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Date d'entrée à l'assurance</Label>
                <Input
                  type="date"
                  value={insuranceStartDate}
                  onChange={(e) => setInsuranceStartDate(e.target.value)}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Situation familiale</Label>
                <Select value={maritalStatus} onValueChange={setMaritalStatus}>
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
                <Input
                  placeholder="Adresse complète"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {maritalStatus === 'marie' && (
            <div className="form-section">
              <h3 className="form-section-title">Informations du Conjoint</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="input-group">
                  <Label className="input-label">Nom</Label>
                  <Input
                    placeholder="Nom du conjoint"
                    value={spouseLastName}
                    onChange={(e) => setSpouseLastName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Prénom</Label>
                  <Input
                    placeholder="Prénom du conjoint"
                    value={spouseFirstName}
                    onChange={(e) => setSpouseFirstName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Date de naissance</Label>
                  <Input
                    type="date"
                    value={spouseBirthDate}
                    onChange={(e) => setSpouseBirthDate(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Lieu de naissance</Label>
                  <Input
                    placeholder="Lieu de naissance"
                    value={spouseBirthPlace}
                    onChange={(e) => setSpouseBirthPlace(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        )}

        <TabsContent value="famille" className="space-y-4 mt-6">
          <div className="form-section">
            <h3 className="form-section-title">
              {contractType === 'entreprise' ? 'Employés à assurer' : 'Membres de la famille pris en charge'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {contractType === 'entreprise' 
                ? 'Ajoutez les employés de l\'entreprise à couvrir' 
                : 'Ajoutez les enfants et autres membres de la famille à couvrir'}
            </p>

            {familyMembers.map((member, index) => (
              <div key={index} className="p-4 border border-border rounded-lg mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-foreground">
                    {contractType === 'entreprise' ? `Employé ${index + 1}` : `Membre ${index + 1}`}
                  </h4>
                  {familyMembers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFamilyMember(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="input-group">
                    <Label className="input-label">Nom</Label>
                    <Input
                      placeholder="Nom"
                      value={member.last_name}
                      onChange={(e) => updateFamilyMember(index, 'last_name', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Prénom</Label>
                    <Input
                      placeholder="Prénom"
                      value={member.first_name}
                      onChange={(e) => updateFamilyMember(index, 'first_name', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Date de naissance</Label>
                    <Input
                      type="date"
                      value={member.birth_date}
                      onChange={(e) => updateFamilyMember(index, 'birth_date', e.target.value)}
                    />
                  </div>
                  {contractType === 'famille' && (
                    <div className="input-group">
                      <Label className="input-label">Parenté</Label>
                      <Select
                        value={member.relationship}
                        onValueChange={(v) => updateFamilyMember(index, 'relationship', v)}
                      >
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
                  )}
                  <div className="input-group">
                    <Label className="input-label">Sexe</Label>
                    <Select
                      value={member.gender}
                      onValueChange={(v) => updateFamilyMember(index, 'gender', v)}
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
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" className="w-full" onClick={addFamilyMember}>
              + Ajouter {contractType === 'entreprise' ? 'un employé' : 'un membre'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="sante" className="space-y-4 mt-6">
          {contractType === 'famille' && (
            <div className="form-section">
              <h3 className="form-section-title">Déclaration de Santé</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Veuillez répondre aux questions suivantes concernant votre état de santé
              </p>

              <div className="space-y-4">
                {healthDeclarations.map((declaration, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Checkbox
                      id={`q-${index}`}
                      className="mt-1"
                      checked={declaration.answer}
                      onCheckedChange={(checked) => {
                        const updated = [...healthDeclarations];
                        updated[index] = { ...updated[index], answer: !!checked };
                        setHealthDeclarations(updated);
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`q-${index}`} className="text-sm font-medium cursor-pointer">
                        {declaration.question}
                      </Label>
                      {declaration.answer && (
                        <Textarea
                          placeholder="Si oui, précisez..."
                          className="mt-2 h-20"
                          value={declaration.details}
                          onChange={(e) => {
                            const updated = [...healthDeclarations];
                            updated[index] = { ...updated[index], details: e.target.value };
                            setHealthDeclarations(updated);
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contractType === 'entreprise' && (
            <div className="form-section">
              <h3 className="form-section-title">Récapitulatif du contrat entreprise</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Entreprise :</span>
                  <span className="font-medium">{raisonSociale || '-'}</span>
                </div>
                <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">N° Contrat :</span>
                  <span className="font-medium font-mono">{contractNumber}</span>
                </div>
                <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Employés à assurer :</span>
                  <span className="font-medium">{familyMembers.filter(m => m.first_name && m.last_name).length}</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <h3 className="form-section-title">Engagement</h3>
            <div className="flex items-start gap-3">
              <Checkbox
                id="engagement"
                className="mt-1"
                checked={engagement}
                onCheckedChange={(checked) => setEngagement(!!checked)}
              />
              <Label htmlFor="engagement" className="text-sm text-muted-foreground cursor-pointer">
                {contractType === 'entreprise' 
                  ? "Je certifie que les informations fournies sont exactes et complètes. En tant que représentant de l'entreprise, je m'engage à respecter les conditions du contrat."
                  : "Je certifie que les informations fournies sont exactes et complètes. Je comprends qu'une fausse déclaration peut entraîner la nullité du contrat."
                }
              </Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between gap-3 pt-4 border-t border-border">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleGeneratePDF}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Télécharger la fiche
        </Button>
        <div className="flex gap-3">
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
              'Enregistrer la souscription'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
