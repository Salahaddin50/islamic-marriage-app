-- Islamic Marriage App Database Schema for Supabase
-- Comprehensive schema for Islamic matrimonial platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types for better data integrity
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE marital_status_type AS ENUM ('never_married', 'divorced', 'widowed');
CREATE TYPE education_level_type AS ENUM ('no_formal_education', 'primary', 'secondary', 'high_school', 'diploma', 'bachelor', 'master', 'doctorate', 'islamic_studies');
CREATE TYPE occupation_category_type AS ENUM ('student', 'professional', 'business', 'religious_scholar', 'homemaker', 'retired', 'other');
CREATE TYPE sect_type AS ENUM ('sunni', 'shia', 'other');
CREATE TYPE madhab_type AS ENUM ('hanafi', 'maliki', 'shafii', 'hanbali', 'jafari', 'other');
CREATE TYPE prayer_frequency_type AS ENUM ('five_times_daily', 'regularly', 'sometimes', 'rarely', 'prefer_not_to_say');
CREATE TYPE hijab_type AS ENUM ('full_hijab', 'partial_hijab', 'niqab', 'no_hijab', 'not_applicable');
CREATE TYPE beard_type AS ENUM ('full_beard', 'trimmed_beard', 'mustache_only', 'clean_shaven', 'not_applicable');
CREATE TYPE polygamy_preference_type AS ENUM ('accept', 'maybe', 'no', 'not_applicable');
CREATE TYPE wife_number_type AS ENUM ('first', 'second', 'third', 'fourth');
CREATE TYPE seeking_wife_number_type AS ENUM ('first', 'second', 'third', 'fourth', 'any');
CREATE TYPE eye_color_type AS ENUM ('brown', 'black', 'hazel', 'green', 'blue', 'gray', 'amber');
CREATE TYPE hair_color_type AS ENUM ('black', 'dark_brown', 'light_brown', 'blonde', 'red', 'gray', 'white', 'other');
CREATE TYPE skin_tone_type AS ENUM ('very_fair', 'fair', 'medium', 'olive', 'dark', 'very_dark');
CREATE TYPE body_type_type AS ENUM ('slim', 'athletic', 'average', 'curvy', 'heavy_set');
CREATE TYPE verification_status_type AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE profile_status_type AS ENUM ('active', 'inactive', 'suspended', 'deleted');

