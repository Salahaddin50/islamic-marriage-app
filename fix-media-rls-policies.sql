-- Enable RLS and give approved admins access to ALL media

-- 1) Ensure RLS is enabled on media_references
ALTER TABLE media_references ENABLE ROW LEVEL SECURITY;

-- 2) Drop existing media policies (idempotent)
DROP POLICY IF EXISTS "media_references_select_own" ON media_references;
DROP POLICY IF EXISTS "media_references_insert_own" ON media_references;
DROP POLICY IF EXISTS "media_references_update_own" ON media_references;
DROP POLICY IF EXISTS "media_references_delete_own" ON media_references;
DROP POLICY IF EXISTS "media_references_select_admin" ON media_references;
DROP POLICY IF EXISTS "media_references_update_admin" ON media_references;
DROP POLICY IF EXISTS "media_references_delete_admin" ON media_references;

-- 3) Helper expression to extract email from JWT
--    Supabase exposes JWT in request GUC. We use LOWER() to avoid case mismatches
--    (current_setting('request.jwt.claims', true)::jsonb ->> 'email') gives the auth user's email

-- 4) Allow users to manage (select/update/delete) their OWN media
--    (keeps existing app behavior working for regular users)
CREATE POLICY "media_references_select_own" ON media_references
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "media_references_update_own" ON media_references
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "media_references_delete_own" ON media_references
  FOR DELETE USING (user_id = auth.uid());

-- 5) Give APPROVED admins read access to ALL media
CREATE POLICY "media_references_select_admin" ON media_references
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.is_approved = TRUE
        AND LOWER(a.email) = LOWER( (current_setting('request.jwt.claims', true)::jsonb ->> 'email') )
    )
  );

-- 6) Give SUPER ADMINS update/delete on ALL media
CREATE POLICY "media_references_update_admin" ON media_references
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.is_approved = TRUE
        AND a.is_super_admin = TRUE
        AND LOWER(a.email) = LOWER( (current_setting('request.jwt.claims', true)::jsonb ->> 'email') )
    )
  );

CREATE POLICY "media_references_delete_admin" ON media_references
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.is_approved = TRUE
        AND a.is_super_admin = TRUE
        AND LOWER(a.email) = LOWER( (current_setting('request.jwt.claims', true)::jsonb ->> 'email') )
    )
  );

-- 7) Optional: Allow inserts by the authenticated owner as before (if your app needs it)
DROP POLICY IF EXISTS "media_references_insert_own" ON media_references;
CREATE POLICY "media_references_insert_own" ON media_references
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8) Grant usage (usually already present) – shown here for clarity
GRANT SELECT, INSERT, UPDATE, DELETE ON media_references TO authenticated;

-- 9) Notes
-- - Admin access is determined by matching the auth user's email (from JWT) to admin_users.email
-- - Admin must be is_approved = TRUE to read; is_super_admin = TRUE to update/delete any media
-- - Regular users keep ownership-based access via user_id = auth.uid()

-- Verify
SELECT 'Media RLS policies applied' AS status;

