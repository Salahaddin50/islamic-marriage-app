-- ============================================================================
-- TEMPORARY FIX: Remove Foreign Key Constraints
-- ============================================================================
-- This removes the foreign key constraints so the app works while we investigate

-- Remove foreign key constraint from media_references
ALTER TABLE media_references 
DROP CONSTRAINT IF EXISTS fk_media_user;

ALTER TABLE media_references 
DROP CONSTRAINT IF EXISTS fk_media_user_auth;

-- Remove foreign key constraint from user_profiles if it exists
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- Now both tables can exist independently without foreign key validation
-- This allows the app to work while we fix the data relationships

-- Comment to track this change
COMMENT ON TABLE media_references IS 'Foreign key constraint temporarily removed - needs data relationship fix';
COMMENT ON TABLE user_profiles IS 'Foreign key constraint temporarily removed - needs data relationship fix';
