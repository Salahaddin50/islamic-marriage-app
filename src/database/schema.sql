-- ============================================================================
-- HUME ISLAMIC DATING APP - DATABASE SCHEMA
-- ============================================================================
-- PostgreSQL schema for Islamic dating app with plural marriage support
-- Designed for scalability, performance, and GDPR compliance
-- ============================================================================

-- ================================
-- EXTENSIONS
-- ================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ================================
-- CUSTOM TYPES
-- ================================

-- Marriage and Religious Types
CREATE TYPE marriage_intention AS ENUM ('monogamous', 'polygamous', 'accepting_polygamy');
CREATE TYPE marriage_type AS ENUM ('first', 'second', 'third', 'fourth');
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE religion_level AS ENUM ('practicing', 'moderate', 'cultural', 'learning');
CREATE TYPE madhab_school AS ENUM ('hanafi', 'maliki', 'shafii', 'hanbali', 'jafari', 'other', 'prefer_not_to_say');
CREATE TYPE prayer_frequency AS ENUM ('five_times', 'sometimes', 'friday_only', 'rarely', 'learning');
CREATE TYPE hijab_preference AS ENUM ('always', 'sometimes', 'special_occasions', 'personal_choice', 'no_preference');
CREATE TYPE living_arrangement AS ENUM ('separate_homes', 'same_home_separate_quarters', 'shared_home', 'flexible');

-- User and Account Types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE subscription_type AS ENUM ('free', 'premium', 'platinum');
CREATE TYPE swipe_action AS ENUM ('like', 'pass', 'super_like');
CREATE TYPE message_type AS ENUM ('text', 'image', 'gif', 'sticker', 'system');
CREATE TYPE notification_type AS ENUM ('new_match', 'new_message', 'profile_visit', 'super_like', 'system');

-- ================================
-- USERS TABLE
-- ================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255) NOT NULL,
    status user_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone_number IS NULL OR phone_number ~* '^\+?[1-9]\d{1,14}$')
);

-- ================================
-- USER PROFILES TABLE
-- ================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    display_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,
    bio TEXT,
    occupation VARCHAR(100),
    education VARCHAR(100),
    height_cm INTEGER,
    
    -- Location (using PostGIS)
    location GEOGRAPHY(POINT, 4326),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    
    -- Verification
    identity_verified verification_status DEFAULT 'pending',
    photo_verified verification_status DEFAULT 'pending',
    profile_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_age CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years'),
    CONSTRAINT valid_height CHECK (height_cm IS NULL OR (height_cm >= 120 AND height_cm <= 250)),
    CONSTRAINT valid_name CHECK (first_name ~ '^[A-Za-z\s]{2,50}$')
);

-- ================================
-- ISLAMIC PREFERENCES TABLE
-- ================================

CREATE TABLE islamic_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Marriage Intentions
    marriage_intention marriage_intention NOT NULL,
    seeking_marriage_types marriage_type[],  -- For women: which positions they'd accept
    current_wives INTEGER DEFAULT 0,         -- For men: current number of wives (0-3)
    max_wives INTEGER,                       -- For men: maximum desired wives (1-4)
    
    -- Religious Practice
    religion_level religion_level NOT NULL,
    madhab_school madhab_school,
    prayer_frequency prayer_frequency NOT NULL,
    quran_reading BOOLEAN DEFAULT TRUE,
    islamic_education BOOLEAN DEFAULT FALSE,
    
    -- Lifestyle Preferences
    hijab_preference hijab_preference,
    halaal_diet BOOLEAN DEFAULT TRUE,
    smoking BOOLEAN DEFAULT FALSE,
    wants_children BOOLEAN DEFAULT TRUE,
    has_children BOOLEAN DEFAULT FALSE,
    number_of_children INTEGER DEFAULT 0,
    
    -- Family Structure Preferences
    accepts_polygamy BOOLEAN DEFAULT FALSE,  -- For women: willing to be in polygamous marriage
    wants_polygamy BOOLEAN DEFAULT FALSE,    -- For men: interested in plural marriage
    family_living_arrangement living_arrangement DEFAULT 'flexible',
    
    -- Cultural Background
    ethnic_backgrounds TEXT[],
    languages_spoken TEXT[] NOT NULL DEFAULT ARRAY['english'],
    country_of_origin VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_current_wives CHECK (current_wives >= 0 AND current_wives <= 3),
    CONSTRAINT valid_max_wives CHECK (max_wives IS NULL OR (max_wives >= 1 AND max_wives <= 4)),
    CONSTRAINT valid_number_of_children CHECK (number_of_children >= 0 AND number_of_children <= 20),
    CONSTRAINT male_polygamy_check CHECK (
        (marriage_intention = 'polygamous' AND max_wives IS NOT NULL) OR 
        (marriage_intention != 'polygamous')
    ),
    CONSTRAINT female_marriage_types CHECK (
        (marriage_intention = 'accepting_polygamy' AND seeking_marriage_types IS NOT NULL) OR 
        (marriage_intention != 'accepting_polygamy')
    )
);

