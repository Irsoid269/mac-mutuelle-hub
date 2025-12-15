-- Mettre à jour les remboursements payés qui n'ont pas de paid_amount
UPDATE public.reimbursements 
SET paid_amount = COALESCE(approved_amount, claimed_amount),
    paid_at = COALESCE(paid_at, now())
WHERE status = 'paye' AND paid_amount IS NULL;