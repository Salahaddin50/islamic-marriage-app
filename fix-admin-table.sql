-- Fix existing admin_users table to remove Google OAuth dependencies
-- Run this BEFORE running the main migration if you have an existing admin_users table

DO $$ BEGIN
  -- Check if admin_users table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    
    -- Drop the google_id column if it exists (this will remove the NOT NULL constraint)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'google_id'
    ) THEN
      ALTER TABLE admin_users DROP COLUMN google_id CASCADE;
      RAISE NOTICE 'Dropped google_id column from admin_users table';
    END IF;
    
    -- Ensure required columns exist with proper defaults
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'first_name'
    ) THEN
      ALTER TABLE admin_users ADD COLUMN first_name VARCHAR(100) NOT NULL DEFAULT 'Admin';
      RAISE NOTICE 'Added first_name column to admin_users table';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'last_name'
    ) THEN
      ALTER TABLE admin_users ADD COLUMN last_name VARCHAR(100) NOT NULL DEFAULT 'User';
      RAISE NOTICE 'Added last_name column to admin_users table';
    END IF;
    
    -- Update any existing records that might have NULL names
    UPDATE admin_users 
    SET 
      first_name = COALESCE(first_name, 'Admin'),
      last_name = COALESCE(last_name, 'User')
    WHERE first_name IS NULL OR last_name IS NULL;
    
    RAISE NOTICE 'Admin users table has been updated for email authentication';
    
  ELSE
    RAISE NOTICE 'Admin users table does not exist yet - will be created by main migration';
  END IF;
END $$;