-- ================================
-- PROFILE PHOTOS TABLE
-- ================================

CREATE TABLE profile_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    order_position INTEGER NOT NULL DEFAULT 1,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_order CHECK (order_position >= 1 AND order_position <= 6),
    CONSTRAINT one_primary_per_user UNIQUE (user_id, is_primary) DEFERRABLE INITIALLY DEFERRED
);

-- ================================
-- USER PREFERENCES TABLE
-- ================================

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Discovery Preferences
    age_range_min INTEGER DEFAULT 18,
    age_range_max INTEGER DEFAULT 35,
    max_distance_km INTEGER DEFAULT 50,
    gender_preference gender_type[],
    
    -- Islamic Compatibility Preferences
    preferred_marriage_intentions marriage_intention[],
    preferred_religion_levels religion_level[],
    preferred_prayer_frequencies prayer_frequency[],
    required_halaal_diet BOOLEAN,
    accepts_smokers BOOLEAN DEFAULT FALSE,
    wants_children_match BOOLEAN,
    accepts_existing_children BOOLEAN DEFAULT TRUE,
    
    -- For men: polygamy preferences
    accepts_wives_with_children BOOLEAN DEFAULT TRUE,
    preferred_living_arrangements living_arrangement[],
    
    -- Deal Breakers
    max_existing_children INTEGER DEFAULT 5,
    required_hijab BOOLEAN DEFAULT FALSE,
    required_islamic_education BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_age_range CHECK (age_range_min >= 18 AND age_range_max <= 80 AND age_range_min <= age_range_max),
    CONSTRAINT valid_distance CHECK (max_distance_km >= 1 AND max_distance_km <= 500)
);

-- ================================
-- SWIPE ACTIONS TABLE
-- ================================

CREATE TABLE swipe_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action swipe_action NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    location GEOGRAPHY(POINT, 4326),
    
    -- Prevent duplicate swipes
    UNIQUE(user_id, target_user_id),
    
    -- Prevent self-swipe
    CONSTRAINT no_self_swipe CHECK (user_id != target_user_id)
);

-- ================================
-- MATCHES TABLE
-- ================================

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Marriage compatibility info
    marriage_compatibility JSONB,
    compatibility_score INTEGER DEFAULT 0,
    
    -- Ensure unique matches and proper ordering
    UNIQUE(user1_id, user2_id),
    CONSTRAINT ordered_user_ids CHECK (user1_id < user2_id),
    CONSTRAINT valid_compatibility_score CHECK (compatibility_score >= 0 AND compatibility_score <= 100)
);

-- ================================
-- CHAT ROOMS TABLE
-- ================================

CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ================================
-- MESSAGES TABLE
-- ================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    message_type message_type DEFAULT 'text',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Reply functionality
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL
);

-- ================================
-- MESSAGE READS TABLE
-- ================================

CREATE TABLE message_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(message_id, user_id)
);

-- ================================
-- SUBSCRIPTIONS TABLE
-- ================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_type subscription_type DEFAULT 'free',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Payment info
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- NOTIFICATIONS TABLE
-- ================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- PUSH TOKENS TABLE
-- ================================

CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, token)
);

-- ================================
-- REPORT SYSTEM TABLE
-- ================================

CREATE TABLE user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT no_self_report CHECK (reporter_id != reported_user_id)
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- User and profile indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_active ON users(last_active_at);
CREATE INDEX idx_user_profiles_location ON user_profiles USING GIST(location);
CREATE INDEX idx_user_profiles_gender_age ON user_profiles(gender, date_of_birth);
CREATE INDEX idx_user_profiles_country ON user_profiles(country);

-- Islamic preferences indexes
CREATE INDEX idx_islamic_preferences_marriage_intention ON islamic_preferences(marriage_intention);
CREATE INDEX idx_islamic_preferences_religion_level ON islamic_preferences(religion_level);
CREATE INDEX idx_islamic_preferences_prayer_frequency ON islamic_preferences(prayer_frequency);
CREATE INDEX idx_islamic_preferences_marriage_types ON islamic_preferences USING GIN(seeking_marriage_types);
CREATE INDEX idx_islamic_preferences_languages ON islamic_preferences USING GIN(languages_spoken);

