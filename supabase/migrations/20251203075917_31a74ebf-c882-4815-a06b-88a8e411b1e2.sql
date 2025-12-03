-- Create enum types for the application
CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'medecin', 'comptabilite', 'dirigeant');
CREATE TYPE public.subscription_status AS ENUM ('en_attente', 'validee', 'rejetee', 'reserve_medicale');
CREATE TYPE public.reimbursement_status AS ENUM ('soumis', 'verification', 'valide', 'paye', 'rejete');
CREATE TYPE public.care_status AS ENUM ('soumis', 'en_verification', 'valide', 'ferme', 'rejete');
CREATE TYPE public.marital_status AS ENUM ('marie', 'celibataire', 'veuf', 'divorce', 'separe');
CREATE TYPE public.gender AS ENUM ('M', 'F');
CREATE TYPE public.relationship_type AS ENUM ('conjoint', 'enfant', 'parent', 'autre');
CREATE TYPE public.document_type AS ENUM ('souscription', 'remboursement', 'prise_en_charge', 'quittance', 'justificatif', 'autre');
CREATE TYPE public.provider_type AS ENUM ('hopital', 'clinique', 'laboratoire', 'pharmacie', 'medecin', 'autre');
CREATE TYPE public.payment_status AS ENUM ('en_attente', 'paye', 'partiel', 'annule');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'agent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contracts table (entreprises/clients)
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  client_code TEXT NOT NULL UNIQUE,
  raison_sociale TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  status subscription_status NOT NULL DEFAULT 'en_attente',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Insured (assurés principaux)
CREATE TABLE public.insured (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  matricule TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  maiden_name TEXT,
  birth_date DATE NOT NULL,
  birth_place TEXT,
  gender gender NOT NULL DEFAULT 'M',
  marital_status marital_status NOT NULL DEFAULT 'celibataire',
  address TEXT,
  phone TEXT,
  email TEXT,
  employer TEXT,
  job_title TEXT,
  work_location TEXT,
  insurance_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  insurance_end_date DATE,
  photo_url TEXT,
  status subscription_status NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Beneficiaries (ayants-droits)
CREATE TABLE public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insured_id UUID REFERENCES public.insured(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_place TEXT,
  gender gender NOT NULL DEFAULT 'M',
  relationship relationship_type NOT NULL,
  phone TEXT,
  address TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Health declarations
CREATE TABLE public.health_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insured_id UUID REFERENCES public.insured(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer BOOLEAN NOT NULL DEFAULT false,
  details TEXT,
  declaration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Healthcare providers (prestataires)
CREATE TABLE public.healthcare_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type provider_type NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  convention_number TEXT,
  is_conventioned BOOLEAN NOT NULL DEFAULT false,
  tarifs JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contribution formulas (formules de cotisation)
CREATE TABLE public.contribution_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_rate DECIMAL(10,2) NOT NULL,
  family_rate DECIMAL(10,2),
  ceiling DECIMAL(12,2),
  options JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contributions (cotisations)
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  formula_id UUID REFERENCES public.contribution_formulas(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'en_attente',
  payment_date DATE,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Care authorizations (prises en charge)
CREATE TABLE public.care_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_number TEXT NOT NULL UNIQUE,
  insured_id UUID REFERENCES public.insured(id) ON DELETE CASCADE NOT NULL,
  beneficiary_id UUID REFERENCES public.beneficiaries(id),
  provider_id UUID REFERENCES public.healthcare_providers(id),
  care_type TEXT NOT NULL,
  care_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_amount DECIMAL(12,2) NOT NULL,
  approved_amount DECIMAL(12,2),
  ceiling_amount DECIMAL(12,2),
  status care_status NOT NULL DEFAULT 'soumis',
  doctor_name TEXT,
  diagnosis TEXT,
  notes TEXT,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reimbursements (remboursements)
CREATE TABLE public.reimbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reimbursement_number TEXT NOT NULL UNIQUE,
  insured_id UUID REFERENCES public.insured(id) ON DELETE CASCADE NOT NULL,
  beneficiary_id UUID REFERENCES public.beneficiaries(id),
  care_authorization_id UUID REFERENCES public.care_authorizations(id),
  provider_id UUID REFERENCES public.healthcare_providers(id),
  medical_date DATE NOT NULL,
  care_type TEXT NOT NULL,
  claimed_amount DECIMAL(12,2) NOT NULL,
  approved_amount DECIMAL(12,2),
  paid_amount DECIMAL(12,2),
  exclusions JSONB,
  status reimbursement_status NOT NULL DEFAULT 'soumis',
  doctor_name TEXT,
  paid_by TEXT,
  payment_reference TEXT,
  notes TEXT,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  related_type TEXT NOT NULL,
  related_id UUID NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Settings/Parameters
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insured ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Function to check if user has any role (is authenticated staff)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
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

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_staff(auth.uid()));

-- RLS Policies for main tables (staff access)
CREATE POLICY "Staff can view contracts" ON public.contracts
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage contracts" ON public.contracts
  FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view insured" ON public.insured
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage insured" ON public.insured
  FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view beneficiaries" ON public.beneficiaries
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage beneficiaries" ON public.beneficiaries
  FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view health declarations" ON public.health_declarations
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage health declarations" ON public.health_declarations
  FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view providers" ON public.healthcare_providers
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage providers" ON public.healthcare_providers
  FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view formulas" ON public.contribution_formulas
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage formulas" ON public.contribution_formulas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view contributions" ON public.contributions
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage contributions" ON public.contributions
  FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view care authorizations" ON public.care_authorizations
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage care authorizations" ON public.care_authorizations
  FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view reimbursements" ON public.reimbursements
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage reimbursements" ON public.reimbursements
  FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view documents" ON public.documents
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage documents" ON public.documents
  FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view settings" ON public.settings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insured_updated_at BEFORE UPDATE ON public.insured
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.healthcare_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formulas_updated_at BEFORE UPDATE ON public.contribution_formulas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_care_authorizations_updated_at BEFORE UPDATE ON public.care_authorizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reimbursements_updated_at BEFORE UPDATE ON public.reimbursements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_insured_contract ON public.insured(contract_id);
CREATE INDEX idx_insured_matricule ON public.insured(matricule);
CREATE INDEX idx_beneficiaries_insured ON public.beneficiaries(insured_id);
CREATE INDEX idx_contributions_contract ON public.contributions(contract_id);
CREATE INDEX idx_care_authorizations_insured ON public.care_authorizations(insured_id);
CREATE INDEX idx_reimbursements_insured ON public.reimbursements(insured_id);
CREATE INDEX idx_documents_related ON public.documents(related_type, related_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);