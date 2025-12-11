-- Mettre à jour les contrats avec des cotisations payées
UPDATE contracts 
SET status = 'validee' 
WHERE id IN (
  SELECT DISTINCT contract_id FROM contributions WHERE payment_status = 'paye'
);

-- Mettre à jour les assurés liés aux contrats avec des cotisations payées
UPDATE insured 
SET status = 'validee' 
WHERE contract_id IN (
  SELECT DISTINCT contract_id FROM contributions WHERE payment_status = 'paye'
);