-- New types for improved profile
CREATE TYPE social_condition_type AS ENUM ('sufficient', 'rich', 'very_rich');
CREATE TYPE work_status_type AS ENUM ('not_working', 'working');
CREATE TYPE covering_level_type AS ENUM ('will_cover', 'hijab', 'niqab');
CREATE TYPE living_condition_type AS ENUM ('living_with_parents', 'living_alone', 'living_with_children');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    profile_status profile_status_type DEFAULT 'active',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents_submitted BOOLEAN DEFAULT FALSE
);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender gender_type NOT NULL,
    date_of_birth DATE NOT NULL,
    age INTEGER,
    
    -- Physical Characteristics
    height_cm INTEGER, -- Height in centimeters
    weight_kg INTEGER, -- Weight in kilograms
    eye_color eye_color_type,
    hair_color hair_color_type,
    skin_tone skin_tone_type,
    body_type body_type_type,
    
    -- Location
    country VARCHAR(100),
    state_province VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    
    -- Islamic Information
    sect sect_type,
    madhab madhab_type,
    prayer_frequency prayer_frequency_type,
    quran_memorization_level VARCHAR(100), -- e.g., "Complete Hafiz", "10 Surahs", etc.
    islamic_education_level VARCHAR(200),
    hajj_performed BOOLEAN DEFAULT FALSE,
    umrah_performed BOOLEAN DEFAULT FALSE,
    
    -- Gender-specific Islamic practices
    hijab_style hijab_type, -- For females
    beard_style beard_type, -- For males
    
    -- Family & Marriage Information
    marital_status marital_status_type NOT NULL,
    has_children BOOLEAN DEFAULT FALSE,
    number_of_children INTEGER DEFAULT 0,
    children_living_with_user BOOLEAN DEFAULT FALSE,
    wants_children BOOLEAN,
    
    -- Polygamy Preferences (Islamic marriage context)
    -- For women: willingness to be 2nd, 3rd, or 4th wife
    accept_polygamy polygamy_preference_type,
    willing_wife_number wife_number_type[], -- Array to allow multiple selections
    
    -- For men: seeking which wife number
    seeking_wife_number seeking_wife_number_type,
    current_wives_count INTEGER DEFAULT 0,
    
    -- Education & Profession
    education_level education_level_type,
    field_of_study VARCHAR(200),
    occupation VARCHAR(200),
    occupation_category occupation_category_type,
    annual_income_range VARCHAR(50), -- e.g., "30000-50000"
    employment_status VARCHAR(100),
    
    -- New fields for improved profile
    social_condition social_condition_type, -- For males: 'Sufficient', 'Rich', 'Very Rich'
    work_status work_status_type, -- For females: 'Not Working', 'Working'
    covering_level covering_level_type, -- For females: 'Will Cover', 'Hijab', 'Niqab'
    living_condition living_condition_type, -- Updated: 'Living with Parents', 'Living Alone', 'Living with Children'
    
    -- Family Information
    father_occupation VARCHAR(200),
    mother_occupation VARCHAR(200),
    number_of_siblings INTEGER,
    family_religious_level VARCHAR(100),
    family_financial_status VARCHAR(100),
    
    -- Personal Preferences
    bio TEXT,
    hobbies TEXT[],
    languages_spoken VARCHAR(100)[],
    looking_for TEXT, -- What they're looking for in a spouse
    
    -- Verification
    profile_verified_at TIMESTAMP WITH TIME ZONE,
    profile_verification_status verification_status_type DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_age CHECK (age >= 18 AND age <= 100),
    CONSTRAINT valid_height CHECK (height_cm >= 120 AND height_cm <= 250),
    CONSTRAINT valid_weight CHECK (weight_kg >= 30 AND weight_kg <= 300),
    CONSTRAINT valid_children_count CHECK (number_of_children >= 0),
    CONSTRAINT valid_wives_count CHECK (current_wives_count >= 0 AND current_wives_count <= 4),
    CONSTRAINT valid_siblings CHECK (number_of_siblings >= 0)
);

-- Media references table (for external server storage)
CREATE TABLE media_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL, -- 'photo', 'video'
    external_url VARCHAR(500) NOT NULL, -- URL to external media server
    thumbnail_url VARCHAR(500), -- Thumbnail URL for videos
    media_order INTEGER DEFAULT 1, -- Order of display
    is_profile_picture BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE, -- For photo verification
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    
    -- Privacy settings
    visibility_level VARCHAR(20) DEFAULT 'private', -- 'public', 'private', 'matched_only'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner preferences table
