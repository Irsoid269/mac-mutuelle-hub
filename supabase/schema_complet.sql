-- ============================================
-- MAC ASSURANCE - Schéma complet de base de données
-- Script d'installation pour Supabase Self-Hosted
-- ============================================

-- ============================================
-- 1. TYPES ÉNUMÉRÉS
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'medecin', 'comptabilite', 'dirigeant');
CREATE TYPE public.care_status AS ENUM ('soumis', 'en_verification', 'valide', 'ferme', 'rejete');
CREATE TYPE public.document_type AS ENUM ('souscription', 'remboursement', 'prise_en_charge', 'quittance', 'justificatif', 'autre');
CREATE TYPE public.gender AS ENUM ('M', 'F');
CREATE TYPE public.marital_status AS ENUM ('marie', 'celibataire', 'veuf', 'divorce', 'separe');
CREATE TYPE public.payment_status AS ENUM ('en_attente', 'paye', 'partiel', 'annule');
CREATE TYPE public.provider_type AS ENUM ('hopital', 'clinique', 'laboratoire', 'pharmacie', 'medecin', 'autre');
CREATE TYPE public.reimbursement_status AS ENUM ('soumis', 'verification', 'valide', 'paye', 'rejete');
CREATE TYPE public.relationship_type AS ENUM ('conjoint', 'enfant', 'parent', 'autre');
CREATE TYPE public.subscription_status AS ENUM ('en_attente', 'validee', 'rejetee', 'reserve_medicale');

-- ============================================
-- 2. TABLES PRINCIPALES
-- ============================================

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des rôles utilisateurs
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'agent',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des contrats
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number text NOT NULL UNIQUE,
  client_code text NOT NULL UNIQUE,
  raison_sociale text NOT NULL,
  address text,
  phone text,
  email text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status public.subscription_status NOT NULL DEFAULT 'en_attente',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des assurés
