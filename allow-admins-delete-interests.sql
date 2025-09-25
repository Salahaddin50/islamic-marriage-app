-- Allow approved admins to delete interests
-- Run in Supabase SQL editor as owner

-- Helper: current JWT email (idempotent)
CREATE OR REPLACE FUNCTION public.current_jwt_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'email')::text, '')
$$;

ALTER TABLE IF EXISTS public.interests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interests' AND policyname='Admins can delete interests'
  ) THEN
    CREATE POLICY "Admins can delete interests"
    ON public.interests
    FOR DELETE
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
    );
  END IF;
END $$;

-- Verify
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname='public' AND tablename='interests' AND policyname='Admins can delete interests'
ORDER BY policyname;
