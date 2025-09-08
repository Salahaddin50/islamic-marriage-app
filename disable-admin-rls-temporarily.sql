-- Temporarily disable RLS on admin tables for testing
-- This will help us identify if RLS is causing the 500 errors

-- Disable RLS temporarily (ONLY for testing - re-enable after fixing)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_sessions_policy" ON admin_sessions;
DROP POLICY IF EXISTS "admin_activity_log_select_policy" ON admin_activity_log;
DROP POLICY IF EXISTS "admin_activity_log_insert_policy" ON admin_activity_log;

-- Check if there are any existing admin users
SELECT 'Existing admin users:' as info;
SELECT id, email, first_name, last_name, is_super_admin, is_approved, created_at 
FROM admin_users 
ORDER BY created_at DESC;

-- Check table structure
SELECT 'Admin users table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
ORDER BY ordinal_position;
