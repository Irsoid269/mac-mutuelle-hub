-- Add default reimbursement ceilings for care types
INSERT INTO public.reimbursement_ceilings (care_type, reimbursement_rate, ceiling_amount, description, is_active) VALUES
  ('Consultation', 80, 15000, 'Consultations médicales générales', true),
  ('Hospitalisation', 80, 500000, 'Frais d''hospitalisation', true),
  ('Pharmacie', 70, 50000, 'Médicaments et produits pharmaceutiques', true),
  ('Analyses', 80, 30000, 'Analyses et examens de laboratoire', true),
  ('Radiologie', 80, 40000, 'Radiographies, échographies, scanners', true),
  ('Autre', 60, 25000, 'Autres types de soins', true)
ON CONFLICT DO NOTHING;