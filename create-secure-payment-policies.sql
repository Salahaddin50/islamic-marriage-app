-- Harden RLS for payment_records to prevent client-side tampering

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS payment_records ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies if they exist (idempotent guards)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_records' AND policyname='Users can insert own payment records'
  ) THEN
    DROP POLICY "Users can insert own payment records" ON payment_records;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_records' AND policyname='Users can update own payment records'
  ) THEN
    DROP POLICY "Users can update own payment records" ON payment_records;
  END IF;
END $$;

-- Read policy remains: users can view their own records
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_records' AND policyname='Users can view own payment records (secure)'
  ) THEN
    CREATE POLICY "Users can view own payment records (secure)" ON payment_records
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Insert; only allow service role (bypass RLS) or a secured RPC to insert
-- We implement this by denying general inserts and expecting service key to be used
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_records' AND policyname='Deny direct inserts'
  ) THEN
    CREATE POLICY "Deny direct inserts" ON payment_records FOR INSERT WITH CHECK (false);
  END IF;
END $$;

-- Update; similarly deny direct updates by clients
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_records' AND policyname='Deny direct updates'
  ) THEN
    CREATE POLICY "Deny direct updates" ON payment_records FOR UPDATE USING (false) WITH CHECK (false);
  END IF;
END $$;


