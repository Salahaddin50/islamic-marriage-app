-- Allow approved admins to read interests and meet_requests
-- Run in Supabase SQL editor as owner

-- Helper: current JWT email
CREATE OR REPLACE FUNCTION public.current_jwt_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'email')::text, '')
$$;

-- Interests
ALTER TABLE IF EXISTS public.interests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interests' AND policyname='Admins can view all interests'
  ) THEN
    CREATE POLICY "Admins can view all interests"
    ON public.interests
    FOR SELECT
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

-- Meet Requests
ALTER TABLE IF EXISTS public.meet_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='meet_requests' AND policyname='Admins can view all meet requests'
  ) THEN
    CREATE POLICY "Admins can view all meet requests"
    ON public.meet_requests
    FOR SELECT
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
WHERE schemaname='public' AND tablename IN ('interests','meet_requests')
ORDER BY tablename, policyname;


