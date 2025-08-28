-- ============================================================================
-- FIX MEDIA REFERENCES USER RELATIONSHIP
-- ============================================================================
-- This script fixes the foreign key relationship between media_references and user_profiles
-- 
-- PROBLEM: 
--   - user_profiles.user_id references auth.users(id)
--   - media_references.user_id references users(id) 
--   - These are different tables causing the mismatch!
--
-- SOLUTION: Update media_references to reference auth.users(id) like user_profiles

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE media_references 
DROP CONSTRAINT IF EXISTS fk_media_user;

-- Step 2: Add the correct foreign key constraint to users table (not auth.users)
ALTER TABLE media_references 
ADD CONSTRAINT fk_media_user_auth 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Update RLS policies to use auth.uid() correctly
DROP POLICY IF EXISTS "Users can view their own media" ON media_references;
DROP POLICY IF EXISTS "Users can insert their own media" ON media_references;
DROP POLICY IF EXISTS "Users can update their own media" ON media_references;
DROP POLICY IF EXISTS "Users can delete their own media" ON media_references;

-- Create new RLS policies that work with auth.users
CREATE POLICY "Users can view their own media" ON media_references
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own media" ON media_references
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own media" ON media_references
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own media" ON media_references
    FOR DELETE USING (user_id = auth.uid());

-- Step 4: If you need to migrate existing data, you would need to map
-- the old user IDs to the correct auth.users IDs
-- This requires knowing the relationship between the old users table and auth.users

-- Step 5: Verify the fix
-- This query should now work to find media for a user profile:
/*
SELECT 
    up.user_id as profile_user_id,
    up.first_name,
    up.last_name,
    mr.id as media_id,
    mr.media_type,
    mr.external_url
FROM user_profiles up
LEFT JOIN media_references mr ON up.user_id = mr.user_id
WHERE up.user_id = 'your-user-id-here';
*/

-- Step 6: Create a view to make querying easier
CREATE OR REPLACE VIEW user_media_view AS
SELECT 
    up.user_id,
    up.first_name,
    up.last_name,
    up.profile_picture_url,
    mr.id as media_id,
    mr.media_type,
    mr.external_url,
    mr.thumbnail_url,
    mr.is_profile_picture,
    mr.media_order,
    mr.visibility_level,
    mr.created_at as media_created_at
FROM user_profiles up
LEFT JOIN media_references mr ON up.user_id = mr.user_id
WHERE mr.media_type IN ('photo', 'video')
ORDER BY up.user_id, mr.is_profile_picture DESC, mr.media_order;

-- Grant access to the view
GRANT SELECT ON user_media_view TO authenticated;

COMMENT ON TABLE media_references IS 'Media references now correctly linked to auth.users like user_profiles';
COMMENT ON VIEW user_media_view IS 'Convenient view to get user profiles with their media';
