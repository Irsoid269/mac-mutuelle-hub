-- Table pour les barèmes de remboursement par type de soin
CREATE TABLE public.reimbursement_ceilings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_type TEXT NOT NULL UNIQUE,
  reimbursement_rate NUMERIC NOT NULL DEFAULT 80 CHECK (reimbursement_rate >= 0 AND reimbursement_rate <= 100),
  ceiling_amount NUMERIC NOT NULL DEFAULT 0 CHECK (ceiling_amount >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reimbursement_ceilings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Staff can view ceilings" ON public.reimbursement_ceilings
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage ceilings" ON public.reimbursement_ceilings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_reimbursement_ceilings_updated_at
  BEFORE UPDATE ON public.reimbursement_ceilings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default care types with example ceilings
INSERT INTO public.reimbursement_ceilings (care_type, reimbursement_rate, ceiling_amount, description) VALUES
  ('Consultation', 80, 15000, 'Consultations médicales générales'),
  ('Pharmacie', 70, 50000, 'Médicaments et produits pharmaceutiques'),
  ('Hospitalisation', 80, 500000, 'Frais d''hospitalisation'),
  ('Laboratoire', 80, 30000, 'Analyses et examens de laboratoire'),
  ('Radiologie', 80, 40000, 'Radiographies, échographies, scanners'),
  ('Optique', 60, 75000, 'Lunettes et verres correcteurs'),
  ('Dentaire', 70, 50000, 'Soins dentaires'),
  ('Maternité', 80, 200000, 'Frais liés à la maternité'),
  ('Autre', 70, 25000, 'Autres types de soins');