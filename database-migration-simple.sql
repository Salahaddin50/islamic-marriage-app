-- SIMPLE DATABASE MIGRATION FOR NEW PROFILE FIELDS
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rpzkugodaacelruquhtc

-- Step 1: Create new enum types
CREATE TYPE social_condition_type AS ENUM ('sufficient', 'rich', 'very_rich');
CREATE TYPE work_status_type AS ENUM ('not_working', 'working');
CREATE TYPE covering_level_type AS ENUM ('will_cover', 'hijab', 'niqab');
CREATE TYPE living_condition_type AS ENUM ('living_with_parents', 'living_alone', 'living_with_children');

-- Step 2: Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN social_condition social_condition_type,
ADD COLUMN work_status work_status_type,
ADD COLUMN covering_level covering_level_type,
ADD COLUMN living_condition living_condition_type,
ADD COLUMN housing_type VARCHAR(100),
ADD COLUMN monthly_income VARCHAR(100);

-- Step 3: Update existing records with default values
UPDATE user_profiles 
SET housing_type = 'Family Home' 
WHERE housing_type IS NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN user_profiles.social_condition IS 'For males: Financial status - sufficient, rich, very_rich';
COMMENT ON COLUMN user_profiles.work_status IS 'For females: Employment status - not_working, working';
COMMENT ON COLUMN user_profiles.covering_level IS 'For females: Islamic covering level - will_cover, hijab, niqab';
COMMENT ON COLUMN user_profiles.living_condition IS 'Living arrangement - living_with_parents, living_alone, living_with_children';
COMMENT ON COLUMN user_profiles.housing_type IS 'Type of housing arrangement';
COMMENT ON COLUMN user_profiles.monthly_income IS 'Monthly income amount (optional, mainly for males)';

-- Step 5: Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('social_condition', 'work_status', 'covering_level', 'living_condition', 'housing_type', 'monthly_income')
ORDER BY column_name;
