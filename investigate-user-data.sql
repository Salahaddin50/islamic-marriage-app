-- ============================================================================
-- INVESTIGATE USER DATA MISMATCH
-- ============================================================================
-- This script helps identify the user ID mismatch between tables

-- Step 1: Check what user IDs exist in the users table
SELECT 'users_table' as table_name, id as user_id, email, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 2: Check what user IDs exist in user_profiles table  
SELECT 'user_profiles_table' as table_name, user_id, first_name, last_name, created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 3: Check what user IDs exist in media_references table
SELECT 'media_references_table' as table_name, user_id, media_type, COUNT(*) as media_count
FROM media_references 
GROUP BY user_id, media_type
ORDER BY media_count DESC
LIMIT 10;

-- Step 4: Check for user IDs that exist in media_references but NOT in users
SELECT 
    mr.user_id as orphaned_user_id,
    COUNT(mr.id) as media_count,
    ARRAY_AGG(mr.media_type) as media_types
FROM media_references mr
LEFT JOIN users u ON mr.user_id = u.id
WHERE u.id IS NULL
GROUP BY mr.user_id;

-- Step 5: Check for user IDs that exist in user_profiles but NOT in users  
SELECT 
    up.user_id as orphaned_profile_user_id,
    up.first_name,
    up.last_name
FROM user_profiles up
LEFT JOIN users u ON up.user_id = u.id  
WHERE u.id IS NULL;

-- Step 6: Find potential matches between user_profiles and media_references
-- (Even though they might not link to users table correctly)
SELECT 
    up.user_id as profile_user_id,
    up.first_name,
    up.last_name,
    mr.user_id as media_user_id,
    COUNT(mr.id) as media_count
FROM user_profiles up
FULL OUTER JOIN media_references mr ON up.user_id = mr.user_id
GROUP BY up.user_id, up.first_name, up.last_name, mr.user_id
ORDER BY media_count DESC NULLS LAST;