-- Swipe and match indexes
CREATE INDEX idx_swipe_actions_user_action ON swipe_actions(user_id, action);
CREATE INDEX idx_swipe_actions_target_user ON swipe_actions(target_user_id);
CREATE INDEX idx_swipe_actions_created_at ON swipe_actions(created_at);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX idx_matches_active ON matches(is_active);

-- Chat and messaging indexes
CREATE INDEX idx_messages_chat_room_sent ON messages(chat_room_id, sent_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);

-- Notification indexes
CREATE INDEX idx_notifications_user_sent ON notifications(user_id, sent);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Full-text search indexes
CREATE INDEX idx_user_profiles_search ON user_profiles USING GIN(
    to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(bio, ''))
);

-- ================================
-- TRIGGERS FOR UPDATED_AT
-- ================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_islamic_preferences_updated_at BEFORE UPDATE ON islamic_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- VIEWS FOR COMMON QUERIES
-- ================================

-- Complete user profile view
CREATE VIEW complete_user_profiles AS
SELECT 
    u.id,
    u.email,
    u.status,
    u.last_active_at,
    up.first_name,
    up.last_name,
    up.display_name,
    up.date_of_birth,
    EXTRACT(YEAR FROM AGE(up.date_of_birth)) as age,
    up.gender,
    up.bio,
    up.city,
    up.country,
    up.location,
    ip.marriage_intention,
    ip.religion_level,
    ip.prayer_frequency,
    ip.accepts_polygamy,
    ip.wants_polygamy,
    s.subscription_type,
    up.profile_completed
FROM users u
JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN islamic_preferences ip ON u.id = ip.user_id
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
WHERE u.status = 'active';

-- Match compatibility view
CREATE VIEW match_compatibility AS
SELECT 
    m.id as match_id,
    m.user1_id,
    m.user2_id,
    m.matched_at,
    u1.first_name as user1_name,
    u2.first_name as user2_name,
    ip1.marriage_intention as user1_marriage_intention,
    ip2.marriage_intention as user2_marriage_intention,
    ip1.religion_level as user1_religion_level,
    ip2.religion_level as user2_religion_level,
    m.compatibility_score
FROM matches m
JOIN complete_user_profiles u1 ON m.user1_id = u1.id
JOIN complete_user_profiles u2 ON m.user2_id = u2.id
LEFT JOIN islamic_preferences ip1 ON m.user1_id = ip1.user_id
LEFT JOIN islamic_preferences ip2 ON m.user2_id = ip2.user_id
WHERE m.is_active = true;

-- ================================
-- FUNCTIONS FOR MATCHING ALGORITHM
-- ================================