CREATE TABLE partner_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Age preferences
    min_age INTEGER,
    max_age INTEGER,
    
    -- Physical preferences
    min_height_cm INTEGER,
    max_height_cm INTEGER,
    preferred_eye_colors eye_color_type[],
    preferred_hair_colors hair_color_type[],
    preferred_skin_tones skin_tone_type[],
    preferred_body_types body_type_type[],
    
    -- Location preferences
    preferred_countries VARCHAR(100)[],
    preferred_states VARCHAR(100)[],
    max_distance_km INTEGER, -- Maximum distance for local matches
    accept_international BOOLEAN DEFAULT TRUE,
    
    -- Islamic preferences
    preferred_sects sect_type[],
    preferred_madhabs madhab_type[],
    min_prayer_frequency prayer_frequency_type,
    prefer_hafiz BOOLEAN DEFAULT FALSE,
    prefer_islamic_education BOOLEAN DEFAULT FALSE,
    prefer_hajj_performed BOOLEAN DEFAULT FALSE,
    
    -- For males: hijab preference for spouse
    preferred_hijab_styles hijab_type[],
    -- For females: beard preference for spouse
    preferred_beard_styles beard_type[],
    
    -- Marriage & Family preferences
    preferred_marital_status marital_status_type[],
    accept_divorced BOOLEAN DEFAULT TRUE,
    accept_widowed BOOLEAN DEFAULT TRUE,
    accept_with_children BOOLEAN DEFAULT TRUE,
    want_children_together BOOLEAN,
    
    -- Polygamy preferences
    -- For women: Accept being in polygamous marriage
    accept_polygamous_marriage polygamy_preference_type DEFAULT 'maybe',
    -- For men: Preference for wife number they're seeking
    preferred_wife_positions seeking_wife_number_type[] DEFAULT ARRAY['first'::seeking_wife_number_type],
    
    -- Education & Career preferences
    min_education_level education_level_type,
    preferred_occupations VARCHAR(200)[],
    min_income_expectation VARCHAR(50),
    
    -- Other preferences
    preferred_languages VARCHAR(100)[],
    deal_breakers TEXT[],
    important_qualities TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_age_range CHECK (min_age <= max_age AND min_age >= 18),
    CONSTRAINT valid_height_range CHECK (min_height_cm <= max_height_cm)
);

-- User matches table
CREATE TABLE user_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2), -- Compatibility score 0-100
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Match status
    user1_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'liked', 'passed', 'blocked'
    user2_status VARCHAR(20) DEFAULT 'pending',
    is_mutual_match BOOLEAN DEFAULT FALSE,
    
    -- Communication status
    conversation_started BOOLEAN DEFAULT FALSE,
    conversation_started_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user1_id, user2_id),
    CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- User verification documents
CREATE TABLE verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'national_id', 'passport', 'driving_license', 'birth_certificate'
    external_document_url VARCHAR(500) NOT NULL, -- URL to external secure server
    verification_status verification_status_type DEFAULT 'pending',
    verified_by UUID, -- Admin who verified
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Islamic specific questionnaire responses
CREATE TABLE islamic_questionnaire (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Religious practice questions
    daily_prayers_consistency INTEGER, -- 1-5 scale
    friday_prayers_attendance VARCHAR(50),
    quran_reading_frequency VARCHAR(50),
    islamic_knowledge_level VARCHAR(50),
    religious_events_participation VARCHAR(50),
    
    -- Family and marriage views
    gender_roles_view TEXT,
    family_planning_view TEXT,
    religious_education_children TEXT,
    spouse_religious_expectations TEXT,
    
    -- Lifestyle questions
    halal_food_strictness VARCHAR(50),
    music_entertainment_view VARCHAR(50),
    social_media_usage VARCHAR(50),
    modesty_interpretation TEXT,
    
    -- Polygamy specific questions (detailed)
    polygamy_understanding TEXT, -- Their understanding of Islamic polygamy
    polygamy_comfort_level INTEGER, -- 1-5 scale
    co_wife_relationship_expectations TEXT, -- For women
    multiple_wives_management_plan TEXT, -- For men
    financial_responsibility_view TEXT,
    time_sharing_expectations TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity log
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_user_profiles_age ON user_profiles(age);
CREATE INDEX idx_user_profiles_location ON user_profiles(country, state_province, city);
CREATE INDEX idx_user_profiles_marital_status ON user_profiles(marital_status);
CREATE INDEX idx_user_profiles_sect ON user_profiles(sect);
CREATE INDEX idx_user_profiles_polygamy ON user_profiles(accept_polygamy, seeking_wife_number);
CREATE INDEX idx_media_references_user_type ON media_references(user_id, media_type);
CREATE INDEX idx_user_matches_users ON user_matches(user1_id, user2_id);
CREATE INDEX idx_user_matches_mutual ON user_matches(is_mutual_match);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE islamic_questionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view own profile details" ON user_profiles
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id)
    );

CREATE POLICY "Users can view matched profiles" ON user_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT CASE 
                WHEN user1_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) THEN user2_id
                WHEN user2_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) THEN user1_id
            END
            FROM user_matches 
            WHERE is_mutual_match = true
        )
    );

