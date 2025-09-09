-- Allow approved admins to read all rows from payment_records
-- Run in Supabase SQL editor as owner

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.payment_records ENABLE ROW LEVEL SECURITY;

-- Helper: get JWT email safely
CREATE OR REPLACE FUNCTION public.current_jwt_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'email')::text, '')
$$;

-- Policy: approved admins can SELECT all payment_records
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='payment_records' AND policyname='Admins can view all payment records'
  ) THEN
    CREATE POLICY "Admins can view all payment records"
    ON public.payment_records
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 
        FROM public.admin_users au
        WHERE au.is_approved = true
          AND (
            au.id = auth.uid() OR (
              public.current_jwt_email() IS NOT NULL AND LOWER(au.email) = LOWER(public.current_jwt_email())
            )
          )
      )
    );
  END IF;
END $$;

-- Optional: verify
SELECT schemaname, tablename, policyname, cmd, permissive
FROM pg_policies 
WHERE schemaname='public' AND tablename='payment_records'
ORDER BY policyname;


