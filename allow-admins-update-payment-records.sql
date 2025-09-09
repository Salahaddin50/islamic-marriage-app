-- Allow approved admins to UPDATE payment_records (status, package_type, etc.)
-- Run in Supabase SQL editor as owner

ALTER TABLE IF EXISTS public.payment_records ENABLE ROW LEVEL SECURITY;

-- Helper is expected to exist; create if missing
CREATE OR REPLACE FUNCTION public.current_jwt_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'email')::text, '')
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_records' AND policyname='Admins can update all payment records'
  ) THEN
    CREATE POLICY "Admins can update all payment records"
    ON public.payment_records
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.is_approved = true
          AND (
            au.id = auth.uid() OR (
              public.current_jwt_email() IS NOT NULL AND LOWER(au.email) = LOWER(public.current_jwt_email())
            )
          )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.admin_users au
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

-- Verify
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname='public' AND tablename='payment_records'
ORDER BY policyname;


