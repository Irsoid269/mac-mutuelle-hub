-- Create enum for contract types
CREATE TYPE public.contract_type AS ENUM ('entreprise', 'famille');

-- Add contract_type column to contracts table
ALTER TABLE public.contracts 
ADD COLUMN contract_type public.contract_type NOT NULL DEFAULT 'entreprise';