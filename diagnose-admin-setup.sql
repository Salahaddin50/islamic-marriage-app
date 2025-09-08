-- Diagnostic script to check admin setup issues

-- Check if admin_users table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') 
    THEN 'admin_users table EXISTS' 
    ELSE 'admin_users table DOES NOT EXIST' 
  END as table_status;

-- If table exists, show its structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    RAISE NOTICE 'Admin users table structure:';
  END IF;
END $$;

SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN 'RLS is ENABLED' ELSE 'RLS is DISABLED' END as rls_status
FROM pg_tables 
WHERE tablename = 'admin_users';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'admin_users';

-- Check if there are any admin users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    RAISE NOTICE 'Existing admin users:';
  END IF;
END $$;

SELECT id, email, first_name, last_name, is_super_admin, is_approved, created_at 
FROM admin_users 
ORDER BY created_at DESC
LIMIT 10;
