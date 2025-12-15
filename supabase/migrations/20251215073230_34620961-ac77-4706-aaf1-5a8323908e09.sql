-- Create contribution_payments table to track payment history
CREATE TABLE public.contribution_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contribution_id UUID NOT NULL REFERENCES public.contributions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contribution_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can view payment history"
  ON public.contribution_payments
  FOR SELECT
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff can manage payment history"
  ON public.contribution_payments
  FOR ALL
  USING (is_staff(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_contribution_payments_contribution_id ON public.contribution_payments(contribution_id);

-- Add comment
COMMENT ON TABLE public.contribution_payments IS 'Historique des paiements pour les cotisations';