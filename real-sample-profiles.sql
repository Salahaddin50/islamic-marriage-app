-- Add sample user profiles based on your actual database structure
-- Using the exact format from your data

-- First, insert sample users
INSERT INTO users (id, email, profile_status, is_verified) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'ahmed.hassan@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440002', 'fatima.ali@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440003', 'omar.ibrahim@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440004', 'aisha.mohamed@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440005', 'yusuf.ahmed@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440006', 'zainab.omar@example.com', 'active', true)
ON CONFLICT (email) DO NOTHING;

-- Then, insert their profiles with the correct schema structure
INSERT INTO user_profiles (
    user_id, first_name, last_name, gender, date_of_birth, height_cm, weight_kg,
    eye_color, hair_color, skin_tone, body_type, country, city,
    education_level, occupation, social_condition, living_condition,
    islamic_questionnaire, languages_spoken, profile_picture_url, about_me
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001', 
    'Ahmed', 'Hassan', 'male', '1990-05-15', 175, 75,
    'brown', 'black', 'medium', 'athletic', 'Egypt', 'Cairo',
    'bachelor', 'Engineer', 'sufficient', 'living_alone',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": "Full Beard", "religious_level": "Very Religious", "prayer_frequency": "All 5 Daily Prayers", "quran_reading_level": "Memorized Significant Portions", "seeking_wife_number": "2"}',
    '["Arabic", "English"]',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    'Assalamu Alaikum. I am a practicing Muslim looking for a righteous wife.'
),
(
    '550e8400-e29b-41d4-a716-446655440002', 
    'Fatima', 'Ali', 'female', '1992-08-22', 165, 60,
    'brown', 'black', 'fair', 'slim', 'Turkey', 'Istanbul',
    'master', 'Teacher', 'sufficient', 'living_with_parents',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "covering_level": "hijab", "religious_level": "Very Religious", "prayer_frequency": "All 5 Daily Prayers", "quran_reading_level": "Memorized Significant Portions", "accepted_wife_positions": ["2", "3"]}',
    '["Turkish", "Arabic", "English"]',
    'https://images.unsplash.com/photo-1494790108755-2616b612b1e5?w=300&h=400&fit=crop',
    'Seeking a practicing Muslim husband who values Islamic principles.'
),
(
    '550e8400-e29b-41d4-a716-446655440003', 
    'Omar', 'Ibrahim', 'male', '1988-12-10', 180, 80,
    'hazel', 'dark_brown', 'olive', 'average', 'UAE', 'Dubai',
    'bachelor', 'Business Owner', 'rich', 'living_alone',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": "Trimmed Beard", "religious_level": "Very Religious", "prayer_frequency": "Most Prayers", "quran_reading_level": "Basic Reading", "seeking_wife_number": "3"}',
    '["Arabic", "English", "Urdu"]',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop',
    'Business owner seeking a kind and religious wife.'
),
(
    '550e8400-e29b-41d4-a716-446655440004', 
    'Aisha', 'Mohamed', 'female', '1995-03-18', 160, 55,
    'black', 'black', 'dark', 'curvy', 'UK', 'London',
    'bachelor', 'Doctor', 'sufficient', 'living_alone',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "covering_level": "niqab", "religious_level": "Very Religious", "prayer_frequency": "All 5 Daily Prayers", "quran_reading_level": "Memorized Significant Portions", "accepted_wife_positions": ["1"]}',
    '["English", "Arabic", "French"]',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop',
    'Doctor seeking a righteous husband who follows the Sunnah.'
),
(
    '550e8400-e29b-41d4-a716-446655440005', 
    'Yusuf', 'Ahmed', 'male', '1987-09-25', 178, 78,
    'green', 'light_brown', 'fair', 'athletic', 'Canada', 'Toronto',
    'master', 'Software Engineer', 'very_rich', 'living_alone',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": "Full Beard", "religious_level": "Very Religious", "prayer_frequency": "All 5 Daily Prayers", "quran_reading_level": "Memorized Significant Portions", "seeking_wife_number": "4"}',
    '["English", "Arabic", "French"]',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop',
    'Software engineer seeking multiple wives according to Islamic teachings.'
),
(
    '550e8400-e29b-41d4-a716-446655440006', 
    'Zainab', 'Omar', 'female', '1993-11-07', 168, 65,
    'brown', 'dark_brown', 'medium', 'average', 'Australia', 'Sydney',
    'bachelor', 'Nurse', 'sufficient', 'living_with_parents',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "covering_level": "hijab", "religious_level": "Religious", "prayer_frequency": "Most Prayers", "quran_reading_level": "Basic Reading", "accepted_wife_positions": ["2", "3", "4"]}',
    '["English", "Arabic"]',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
    'Nurse seeking a practicing Muslim husband. Open to polygamous marriage.'
)
ON CONFLICT (user_id) DO NOTHING;
