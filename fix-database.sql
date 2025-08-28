-- fix-database.sql
-- This script fixes the foreign key constraint issue by examining the database structure first

-- 1. First, let's check what constraints exist on the media_references table
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
WHERE conrelid = 'media_references'::regclass AND contype = 'f';

-- 2. Drop the problematic constraint
ALTER TABLE media_references 
DROP CONSTRAINT IF EXISTS fk_media_user;

-- 3. Let's see what tables we're working with
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. Check the structure of users and user_profiles tables
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND table_schema = 'public';

-- 5. Check if there's a relationship between users and user_profiles
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
WHERE conrelid = 'user_profiles'::regclass AND contype = 'f';

-- 6. Create a view for easier querying (optional)
CREATE OR REPLACE VIEW user_media_view AS
SELECT 
  m.id AS media_id,
  m.user_id,
  m.media_type,
  m.external_url,
  m.thumbnail_url,
  m.is_profile_picture,
  m.visibility_level,
  p.first_name,
  p.last_name,
  p.profile_picture_url
FROM media_references m
LEFT JOIN user_profiles p ON m.user_id = p.user_id;

-- Grant permissions
GRANT SELECT ON user_media_view TO authenticated;
GRANT SELECT ON user_media_view TO service_role;
