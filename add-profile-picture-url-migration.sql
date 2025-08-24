-- Migration to add profile_picture_url field to user_profiles table

-- Add profile_picture_url column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);

-- Add comments for clarity
COMMENT ON COLUMN user_profiles.profile_picture_url IS 'URL to the user profile picture (avatar)';

-- Verification query to check if column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'profile_picture_url';