-- Calculate compatibility score between two users
CREATE OR REPLACE FUNCTION calculate_compatibility_score(user1_id UUID, user2_id UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    u1 complete_user_profiles;
    u2 complete_user_profiles;
    ip1 islamic_preferences;
    ip2 islamic_preferences;
    up1 user_preferences;
    up2 user_preferences;
BEGIN
    -- Get user data
    SELECT * INTO u1 FROM complete_user_profiles WHERE id = user1_id;
    SELECT * INTO u2 FROM complete_user_profiles WHERE id = user2_id;
    SELECT * INTO ip1 FROM islamic_preferences WHERE user_id = user1_id;
    SELECT * INTO ip2 FROM islamic_preferences WHERE user_id = user2_id;
    SELECT * INTO up1 FROM user_preferences WHERE user_id = user1_id;
    SELECT * INTO up2 FROM user_preferences WHERE user_id = user2_id;
    
    -- Age compatibility (20 points max)
    IF u2.age BETWEEN up1.age_range_min AND up1.age_range_max 
       AND u1.age BETWEEN up2.age_range_min AND up2.age_range_max THEN
        score := score + 20;
    END IF;
    
    -- Religion level compatibility (25 points max)
    IF ip1.religion_level = ip2.religion_level THEN
        score := score + 25;
    ELSIF ip1.religion_level IN ('practicing', 'moderate') AND ip2.religion_level IN ('practicing', 'moderate') THEN
        score := score + 15;
    END IF;
    
    -- Marriage intention compatibility (30 points max)
    IF (u1.gender = 'male' AND u2.gender = 'female') THEN
        IF (ip1.marriage_intention = 'monogamous' AND ip2.marriage_intention IN ('monogamous', 'accepting_polygamy')) 
           OR (ip1.marriage_intention = 'polygamous' AND ip2.marriage_intention = 'accepting_polygamy') THEN
            score := score + 30;
        END IF;
    END IF;
    
    -- Prayer frequency compatibility (15 points max)
    IF ip1.prayer_frequency = ip2.prayer_frequency THEN
        score := score + 15;
    ELSIF ip1.prayer_frequency IN ('five_times', 'sometimes') AND ip2.prayer_frequency IN ('five_times', 'sometimes') THEN
        score := score + 10;
    END IF;
    
    -- Lifestyle compatibility (10 points max)
    IF ip1.halaal_diet = ip2.halaal_diet THEN
        score := score + 5;
    END IF;
    
    IF ip1.smoking = ip2.smoking THEN
        score := score + 5;
    END IF;
    
    RETURN LEAST(score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql;

-- Find potential matches for a user
CREATE OR REPLACE FUNCTION find_potential_matches(input_user_id UUID, match_limit INTEGER DEFAULT 50)
RETURNS TABLE(
    user_id UUID,
    compatibility_score INTEGER,
    distance_km FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_data AS (
        SELECT u.*, up.*, ip.*, pr.*
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN islamic_preferences ip ON u.id = ip.user_id
        LEFT JOIN user_preferences pr ON u.id = pr.user_id
        WHERE u.id = input_user_id
    ),
    potential_matches AS (
        SELECT 
            target.id,
            target.location,
            target.gender,
            target.date_of_birth,
            EXTRACT(YEAR FROM AGE(target.date_of_birth)) as age
        FROM user_data source
        CROSS JOIN user_profiles target
        WHERE target.user_id != input_user_id
        AND target.user_id NOT IN (
            -- Exclude already swiped users
            SELECT target_user_id FROM swipe_actions WHERE user_id = input_user_id
        )
        AND target.user_id NOT IN (
            -- Exclude already matched users
            SELECT CASE 
                WHEN user1_id = input_user_id THEN user2_id
                ELSE user1_id
            END FROM matches 
            WHERE (user1_id = input_user_id OR user2_id = input_user_id)
            AND is_active = true
        )
        -- Gender preference filter
        AND (source.gender_preference IS NULL OR target.gender = ANY(source.gender_preference))
        -- Age range filter
        AND EXTRACT(YEAR FROM AGE(target.date_of_birth)) BETWEEN source.age_range_min AND source.age_range_max
        -- Distance filter
        AND (source.location IS NULL OR target.location IS NULL OR 
             ST_DWithin(source.location, target.location, source.max_distance_km * 1000))
    )
    SELECT 
        pm.id,
        calculate_compatibility_score(input_user_id, pm.id) as score,
        CASE 
            WHEN ud.location IS NOT NULL AND pm.location IS NOT NULL 
            THEN ST_Distance(ud.location, pm.location) / 1000.0
            ELSE NULL
        END as distance
    FROM potential_matches pm
    CROSS JOIN user_data ud
    ORDER BY score DESC, distance ASC NULLS LAST
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- SAMPLE DATA FOR TESTING
-- ================================

-- Insert sample user for testing
INSERT INTO users (id, email, password_hash) VALUES 
('00000000-0000-0000-0000-000000000001', 'ahmed@example.com', '$2b$12$sample_hash_here'),
('00000000-0000-0000-0000-000000000002', 'fatima@example.com', '$2b$12$sample_hash_here');

-- ================================
-- SECURITY POLICIES (RLS)
-- ================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE islamic_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize based on your auth system)
-- CREATE POLICY "Users can view their own data" ON users FOR ALL USING (auth.uid() = id);
-- CREATE POLICY "Users can view public profile data" ON user_profiles FOR SELECT USING (true);

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON TABLE users IS 'Core user authentication and account data';
COMMENT ON TABLE user_profiles IS 'User profile information including location and basic details';
COMMENT ON TABLE islamic_preferences IS 'Islamic-specific preferences for marriage and religious practice';
COMMENT ON TABLE swipe_actions IS 'User swipe actions for the discovery system';
COMMENT ON TABLE matches IS 'Successful matches between users';
COMMENT ON TABLE chat_rooms IS 'Chat rooms created from matches';
COMMENT ON TABLE messages IS 'Messages sent within chat rooms';

COMMENT ON COLUMN islamic_preferences.marriage_intention IS 'User intention: monogamous, polygamous, or accepting polygamy';
COMMENT ON COLUMN islamic_preferences.seeking_marriage_types IS 'For women: which marriage positions (first, second, etc.) they would accept';
COMMENT ON COLUMN islamic_preferences.current_wives IS 'For men: current number of wives (0-3)';
COMMENT ON COLUMN islamic_preferences.max_wives IS 'For men: maximum desired number of wives (1-4)';
COMMENT ON COLUMN islamic_preferences.accepts_polygamy IS 'For women: willing to be part of polygamous marriage';
COMMENT ON COLUMN islamic_preferences.wants_polygamy IS 'For men: interested in plural marriage';

-- ================================
-- GRANTS (adjust based on your user roles)
-- ================================

-- GRANT USAGE ON SCHEMA public TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
