-- ============================================================================
-- FIX USER MEDIA MAPPING
-- ============================================================================
-- This script maps the orphaned media to existing user profiles

-- Based on the data analysis:
-- - Media exists for user IDs that have no profiles
-- - Profiles exist for user IDs that have no media
-- - We need to map them together

-- Step 1: Create a mapping for demonstration purposes
-- Map the media users to profile users (you may need to adjust this mapping)

-- Map media user 1 (7 media items) to profile user Rasim Mammadov
UPDATE media_references 
SET user_id = '50562e9f-f92a-47e8-b096-549f63a6a5d4'  -- Rasim Mammadov
WHERE user_id = '6583ff24-f5d0-4e29-b291-723cafb535d7';

-- Map media user 2 (6 media items) to profile user Asim Mammadov (first one)
UPDATE media_references 
SET user_id = 'ee40561e-20e4-446d-bad6-893e01646581'  -- Asim Mammadov
WHERE user_id = '3b419621-3328-45c1-a9e2-05bc2f7ad17e';

-- Map media user 3 (4 media items) to profile user testone testone  
UPDATE media_references 
SET user_id = '3f789864-9cf6-4865-95f2-20deab32495e'  -- testone testone
WHERE user_id = '02dcab77-b99c-40ef-abbf-cd0ada31dfd3';

-- Step 2: Verify the mapping worked
SELECT 
    up.user_id as profile_user_id,
    up.first_name,
    up.last_name,
    COUNT(mr.id) as media_count,
    ARRAY_AGG(mr.media_type) as media_types
FROM user_profiles up
LEFT JOIN media_references mr ON up.user_id = mr.user_id
GROUP BY up.user_id, up.first_name, up.last_name
ORDER BY media_count DESC;

-- Step 3: Show the new user-media relationships
SELECT 
    'After mapping:' as status,
    up.user_id,
    up.first_name || ' ' || up.last_name as full_name,
    mr.media_type,
    mr.external_url,
    mr.is_profile_picture
FROM user_profiles up
INNER JOIN media_references mr ON up.user_id = mr.user_id
ORDER BY up.user_id, mr.is_profile_picture DESC, mr.media_order;

-- Step 4: Update profile pictures in user_profiles table from media_references
UPDATE user_profiles 
SET profile_picture_url = (
    SELECT mr.external_url 
    FROM media_references mr 
    WHERE mr.user_id = user_profiles.user_id 
    AND mr.is_profile_picture = true 
    AND mr.media_type = 'photo'
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM media_references mr 
    WHERE mr.user_id = user_profiles.user_id 
    AND mr.is_profile_picture = true
);

COMMENT ON TABLE media_references IS 'User IDs now mapped to match user_profiles table';
