-- Simple admin tables creation script
-- This creates the minimum required tables for admin functionality

-- Step 1: Create admin_users table (simple version)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_picture TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Step 2: Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Step 3: Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_table VARCHAR(100),
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Add admin_approved column to user_profiles if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'admin_approved'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN admin_approved BOOLEAN DEFAULT NULL;
    
    COMMENT ON COLUMN user_profiles.admin_approved IS 'Admin approval status: NULL = pending review, TRUE = approved, FALSE = rejected';
  END IF;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_approved ON admin_users(is_approved);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_user ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin_approved ON user_profiles(admin_approved);

-- Step 6: Disable RLS for now (we'll add proper policies later)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log DISABLE ROW LEVEL SECURITY;

-- Step 7: Insert first super admin (you can change this email)
INSERT INTO admin_users (
  email, 
  first_name, 
  last_name, 
  is_super_admin, 
  is_approved
) VALUES (
  'admin@example.com', -- Change this to your email
  'Super', 
  'Admin', 
  TRUE, 
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- Step 8: Show what was created
SELECT 'Admin setup completed!' as status;
SELECT 'Admin users table:' as info;
SELECT id, email, first_name, last_name, is_super_admin, is_approved 
FROM admin_users;

SELECT 'You can now:' as next_steps;
SELECT '1. Go to /nimda/login' as step1;
SELECT '2. Register with your email' as step2;
SELECT '3. Run: UPDATE admin_users SET is_super_admin = TRUE, is_approved = TRUE WHERE email = ''your-email@example.com'';' as step3;
