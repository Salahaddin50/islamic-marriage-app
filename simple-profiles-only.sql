-- Simple approach: Just add profiles to existing users
-- First check if there are any users in the database
DO $$
DECLARE
    user_count INTEGER;
    sample_users UUID[];
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM users;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No users found in database. Please create some users first through the app registration.';
    ELSE
        -- Get up to 6 existing user IDs
        SELECT ARRAY(SELECT id FROM users LIMIT 6) INTO sample_users;
        
        -- Delete any existing sample profiles to avoid conflicts
        DELETE FROM user_profiles WHERE first_name IN ('Ahmed', 'Fatima', 'Omar', 'Aisha', 'Yusuf', 'Zainab');
        
        -- Insert sample profiles using existing user IDs
        IF array_length(sample_users, 1) >= 1 THEN
            INSERT INTO user_profiles (
                user_id, first_name, last_name, gender, date_of_birth, height_cm, weight_kg,
                eye_color, hair_color, skin_tone, body_type, country, city,
                education_level, occupation, monthly_income, social_condition, 
                housing_type, living_condition, phone_code, mobile_number,
                islamic_questionnaire, languages_spoken, profile_picture_url, about_me
            ) VALUES (
                sample_users[1], 
                'Ahmed', 'Hassan', 'male', '1990-05-15', 175, 75,
                'Brown', 'Black', 'Medium', 'Athletic', 'Egypt', 'Cairo',
                'Bachelor''s Degree', 'Engineer', '85000', 'sufficient', 
                'own_house', 'living_alone', '+20', '1001234567',
                '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": "Full Beard", "covering_level": null, "religious_level": "Very Religious", "prayer_frequency": "All 5 Daily Prayers", "quran_reading_level": "Memorized Significant Portions", "seeking_wife_number": "2", "accepted_wife_positions": null}',
                '{"Arabic", "English"}',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
                'Assalamu Alaikum. I am a practicing Muslim engineer looking for a righteous wife to complete my deen.'
            );
        END IF;
        
        IF array_length(sample_users, 1) >= 2 THEN
            INSERT INTO user_profiles (
                user_id, first_name, last_name, gender, date_of_birth, height_cm, weight_kg,
                eye_color, hair_color, skin_tone, body_type, country, city,
                education_level, occupation, monthly_income, social_condition, 
                housing_type, living_condition, phone_code, mobile_number,
                islamic_questionnaire, languages_spoken, profile_picture_url, about_me
            ) VALUES (
                sample_users[2], 
                'Fatima', 'Ali', 'female', '1992-08-22', 165, 60,
                'Brown', 'Black', 'Fair', 'Slim', 'Turkey', 'Istanbul',
                'Master''s Degree', 'Teacher', null, null, 
                null, 'living_with_parents', '+90', '5551234567',
                '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": null, "covering_level": "hijab", "religious_level": "Very Religious", "prayer_frequency": "All 5 Daily Prayers", "quran_reading_level": "Memorized Significant Portions", "seeking_wife_number": null, "accepted_wife_positions": ["2", "3"]}',
                '{"Turkish", "Arabic", "English"}',
                'https://images.unsplash.com/photo-1494790108755-2616b612b1e5?w=300&h=400&fit=crop',
                'Seeking a practicing Muslim husband who values Islamic principles and family.'
            );
        END IF;
        
        IF array_length(sample_users, 1) >= 3 THEN
            INSERT INTO user_profiles (
                user_id, first_name, last_name, gender, date_of_birth, height_cm, weight_kg,
                eye_color, hair_color, skin_tone, body_type, country, city,
                education_level, occupation, monthly_income, social_condition, 
                housing_type, living_condition, phone_code, mobile_number,
                islamic_questionnaire, languages_spoken, profile_picture_url, about_me
            ) VALUES (
                sample_users[3], 
                'Omar', 'Ibrahim', 'male', '1988-12-10', 180, 80,
                'Hazel', 'Dark Brown', 'Olive', 'Average', 'UAE', 'Dubai',
                'Bachelor''s Degree', 'Business Owner', '150000', 'rich', 
                'own_house', 'living_alone', '+971', '501234567',
                '{"created_at": "2025-01-15T10:00:00.000Z", "updated_at": "2025-01-15T10:00:00.000Z", "beard_practice": "Trimmed Beard", "covering_level": null, "religious_level": "Very Religious", "prayer_frequency": "Most Prayers", "quran_reading_level": "Basic Reading", "seeking_wife_number": "3", "accepted_wife_positions": null}',
                '{"Arabic", "English", "Urdu"}',
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop',
                'Business owner seeking a kind and religious wife to join our family.'
            );
        END IF;
        
        RAISE NOTICE 'Sample profiles added successfully using % existing users', array_length(sample_users, 1);
    END IF;
END $$;
