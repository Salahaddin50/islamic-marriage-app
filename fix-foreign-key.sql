-- fix-foreign-key.sql
-- This script removes the foreign key constraint that's causing the error

-- First, drop the existing foreign key constraint
ALTER TABLE media_references 
DROP CONSTRAINT IF EXISTS media_references_user_id_fkey;

-- Add a unique constraint to user_profiles.user_id first (required for foreign key)
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- Now add a new constraint that references user_profiles instead of users
ALTER TABLE media_references 
ADD CONSTRAINT media_references_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Confirm the changes
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS referenced_table,
  af.attname AS referenced_column,
  confupdtype,
  confdeltype
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE contype = 'f' AND conrelid = 'media_references'::regclass;
