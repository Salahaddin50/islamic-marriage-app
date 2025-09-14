-- Allow approved admins to UPDATE the packages table from the browser
-- Run this in Supabase SQL editor as the project owner.

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.packages ENABLE ROW LEVEL SECURITY;

-- Helper to get current JWT email (idempotent - reused by other scripts)
CREATE OR REPLACE FUNCTION public.current_jwt_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'email')::text, '')
$$;

-- Policy: Approved admins can SELECT all packages (for the admin UI)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='packages' AND policyname='Admins can read all packages'
  ) THEN
    CREATE POLICY "Admins can read all packages"
    ON public.packages
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

-- Policy: Approved admins can UPDATE packages (name is managed elsewhere; UI only edits price & epoint_currency)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='packages' AND policyname='Admins can update packages'
  ) THEN
    CREATE POLICY "Admins can update packages"
    ON public.packages
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

-- Optional: Keep existing public view policy for active packages (frontend usage)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='packages' AND policyname='Anyone can view active packages'
  ) THEN
    CREATE POLICY "Anyone can view active packages" ON packages
      FOR SELECT USING (is_active = true);
  END IF;
END $$;


