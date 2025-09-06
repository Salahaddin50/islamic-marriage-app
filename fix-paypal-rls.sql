-- Fix PayPal RLS policies for payment_records table
-- Run this in Supabase SQL Editor

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS payment_records ENABLE ROW LEVEL SECURITY;

-- Drop the restrictive deny policies if they exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='payment_records' AND policyname='Deny direct inserts'
  ) THEN
    DROP POLICY "Deny direct inserts" ON public.payment_records;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='payment_records' AND policyname='Deny direct updates'
  ) THEN
    DROP POLICY "Deny direct updates" ON public.payment_records;
  END IF;
END $$;

-- Ensure SELECT policy exists (for the .select('id') after insert)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='payment_records' 
      AND policyname='Users can view own payment records'
  ) THEN
    CREATE POLICY "Users can view own payment records"
    ON public.payment_records
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to insert their own payment records
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='payment_records' 
      AND policyname='Users can insert own payment records'
  ) THEN
    CREATE POLICY "Users can insert own payment records"
    ON public.payment_records
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to update their own payment records
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='payment_records' 
      AND policyname='Users can update own payment records'
  ) THEN
    CREATE POLICY "Users can update own payment records"
    ON public.payment_records
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Verify policies are created
SELECT schemaname, tablename, policyname, cmd, permissive
FROM pg_policies 
WHERE schemaname='public' AND tablename='payment_records'
ORDER BY policyname;
