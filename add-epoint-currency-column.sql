-- Add column to store Epoint currency ratio (AZN per 1 USD)
ALTER TABLE IF EXISTS public.packages
  ADD COLUMN IF NOT EXISTS epoint_currency NUMERIC(10,4) DEFAULT 1.7000;

-- Optional: backfill existing rows with a sensible default
UPDATE public.packages SET epoint_currency = COALESCE(epoint_currency, 1.7000);

-- Ensure read access for client (already granted for packages, keep for completeness)
GRANT SELECT (epoint_currency) ON public.packages TO anon, authenticated;


