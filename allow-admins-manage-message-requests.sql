-- Allow approved admins to manage message_requests (view, update, delete)
-- Run in Supabase SQL editor as owner

-- Helper: current JWT email (idempotent)
CREATE OR REPLACE FUNCTION public.current_jwt_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'email')::text, '')
$$;

ALTER TABLE IF EXISTS public.message_requests ENABLE ROW LEVEL SECURITY;

-- Admin SELECT policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='message_requests' AND policyname='Admins can view all message requests'
  ) THEN
    CREATE POLICY "Admins can view all message requests"
    ON public.message_requests
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

-- Admin UPDATE policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='message_requests' AND policyname='Admins can update message requests'
  ) THEN
    CREATE POLICY "Admins can update message requests"
    ON public.message_requests
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

-- Admin DELETE policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='message_requests' AND policyname='Admins can delete message requests'
  ) THEN
    CREATE POLICY "Admins can delete message requests"
    ON public.message_requests
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

-- Verify all policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname='public' AND tablename='message_requests'
ORDER BY policyname;
