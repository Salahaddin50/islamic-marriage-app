-- alternative-fix.sql
-- This script provides an alternative approach if adding a unique constraint is not possible

-- First, drop the existing foreign key constraint
ALTER TABLE media_references 
DROP CONSTRAINT IF EXISTS media_references_user_id_fkey;

-- Also try with the actual constraint name from the error message
ALTER TABLE media_references 
DROP CONSTRAINT IF EXISTS fk_media_user;

-- Option 1: Simply remove the foreign key constraint entirely
-- This will allow any value in user_id without validation
-- Comment out if you prefer Option 2

-- Option 2: Create a view to join user_profiles and media_references
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

-- Grant appropriate permissions
GRANT SELECT ON user_media_view TO authenticated;
GRANT SELECT ON user_media_view TO service_role;
