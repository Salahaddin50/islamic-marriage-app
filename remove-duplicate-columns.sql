-- Remove duplicate columns from user_profiles table
-- These columns are already stored in the islamic_questionnaire JSON column

-- Remove religious/Islamic columns (already in JSON)
ALTER TABLE user_profiles DROP COLUMN IF EXISTS religious_level;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS prayer_frequency;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS quran_reading;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS covering_level;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS beard_practice;

-- Remove marriage/polygamy columns (already in JSON)
ALTER TABLE user_profiles DROP COLUMN IF EXISTS seeking_wife_number;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS accepted_wife_positions;

-- Verify the clean structure
SELECT 'Remaining columns in user_profiles:' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Show sample data to confirm JSON column has the data
SELECT 'Sample data with JSON column:' as status;
SELECT 
    first_name,
    gender,
    islamic_questionnaire->>'religious_level' as religious_level,
    islamic_questionnaire->>'prayer_frequency' as prayer_frequency,
    islamic_questionnaire->>'covering_level' as covering_level,
    islamic_questionnaire->>'accepted_wife_positions' as accepted_wife_positions
FROM user_profiles 
WHERE islamic_questionnaire != '{}'
LIMIT 2;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Duplicate columns removed successfully!';
    RAISE NOTICE 'All Islamic/religious data is now only in islamic_questionnaire JSON column';
    RAISE NOTICE 'Table structure is now clean and efficient';
END $$;
