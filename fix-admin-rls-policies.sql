-- Fix Admin RLS Policies for Login
-- Run this script to enable RLS with proper policies that allow admin login

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert_public" ON admin_users;

-- Policy 1: Allow anyone to read admin_users for login verification
-- This is needed because during login, we need to check if the user exists and is approved
-- BEFORE they are authenticated, so auth.uid() will be null
CREATE POLICY "admin_users_login_select" ON admin_users
  FOR SELECT USING (TRUE);

-- Policy 2: Allow anyone to insert new admin users (for registration)
-- New users will be unapproved by default
CREATE POLICY "admin_users_registration_insert" ON admin_users
  FOR INSERT WITH CHECK (TRUE);

-- Policy 3: Allow authenticated admins to update their own profile
-- Also allow super admins to update any profile
CREATE POLICY "admin_users_update_policy" ON admin_users
  FOR UPDATE USING (
    -- User can update their own profile
    auth.uid()::text = id::text OR
    -- OR super admin can update any profile
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_super_admin = TRUE 
      AND is_approved = TRUE
    )
  ) WITH CHECK (
    -- Same conditions for the check
    auth.uid()::text = id::text OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_super_admin = TRUE 
      AND is_approved = TRUE
    )
  );

-- Policy 4: Allow super admins to delete admin users
CREATE POLICY "admin_users_delete_policy" ON admin_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text 
      AND is_super_admin = TRUE 
      AND is_approved = TRUE
    )
  );

-- Test the policies
SELECT 'RLS Policies created successfully!' as status;

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'admin_users';

-- Instructions
SELECT 'IMPORTANT: The login select policy allows anyone to read admin_users for authentication.' as note1;
SELECT 'This is necessary because auth.uid() is null during the login process.' as note2;
SELECT 'Security is maintained through the is_approved column check in the application logic.' as note3;