CREATE TABLE public.insured (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  matricule text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  maiden_name text,
  gender public.gender NOT NULL DEFAULT 'M',
  birth_date date NOT NULL,
  birth_place text,
  marital_status public.marital_status NOT NULL DEFAULT 'celibataire',
  address text,
  phone text,
  email text,
  employer text,
  job_title text,
  work_location text,
  photo_url text,
  insurance_start_date date NOT NULL DEFAULT CURRENT_DATE,
  insurance_end_date date,
  status public.subscription_status NOT NULL DEFAULT 'en_attente',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des bénéficiaires (ayants droit)
CREATE TABLE public.beneficiaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insured_id uuid NOT NULL REFERENCES public.insured(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender public.gender NOT NULL DEFAULT 'M',
  birth_date date NOT NULL,
  birth_place text,
  relationship public.relationship_type NOT NULL,
  phone text,
  address text,
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des prestataires de santé
CREATE TABLE public.healthcare_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  provider_type public.provider_type NOT NULL,
  is_conventioned boolean NOT NULL DEFAULT false,
  convention_number text,
  address text,
  city text,
  phone text,
  email text,
  tarifs jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des formules de cotisation
CREATE TABLE public.contribution_formulas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  base_rate numeric NOT NULL,
  family_rate numeric,
  ceiling numeric,
  options jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des cotisations
CREATE TABLE public.contributions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  formula_id uuid REFERENCES public.contribution_formulas(id),
  amount numeric NOT NULL,
  paid_amount numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'en_attente',
  payment_date date,
  payment_reference text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des paiements de cotisation
CREATE TABLE public.contribution_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contribution_id uuid NOT NULL REFERENCES public.contributions(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date timestamp with time zone NOT NULL DEFAULT now(),
  payment_reference text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des plafonds de remboursement
CREATE TABLE public.reimbursement_ceilings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_type text NOT NULL,
  ceiling_amount numeric NOT NULL DEFAULT 0,
  reimbursement_rate numeric NOT NULL DEFAULT 80,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des autorisations de prise en charge
CREATE TABLE public.care_authorizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  authorization_number text NOT NULL UNIQUE,
  insured_id uuid NOT NULL REFERENCES public.insured(id) ON DELETE CASCADE,
  beneficiary_id uuid REFERENCES public.beneficiaries(id),
  provider_id uuid REFERENCES public.healthcare_providers(id),
  care_type text NOT NULL,
  care_date date NOT NULL DEFAULT CURRENT_DATE,
  diagnosis text,
  doctor_name text,
  estimated_amount numeric NOT NULL,
  approved_amount numeric,
  ceiling_amount numeric,
  status public.care_status NOT NULL DEFAULT 'soumis',
  validated_by uuid,
  validated_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des remboursements
CREATE TABLE public.reimbursements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reimbursement_number text NOT NULL UNIQUE,
  insured_id uuid NOT NULL REFERENCES public.insured(id) ON DELETE CASCADE,
  beneficiary_id uuid REFERENCES public.beneficiaries(id),
  care_authorization_id uuid REFERENCES public.care_authorizations(id),
  provider_id uuid REFERENCES public.healthcare_providers(id),
  care_type text NOT NULL,
  medical_date date NOT NULL,
  doctor_name text,
  claimed_amount numeric NOT NULL,
  approved_amount numeric,
  paid_amount numeric,
  exclusions jsonb,
  status public.reimbursement_status NOT NULL DEFAULT 'soumis',
  validated_by uuid,
  validated_at timestamp with time zone,
  paid_by text,
  paid_at timestamp with time zone,
  payment_reference text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des déclarations de santé
CREATE TABLE public.health_declarations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insured_id uuid NOT NULL REFERENCES public.insured(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer boolean NOT NULL DEFAULT false,
  details text,
  declaration_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des documents
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  document_type public.document_type NOT NULL,
  file_url text NOT NULL,
  mime_type text,
  file_size integer,
  related_type text NOT NULL,
  related_id uuid NOT NULL,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des logs d'audit
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  user_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  details text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des paramètres
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================
-- 3. FONCTIONS
-- ============================================

-- Fonction pour vérifier si un utilisateur a un rôle
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fonction pour vérifier si un utilisateur est staff
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fonction pour créer un profil après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insured_updated_at BEFORE UPDATE ON public.insured FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_beneficiaries_updated_at BEFORE UPDATE ON public.beneficiaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_healthcare_providers_updated_at BEFORE UPDATE ON public.healthcare_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contribution_formulas_updated_at BEFORE UPDATE ON public.contribution_formulas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reimbursement_ceilings_updated_at BEFORE UPDATE ON public.reimbursement_ceilings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_care_authorizations_updated_at BEFORE UPDATE ON public.care_authorizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reimbursements_updated_at BEFORE UPDATE ON public.reimbursements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour créer un profil lors de l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insured ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_ceilings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (is_staff(auth.uid()));

-- Policies pour user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies pour contracts
CREATE POLICY "Staff can view contracts" ON public.contracts FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage contracts" ON public.contracts FOR ALL USING (is_staff(auth.uid()));

-- Policies pour insured
CREATE POLICY "Staff can view insured" ON public.insured FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage insured" ON public.insured FOR ALL USING (is_staff(auth.uid()));

-- Policies pour beneficiaries
CREATE POLICY "Staff can view beneficiaries" ON public.beneficiaries FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage beneficiaries" ON public.beneficiaries FOR ALL USING (is_staff(auth.uid()));

-- Policies pour healthcare_providers
CREATE POLICY "Staff can view providers" ON public.healthcare_providers FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage providers" ON public.healthcare_providers FOR ALL USING (is_staff(auth.uid()));

-- Policies pour contribution_formulas
CREATE POLICY "Staff can view formulas" ON public.contribution_formulas FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage formulas" ON public.contribution_formulas FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies pour contributions
CREATE POLICY "Staff can view contributions" ON public.contributions FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage contributions" ON public.contributions FOR ALL USING (is_staff(auth.uid()));

-- Policies pour contribution_payments
CREATE POLICY "Staff can view payment history" ON public.contribution_payments FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage payment history" ON public.contribution_payments FOR ALL USING (is_staff(auth.uid()));

-- Policies pour reimbursement_ceilings
CREATE POLICY "Staff can view ceilings" ON public.reimbursement_ceilings FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage ceilings" ON public.reimbursement_ceilings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies pour care_authorizations
CREATE POLICY "Staff can view care authorizations" ON public.care_authorizations FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage care authorizations" ON public.care_authorizations FOR ALL USING (is_staff(auth.uid()));

-- Policies pour reimbursements
CREATE POLICY "Staff can view reimbursements" ON public.reimbursements FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage reimbursements" ON public.reimbursements FOR ALL USING (is_staff(auth.uid()));

-- Policies pour health_declarations
CREATE POLICY "Staff can view health declarations" ON public.health_declarations FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage health declarations" ON public.health_declarations FOR ALL USING (is_staff(auth.uid()));

-- Policies pour documents
CREATE POLICY "Staff can view documents" ON public.documents FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage documents" ON public.documents FOR ALL USING (is_staff(auth.uid()));

-- Policies pour audit_logs
CREATE POLICY "Staff can view audit logs" ON public.audit_logs FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Policies pour settings
CREATE POLICY "Admins can view settings" ON public.settings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 6. STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('reimbursement-documents', 'reimbursement-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policies pour le bucket
CREATE POLICY "Staff can upload documents" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'reimbursement-documents');

CREATE POLICY "Anyone can view documents" ON storage.objects 
FOR SELECT USING (bucket_id = 'reimbursement-documents');

CREATE POLICY "Staff can delete documents" ON storage.objects 
FOR DELETE USING (bucket_id = 'reimbursement-documents');

-- ============================================
-- FIN DU SCRIPT
-- ============================================
