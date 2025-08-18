-- Clean Migration: Properly organize user_profiles table
-- Move ALL questionnaire data to JSON column and remove duplicate columns

-- Step 1: Update islamic_questionnaire JSON to include ALL questionnaire data
-- (including data from individual columns that shouldn't be there)
UPDATE user_profiles 
SET islamic_questionnaire = jsonb_build_object(
    -- Religious/Islamic data (move from individual columns to JSON)
    'religious_level', COALESCE(islamic_questionnaire->>'religious_level', religious_level),
    'prayer_frequency', COALESCE(islamic_questionnaire->>'prayer_frequency', prayer_frequency),
    'quran_reading_level', COALESCE(islamic_questionnaire->>'quran_reading_level', quran_reading),
    'covering_level', COALESCE(islamic_questionnaire->>'covering_level', covering_level),
    'beard_practice', COALESCE(islamic_questionnaire->>'beard_practice', beard_practice),
    'hijab_practice', islamic_questionnaire->>'hijab_practice',
    
    -- Marriage/Polygamy preferences (move from individual columns to JSON)
    'seeking_wife_number', COALESCE(islamic_questionnaire->>'seeking_wife_number', seeking_wife_number),
    'accepted_wife_positions', COALESCE(islamic_questionnaire->>'accepted_wife_positions', accepted_wife_positions::jsonb),
    
    -- Timestamps
    'created_at', COALESCE(islamic_questionnaire->>'created_at', created_at::text),
    'updated_at', COALESCE(islamic_questionnaire->>'updated_at', updated_at::text)
);

-- Step 2: Remove duplicate columns that are now in JSON
-- (Keep only essential profile columns in main table)
ALTER TABLE user_profiles DROP COLUMN IF EXISTS religious_level;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS prayer_frequency;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS quran_reading;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS covering_level;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS beard_practice;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS seeking_wife_number;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS accepted_wife_positions;

-- Step 3: Verify the clean structure
-- Essential profile columns (keep in main table):
SELECT 'Essential profile columns (kept in main table):' as section;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN (
    'id', 'user_id', 'first_name', 'last_name', 'gender', 'date_of_birth', 'age',
    'country', 'city', 'phone_code', 'mobile_number',
    'height_cm', 'weight_kg', 'eye_color', 'hair_color', 'skin_tone', 'body_type',
    'education_level', 'occupation', 'monthly_income', 'social_condition', 'work_status',
    'housing_type', 'living_condition', 'created_at', 'updated_at'
  )
ORDER BY column_name;

-- Questionnaire data (now in JSON column):
SELECT 'Questionnaire data (now in islamic_questionnaire JSON):' as section;
SELECT 
    user_id,
    first_name,
    gender,
    islamic_questionnaire->>'religious_level' as religious_level,
    islamic_questionnaire->>'prayer_frequency' as prayer_frequency,
    islamic_questionnaire->>'covering_level' as covering_level,
    islamic_questionnaire->>'beard_practice' as beard_practice,
    islamic_questionnaire->>'seeking_wife_number' as seeking_wife_number,
    islamic_questionnaire->>'accepted_wife_positions' as accepted_wife_positions
FROM user_profiles 
WHERE islamic_questionnaire != '{}'
LIMIT 3;

-- Step 4: Show the clean table structure
SELECT 'Final clean table structure:' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETED ===';
    RAISE NOTICE 'user_profiles table is now clean:';
    RAISE NOTICE '• Essential profile data in main columns';
    RAISE NOTICE '• ALL questionnaire data in islamic_questionnaire JSON';
    RAISE NOTICE '• No duplicate columns';
    RAISE NOTICE '• Gender-specific data properly organized in JSON';
END $$;
