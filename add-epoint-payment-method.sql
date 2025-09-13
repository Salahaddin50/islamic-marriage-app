-- Add 'epoint' to payment_method enum if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'payment_method' AND e.enumlabel = 'epoint'
  ) THEN
    ALTER TYPE payment_method ADD VALUE 'epoint';
  END IF;
END $$;


