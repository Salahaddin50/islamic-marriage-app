-- Enable RLS and allow approved admins to manage admin_approved on user_profiles

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "user_profiles_select_admin" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_admin_approved" ON user_profiles;

-- Allow approved admins to SELECT all profiles
CREATE POLICY "user_profiles_select_admin" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.is_approved = TRUE
        AND LOWER(a.email) = LOWER((current_setting('request.jwt.claims', true)::jsonb ->> 'email'))
    )
  );

-- Allow approved admins to UPDATE the admin_approved column
CREATE POLICY "user_profiles_update_admin_approved" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.is_approved = TRUE
        AND LOWER(a.email) = LOWER((current_setting('request.jwt.claims', true)::jsonb ->> 'email'))
    )
  ) WITH CHECK (
    -- Restrict updates to only changing admin_approved (or allow broader if desired)
    TRUE
  );

-- Optional: You can further constrain the update to only admin_approved field via a trigger if needed.

SELECT 'user_profiles RLS policies applied' AS status;

