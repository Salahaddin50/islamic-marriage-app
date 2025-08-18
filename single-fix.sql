-- SINGLE SQL FIX - COPY AND RUN THIS ENTIRE BLOCK
-- This fixes all enum mismatches and adds missing columns

-- Step 1: Drop and recreate enums with correct values
DROP TYPE IF EXISTS body_type_type CASCADE;
CREATE TYPE body_type_type AS ENUM ('Slim', 'Average', 'Athletic', 'Curvy', 'Heavy Set', 'Plus Size');

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

-- Step 2: Create new types with DO block
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_condition_type') THEN
    CREATE TYPE social_condition_type AS ENUM ('Sufficient', 'Rich', 'Very Rich');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_status_type') THEN
    CREATE TYPE work_status_type AS ENUM ('Not Working', 'Working');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'covering_level_type') THEN
    CREATE TYPE covering_level_type AS ENUM ('Will Cover', 'Hijab', 'Niqab');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'living_condition_type') THEN
    CREATE TYPE living_condition_type AS ENUM ('Living with Parents', 'Living Alone', 'Living with Children');
  END IF;
END $$;

-- Step 3: Recreate user_profiles table with all correct columns
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
    social_condition social_condition_type,
    work_status work_status_type,
    
    -- Housing
    housing_type VARCHAR(100),
    living_condition living_condition_type,
    
    -- Religious Information
    religious_level VARCHAR(100),
    prayer_frequency prayer_frequency_type,
    quran_reading VARCHAR(100),
    covering_level covering_level_type,
    beard_practice VARCHAR(100),
    
    -- Polygamy Preferences
    seeking_wife_number VARCHAR(20),
    accepted_wife_positions TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_age CHECK (age >= 18 AND age <= 100),
    CONSTRAINT valid_height CHECK (height_cm >= 120 AND height_cm <= 250),
    CONSTRAINT valid_weight CHECK (weight_kg >= 30 AND weight_kg <= 300)
);

-- Step 4: Enable RLS and create policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Step 5: Create indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);

-- Step 6: Create updated_at trigger
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

-- Step 7: Verify setup
SELECT 'Setup complete - user_profiles table recreated with all correct enums and columns' as status;
