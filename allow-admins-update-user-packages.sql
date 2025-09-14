-- Allow approved admins to read and update user_packages from admin UI

ALTER TABLE IF EXISTS public.user_packages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_jwt_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'email')::text, '')
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_packages' AND policyname='Admins can read all user_packages'
  ) THEN
    CREATE POLICY "Admins can read all user_packages"
    ON public.user_packages
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

-- Ensure authenticated role has delete privileges (and other basic DML)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_packages TO authenticated;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_packages' AND policyname='Admins can update user_packages'
  ) THEN
    CREATE POLICY "Admins can update user_packages"
    ON public.user_packages
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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_packages' AND policyname='Admins can delete user_packages'
  ) THEN
    CREATE POLICY "Admins can delete user_packages"
    ON public.user_packages
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


