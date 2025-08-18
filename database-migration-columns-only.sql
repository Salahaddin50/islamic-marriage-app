-- ADD MISSING COLUMNS ONLY
-- Run this in Supabase SQL Editor if types already exist

-- Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS social_condition social_condition_type,
ADD COLUMN IF NOT EXISTS work_status work_status_type,
ADD COLUMN IF NOT EXISTS covering_level covering_level_type,
ADD COLUMN IF NOT EXISTS living_condition living_condition_type,
ADD COLUMN IF NOT EXISTS housing_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS monthly_income VARCHAR(100);

-- Update existing records with default values
UPDATE user_profiles 
SET housing_type = 'Family Home' 
WHERE housing_type IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.social_condition IS 'For males: Financial status - sufficient, rich, very_rich';
COMMENT ON COLUMN user_profiles.work_status IS 'For females: Employment status - not_working, working';
COMMENT ON COLUMN user_profiles.covering_level IS 'For females: Islamic covering level - will_cover, hijab, niqab';
COMMENT ON COLUMN user_profiles.living_condition IS 'Living arrangement - living_with_parents, living_alone, living_with_children';
COMMENT ON COLUMN user_profiles.housing_type IS 'Type of housing arrangement';
COMMENT ON COLUMN user_profiles.monthly_income IS 'Monthly income amount (optional, mainly for males)';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('social_condition', 'work_status', 'covering_level', 'living_condition', 'housing_type', 'monthly_income')
ORDER BY column_name;
