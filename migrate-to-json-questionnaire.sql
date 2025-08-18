-- Migration: Consolidate islamic_questionnaires into user_profiles as JSON column
-- This eliminates the need for a separate table and prevents conflict issues

-- Step 1: Add the islamic_questionnaire JSONB column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS islamic_questionnaire JSONB DEFAULT '{}';

-- Step 2: Migrate existing data from islamic_questionnaires to user_profiles
-- This will combine all questionnaire data into a single JSON object
-- Only including columns that actually exist in the islamic_questionnaires table
UPDATE user_profiles 
SET islamic_questionnaire = (
    SELECT jsonb_build_object(
        'religious_level', iq.religious_level,
        'prayer_frequency', iq.prayer_frequency,
        'quran_reading_level', iq.quran_reading_level,
        'hijab_practice', iq.hijab_practice,
        'covering_level', iq.covering_level,
        'beard_practice', iq.beard_practice,
        'seeking_wife_number', iq.seeking_wife_number,
        'accepted_wife_positions', iq.accepted_wife_positions,
        'created_at', iq.created_at,
        'updated_at', iq.updated_at
    )
    FROM islamic_questionnaires iq 
    WHERE iq.user_id = user_profiles.user_id
)
WHERE EXISTS (
    SELECT 1 FROM islamic_questionnaires iq2 
    WHERE iq2.user_id = user_profiles.user_id
);

-- Step 3: Create an index on the JSONB column for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_islamic_questionnaire_gin 
ON user_profiles USING GIN (islamic_questionnaire);

-- Step 4: Create indexes on commonly queried JSON fields
CREATE INDEX IF NOT EXISTS idx_user_profiles_religious_level 
ON user_profiles USING BTREE ((islamic_questionnaire->>'religious_level'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_prayer_frequency 
ON user_profiles USING BTREE ((islamic_questionnaire->>'prayer_frequency'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_seeking_wife_number 
ON user_profiles USING BTREE ((islamic_questionnaire->>'seeking_wife_number'));

-- Step 5: Verify the migration
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN islamic_questionnaire != '{}' THEN 1 END) as profiles_with_questionnaire,
    COUNT(CASE WHEN islamic_questionnaire = '{}' THEN 1 END) as profiles_without_questionnaire
FROM user_profiles;

-- Step 6: Show a sample of migrated data
SELECT 
    user_id,
    first_name,
    islamic_questionnaire->>'religious_level' as religious_level,
    islamic_questionnaire->>'prayer_frequency' as prayer_frequency,
    islamic_questionnaire
FROM user_profiles 
WHERE islamic_questionnaire != '{}' 
LIMIT 5;

-- Step 7: After verifying the migration is successful, you can optionally drop the old table
-- CAUTION: Only run this after confirming all data has been migrated successfully
-- DROP TABLE IF EXISTS islamic_questionnaires;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'islamic_questionnaire JSONB column added to user_profiles';
    RAISE NOTICE 'All existing questionnaire data has been migrated';
    RAISE NOTICE 'Performance indexes have been created';
    RAISE NOTICE 'You can now update your application code to use the JSON column';
END $$;
