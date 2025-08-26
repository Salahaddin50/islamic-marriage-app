-- Add sample user profiles in the exact format as your real data
-- Using correct enum values and structure

-- First, insert sample users (or update if they exist)
INSERT INTO users (id, email, profile_status, is_verified) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'ahmed.hassan@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440002', 'fatima.ali@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440003', 'omar.ibrahim@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440004', 'aisha.mohamed@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440005', 'yusuf.ahmed@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440006', 'zainab.omar@example.com', 'active', true)
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  profile_status = EXCLUDED.profile_status,
  is_verified = EXCLUDED.is_verified;

-- Then, insert their profiles in exact format as your data
INSERT INTO user_profiles (
    user_id, first_name, last_name, gender, date_of_birth, height_cm, weight_kg,
    eye_color, hair_color, skin_tone, body_type, country, city,
    education_level, occupation, monthly_income, social_condition, 
    housing_type, living_condition, phone_code, mobile_number,
    islamic_questionnaire, languages_spoken, profile_picture_url, about_me
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001', 
    'Ahmed', 'Hassan', 'male', '1990-05-15', 175, 75,
    'Brown', 'Black', 'Medium', 'Athletic', 'Egypt', 'Cairo',
    'Bachelor''s Degree', 'Engineer', '85000', 'sufficient', 
    'own_house', 'living_alone', '+20', '1001234567',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": "Full Beard", "covering_level": null, "religious_level": "Very Religious", "prayer_frequency": "All 5 Daily Prayers", "quran_reading_level": "Memorized Significant Portions", "seeking_wife_number": "2", "accepted_wife_positions": null}',
    '{"Arabic", "English"}',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    'Assalamu Alaikum. I am a practicing Muslim engineer looking for a righteous wife to complete my deen.'
),
(
    '550e8400-e29b-41d4-a716-446655440002', 
    'Fatima', 'Ali', 'female', '1992-08-22', 165, 60,
    'Brown', 'Black', 'Fair', 'Slim', 'Turkey', 'Istanbul',
    'Master''s Degree', 'Teacher', null, null, 
    null, 'living_with_parents', '+90', '5551234567',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": null, "covering_level": "hijab", "religious_level": "Very Religious", "prayer_frequency": "All 5 Daily Prayers", "quran_reading_level": "Memorized Significant Portions", "seeking_wife_number": null, "accepted_wife_positions": ["2", "3"]}',
    '{"Turkish", "Arabic", "English"}',
    'https://images.unsplash.com/photo-1494790108755-2616b612b1e5?w=300&h=400&fit=crop',
    'Seeking a practicing Muslim husband who values Islamic principles and family.'
),
(
    '550e8400-e29b-41d4-a716-446655440003', 
    'Omar', 'Ibrahim', 'male', '1988-12-10', 180, 80,
    'Hazel', 'Dark Brown', 'Olive', 'Average', 'UAE', 'Dubai',
    'Bachelor''s Degree', 'Business Owner', '150000', 'rich', 
    'own_house', 'living_alone', '+971', '501234567',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": "Trimmed Beard", "covering_level": null, "religious_level": "Very Religious", "prayer_frequency": "Most Prayers", "quran_reading_level": "Basic Reading", "seeking_wife_number": "3", "accepted_wife_positions": null}',
    '{"Arabic", "English", "Urdu"}',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop',
    'Business owner seeking a kind and religious wife to join our family.'
),
(
    '550e8400-e29b-41d4-a716-446655440004', 
    'Aisha', 'Mohamed', 'female', '1995-03-18', 160, 55,
    'Black', 'Black', 'Very Dark', 'Curvy', 'UK', 'London',
    'PhD/Doctorate', 'Doctor', '95000', 'sufficient', 
    'rent_apartment', 'living_alone', '+44', '7701234567',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": null, "covering_level": "niqab", "religious_level": "Very Religious", "prayer_frequency": "All 5 Daily Prayers", "quran_reading_level": "Memorized Significant Portions", "seeking_wife_number": null, "accepted_wife_positions": ["1"]}',
    '{"English", "Arabic", "French"}',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop',
    'Doctor seeking a righteous husband who follows the Sunnah completely.'
),
(
    '550e8400-e29b-41d4-a716-446655440005', 
    'Yusuf', 'Ahmed', 'male', '1987-09-25', 178, 78,
    'Green', 'Light Brown', 'Fair', 'Athletic', 'Canada', 'Toronto',
    'Master''s Degree', 'Software Engineer', '120000', 'very_rich', 
    'own_house', 'living_alone', '+1', '4161234567',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": "Full Beard", "covering_level": null, "religious_level": "Very Religious", "prayer_frequency": "All 5 Daily Prayers", "quran_reading_level": "Memorized Significant Portions", "seeking_wife_number": "4", "accepted_wife_positions": null}',
    '{"English", "Arabic", "French"}',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop',
    'Software engineer seeking multiple wives according to Islamic teachings.'
),
(
    '550e8400-e29b-41d4-a716-446655440006', 
    'Zainab', 'Omar', 'female', '1993-11-07', 168, 65,
    'Brown', 'Dark Brown', 'Medium', 'Average', 'Australia', 'Sydney',
    'Bachelor''s Degree', 'Nurse', '65000', 'sufficient', 
    'rent_apartment', 'living_with_parents', '+61', '0451234567',
    '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": null, "covering_level": "hijab", "religious_level": "Religious", "prayer_frequency": "Most Prayers", "quran_reading_level": "Basic Reading", "seeking_wife_number": null, "accepted_wife_positions": ["2", "3", "4"]}',
    '{"English", "Arabic"}',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
    'Nurse seeking a practicing Muslim husband. Open to polygamous marriage.'
);
