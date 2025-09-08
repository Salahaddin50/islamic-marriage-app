-- Database Setup Script for Admin Panel
-- Run this script in Supabase SQL Editor to set up all required tables

-- Step 1: Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_picture TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Step 2: Create admin_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Step 3: Create admin_activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,
  target_table VARCHAR(100),
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create or update user_profiles table
DO $$ 
BEGIN
  -- Create user_profiles table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_id UUID UNIQUE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      email VARCHAR(255) UNIQUE,
      gender VARCHAR(50),
      age INT,
      bio TEXT,
      location VARCHAR(255),
      admin_approved BOOLEAN DEFAULT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;

  -- Add admin_approved column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'admin_approved'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN admin_approved BOOLEAN DEFAULT NULL;
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
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender ON user_profiles(gender);

-- Step 6: Add Row Level Security (RLS) policies
-- Enable RLS on tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_sessions_policy" ON admin_sessions;
DROP POLICY IF EXISTS "admin_activity_log_select_policy" ON admin_activity_log;
DROP POLICY IF EXISTS "admin_activity_log_insert_policy" ON admin_activity_log;

-- Create new policies
-- Allow anyone to insert (register) into admin_users, but they will be unapproved by default
CREATE POLICY "admin_users_insert_public" ON admin_users
  FOR INSERT WITH CHECK (TRUE);

-- Admins can select their own profile, super admins can select all
CREATE POLICY "admin_users_select_policy" ON admin_users
  FOR SELECT USING (
    id = auth.uid()::uuid OR
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::uuid AND is_super_admin = TRUE)
  );

-- Admins can update their own profile, super admins can update all
CREATE POLICY "admin_users_update_policy" ON admin_users
  FOR UPDATE USING (
    id = auth.uid()::uuid OR
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::uuid AND is_super_admin = TRUE)
  ) WITH CHECK (
    id = auth.uid()::uuid OR
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::uuid AND is_super_admin = TRUE)
  );

-- Admins can only see and manage their own sessions
CREATE POLICY "admin_sessions_policy" ON admin_sessions
  FOR ALL USING (admin_user_id = auth.uid()::uuid);

-- Admins can see their own activity, super admins can see all
CREATE POLICY "admin_activity_log_select_policy" ON admin_activity_log
  FOR SELECT USING (
    admin_user_id = auth.uid()::uuid OR
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::uuid AND is_super_admin = TRUE)
  );

-- Admins can insert their own activity logs
CREATE POLICY "admin_activity_log_insert_policy" ON admin_activity_log
  FOR INSERT WITH CHECK (admin_user_id = auth.uid()::uuid);

-- Step 7: Create first super admin user
-- This will create a super admin user that you can use to log in
-- You'll need to create this user in Supabase Auth first, then run this SQL
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
) ON CONFLICT (email) DO UPDATE SET
  is_super_admin = TRUE,
  is_approved = TRUE;

-- Step 8: Add sample data for testing
-- Only add sample data if user_profiles table is empty
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM user_profiles;
  
  IF profile_count = 0 THEN
    -- Add sample female profiles
    INSERT INTO user_profiles (first_name, last_name, email, gender, age, bio, location, admin_approved) VALUES
      ('Emma', 'Johnson', 'emma.j@example.com', 'female', 28, 'Passionate about art, travel, and meeting new people. Love hiking and outdoor adventures.', 'New York, NY', TRUE),
      ('Sophia', 'Williams', 'sophia.w@example.com', 'female', 24, 'Medical student with a passion for helping others. Enjoy reading and quiet evenings.', 'Boston, MA', TRUE),
      ('Olivia', 'Davis', 'olivia.d@example.com', 'female', 31, 'Tech entrepreneur and fitness enthusiast. Looking for someone who shares my passion for innovation.', 'San Francisco, CA', FALSE),
      ('Isabella', 'Martinez', 'isabella.m@example.com', 'female', 26, 'Chef and food blogger. Love to cook for others and explore new cuisines.', 'Chicago, IL', NULL),
      ('Ava', 'Thompson', 'ava.t@example.com', 'female', 29, 'Yoga instructor and wellness coach. Seeking balance in life and relationships.', 'Los Angeles, CA', NULL);

    -- Add sample male profiles
    INSERT INTO user_profiles (first_name, last_name, email, gender, age, bio, location, admin_approved) VALUES
      ('James', 'Smith', 'james.s@example.com', 'male', 32, 'Software engineer who loves hiking, photography, and trying new restaurants.', 'Seattle, WA', TRUE),
      ('Michael', 'Brown', 'michael.b@example.com', 'male', 29, 'Financial analyst by day, musician by night. Looking for someone to share adventures with.', 'Chicago, IL', TRUE),
      ('Robert', 'Garcia', 'robert.g@example.com', 'male', 34, 'Architect with a passion for sustainable design. Enjoy traveling and experiencing different cultures.', 'Austin, TX', NULL),
      ('David', 'Miller', 'david.m@example.com', 'male', 27, 'Marketing professional who loves sports, movies, and good conversation.', 'Denver, CO', NULL),
      ('William', 'Davis', 'william.d@example.com', 'male', 30, 'Doctor who enjoys cooking, running, and spending time outdoors.', 'Portland, OR', FALSE);
  END IF;
END $$;

-- Step 9: Show setup results
SELECT 'Admin setup completed!' as status;
SELECT 'Admin users:' as info;
SELECT id, email, first_name, last_name, is_super_admin, is_approved 
FROM admin_users;

SELECT 'Sample profiles:' as info;
SELECT COUNT(*) as female_profiles FROM user_profiles WHERE gender = 'female';
SELECT COUNT(*) as male_profiles FROM user_profiles WHERE gender = 'male';
SELECT COUNT(*) as pending_approval FROM user_profiles WHERE admin_approved IS NULL;

SELECT 'Next steps:' as info;
SELECT '1. Create a user in Supabase Auth with the same email as your admin user' as step1;
SELECT '2. Go to /admin.html to login' as step2;
SELECT '3. Manage profiles and approve/reject users' as step3;