CREATE POLICY "Users can update own profile details" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id)
    );

-- RLS Policies for media_references table
CREATE POLICY "Users can manage own media" ON media_references
    FOR ALL USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id)
    );

CREATE POLICY "Users can view matched users media" ON media_references
    FOR SELECT USING (
        user_id IN (
            SELECT CASE 
                WHEN user1_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) THEN user2_id
                WHEN user2_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) THEN user1_id
            END
            FROM user_matches 
            WHERE is_mutual_match = true
        )
        AND visibility_level IN ('public', 'matched_only')
    );

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age_from_dob()
RETURNS TRIGGER AS $$
BEGIN
    NEW.age = EXTRACT(YEAR FROM AGE(NEW.date_of_birth));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_preferences_updated_at BEFORE UPDATE ON partner_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically calculate age on insert and update
CREATE TRIGGER calculate_age_trigger BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION calculate_age_from_dob();

-- Function to calculate match compatibility score
CREATE OR REPLACE FUNCTION calculate_match_score(user1_uuid UUID, user2_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    score DECIMAL := 0;
    user1_profile user_profiles%ROWTYPE;
    user2_profile user_profiles%ROWTYPE;
    user1_prefs partner_preferences%ROWTYPE;
    user2_prefs partner_preferences%ROWTYPE;
BEGIN
    -- Get profiles and preferences
    SELECT * INTO user1_profile FROM user_profiles WHERE user_id = user1_uuid;
    SELECT * INTO user2_profile FROM user_profiles WHERE user_id = user2_uuid;
    SELECT * INTO user1_prefs FROM partner_preferences WHERE user_id = user1_uuid;
    SELECT * INTO user2_prefs FROM partner_preferences WHERE user_id = user2_uuid;
    
    -- Age compatibility (20 points max)
    IF user2_profile.age BETWEEN COALESCE(user1_prefs.min_age, 0) AND COALESCE(user1_prefs.max_age, 100)
       AND user1_profile.age BETWEEN COALESCE(user2_prefs.min_age, 0) AND COALESCE(user2_prefs.max_age, 100) THEN
        score := score + 20;
    END IF;
    
    -- Religious compatibility (30 points max)
    IF user1_profile.sect = user2_profile.sect THEN
        score := score + 15;
    END IF;
    
    IF user1_profile.madhab = user2_profile.madhab THEN
        score := score + 10;
    END IF;
    
    IF user1_profile.prayer_frequency = user2_profile.prayer_frequency THEN
        score := score + 5;
    END IF;
    
    -- Location compatibility (15 points max)
    IF user1_profile.country = user2_profile.country THEN
        score := score + 10;
        IF user1_profile.state_province = user2_profile.state_province THEN
            score := score + 5;
        END IF;
    END IF;
    
    -- Education compatibility (10 points max)
    IF user1_profile.education_level = user2_profile.education_level THEN
        score := score + 10;
    END IF;
    
    -- Marital status compatibility (15 points max)
    IF user1_profile.marital_status = ANY(user2_prefs.preferred_marital_status)
       AND user2_profile.marital_status = ANY(user1_prefs.preferred_marital_status) THEN
        score := score + 15;
    END IF;
    
    -- Polygamy compatibility (10 points max)
    -- Complex logic for polygamy matching would go here
    
    RETURN LEAST(score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql;

-- Insert initial data or reference data can be added here
-- Example: Common Islamic countries, cities, etc.

COMMENT ON TABLE users IS 'Main users table linked to Supabase auth';
COMMENT ON TABLE user_profiles IS 'Detailed user profiles with Islamic marriage specific fields';
COMMENT ON TABLE media_references IS 'References to photos/videos stored on external server';
COMMENT ON TABLE partner_preferences IS 'User preferences for potential matches';
COMMENT ON TABLE user_matches IS 'Matching system with compatibility scores';
COMMENT ON TABLE islamic_questionnaire IS 'Detailed Islamic beliefs and polygamy preferences';
