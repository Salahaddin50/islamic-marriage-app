-- DATABASE MIGRATION FOR NEW PROFILE FIELDS
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rpzkugodaacelruquhtc

-- Step 1: Create new enum types (with safe creation)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_condition_type') THEN
        CREATE TYPE social_condition_type AS ENUM ('sufficient', 'rich', 'very_rich');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_status_type') THEN
        CREATE TYPE work_status_type AS ENUM ('not_working', 'working');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'covering_level_type') THEN
        CREATE TYPE covering_level_type AS ENUM ('will_cover', 'hijab', 'niqab');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'living_condition_type') THEN
        CREATE TYPE living_condition_type AS ENUM ('living_with_parents', 'living_alone', 'living_with_children');
    END IF;
END $$;

-- Step 2: Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS social_condition social_condition_type,
ADD COLUMN IF NOT EXISTS work_status work_status_type,
ADD COLUMN IF NOT EXISTS covering_level covering_level_type,
ADD COLUMN IF NOT EXISTS living_condition living_condition_type,
ADD COLUMN IF NOT EXISTS housing_type VARCHAR(100);

-- Step 3: Update existing records with default values (optional)
UPDATE user_profiles 
SET housing_type = 'Family Home' 
WHERE housing_type IS NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN user_profiles.social_condition IS 'For males: Financial status - sufficient, rich, very_rich';
COMMENT ON COLUMN user_profiles.work_status IS 'For females: Employment status - not_working, working';
COMMENT ON COLUMN user_profiles.covering_level IS 'For females: Islamic covering level - will_cover, hijab, niqab';
COMMENT ON COLUMN user_profiles.living_condition IS 'Living arrangement - living_with_parents, living_alone, living_with_children';
COMMENT ON COLUMN user_profiles.housing_type IS 'Type of housing arrangement';

-- Step 5: Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('social_condition', 'work_status', 'covering_level', 'living_condition', 'housing_type')
ORDER BY column_name;
