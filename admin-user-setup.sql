-- Admin User Setup Script
-- Run this script in Supabase SQL Editor to create an admin user

-- First, check if admin_users table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    -- Create admin_users table if it doesn't exist
    CREATE TABLE admin_users (
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

    -- Create indexes for better performance
    CREATE INDEX idx_admin_users_email ON admin_users(email);
    CREATE INDEX idx_admin_users_approved ON admin_users(is_approved);
  END IF;
END $$;

-- Create or update the admin user
-- Replace 'your-email@example.com' with the email you used to create a user in Supabase Auth
INSERT INTO admin_users (
  email, 
  first_name, 
  last_name, 
  is_super_admin, 
  is_approved
) VALUES (
  'your-email@example.com', -- CHANGE THIS to your email
  'Super', 
  'Admin', 
  TRUE, 
  TRUE
) ON CONFLICT (email) DO UPDATE SET
  is_super_admin = TRUE,
  is_approved = TRUE;

-- Disable RLS temporarily if needed
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Show the created admin user
SELECT * FROM admin_users;

-- Instructions for next steps:
SELECT 'IMPORTANT: Create a user with the same email in Supabase Authentication' as next_step;
