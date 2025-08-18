-- COMPREHENSIVE ENUM AND COLUMN FIX
-- This fixes all enum mismatches and adds missing columns in one go
-- Run this in Supabase SQL Editor

-- Step 1: Drop and recreate body_type_type with correct values
DROP TYPE IF EXISTS body_type_type CASCADE;
CREATE TYPE body_type_type AS ENUM ('Slim', 'Average', 'Athletic', 'Curvy', 'Heavy Set', 'Plus Size');

-- Step 2: Drop and recreate other enums with correct values to match frontend
DROP TYPE IF EXISTS eye_color_type CASCADE;
CREATE TYPE eye_color_type AS ENUM ('Brown', 'Black', 'Hazel', 'Green', 'Blue', 'Gray', 'Amber');

DROP TYPE IF EXISTS hair_color_type CASCADE;
CREATE TYPE hair_color_type AS ENUM ('Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Red', 'Gray', 'White');

DROP TYPE IF EXISTS skin_tone_type CASCADE;
CREATE TYPE skin_tone_type AS ENUM ('Very Fair', 'Fair', 'Medium', 'Olive', 'Brown', 'Dark Brown', 'Very Dark');

DROP TYPE IF EXISTS education_level_type CASCADE;
CREATE TYPE education_level_type AS ENUM ('High School', 'Some College', 'Bachelor''s Degree', 'Master''s Degree', 'PhD/Doctorate', 'Islamic Studies', 'Professional Certification', 'Other');

DROP TYPE IF EXISTS prayer_frequency_type CASCADE;
CREATE TYPE prayer_frequency_type AS ENUM ('All 5 Daily Prayers', 'Most Prayers', 'Some Prayers', 'Friday Only', 'Occasionally', 'Learning to Pray');

-- Step 3: Create new enum types if they don't exist
CREATE TYPE IF NOT EXISTS social_condition_type AS ENUM ('Sufficient', 'Rich', 'Very Rich');
CREATE TYPE IF NOT EXISTS work_status_type AS ENUM ('Not Working', 'Working');
CREATE TYPE IF NOT EXISTS covering_level_type AS ENUM ('Will Cover', 'Hijab', 'Niqab');
CREATE TYPE IF NOT EXISTS living_condition_type AS ENUM ('Living with Parents', 'Living Alone', 'Living with Children');

-- Step 4: Drop and recreate user_profiles table with all correct columns and types
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    date_of_birth DATE NOT NULL,
    age INTEGER,
    
    -- Location
    country VARCHAR(100),
    state_province VARCHAR(100),
    city VARCHAR(100),
    
    -- Physical Characteristics
    height_cm INTEGER,
    weight_kg INTEGER,
    eye_color eye_color_type,
    hair_color hair_color_type,
    skin_tone skin_tone_type,
    body_type body_type_type,
    
    -- Education & Profession
    education_level education_level_type,
    occupation VARCHAR(200),
    monthly_income VARCHAR(100),
    
    -- New gender-specific fields
    social_condition social_condition_type, -- For males
    work_status work_status_type, -- For females
    
    -- Housing
    housing_type VARCHAR(100),
    living_condition living_condition_type,
    
    -- Religious Information
    religious_level VARCHAR(100),
    prayer_frequency prayer_frequency_type,
    quran_reading VARCHAR(100),
    covering_level covering_level_type, -- For females
    beard_practice VARCHAR(100), -- For males
    
    -- Polygamy Preferences
    seeking_wife_number VARCHAR(20), -- For males
    accepted_wife_positions TEXT[], -- For females
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_age CHECK (age >= 18 AND age <= 100),
    CONSTRAINT valid_height CHECK (height_cm >= 120 AND height_cm <= 250),
    CONSTRAINT valid_weight CHECK (weight_kg >= 30 AND weight_kg <= 300)
);

-- Step 5: Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view own profile details" ON user_profiles
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can update own profile details" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Step 7: Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_user_profiles_age ON user_profiles(age);
CREATE INDEX idx_user_profiles_location ON user_profiles(country, city);

-- Step 8: Add comments for documentation
COMMENT ON TABLE user_profiles IS 'User profile information for Islamic dating app';
COMMENT ON COLUMN user_profiles.social_condition IS 'For males: Financial status - Sufficient, Rich, Very Rich';
COMMENT ON COLUMN user_profiles.work_status IS 'For females: Employment status - Not Working, Working';
COMMENT ON COLUMN user_profiles.covering_level IS 'For females: Islamic covering level - Will Cover, Hijab, Niqab';
COMMENT ON COLUMN user_profiles.living_condition IS 'Living arrangement - Living with Parents, Living Alone, Living with Children';
COMMENT ON COLUMN user_profiles.housing_type IS 'Type of housing arrangement';
COMMENT ON COLUMN user_profiles.monthly_income IS 'Monthly income amount (optional, mainly for males)';

-- Step 9: Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Verify the setup
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
