-- Add sample user profiles for testing
-- These can be removed once real users start registering

-- First, insert sample users
INSERT INTO users (id, email, profile_status, is_verified) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'ahmed.hassan@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440002', 'fatima.ali@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440003', 'omar.ibrahim@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440004', 'aisha.mohamed@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440005', 'yusuf.ahmed@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440006', 'zainab.omar@example.com', 'active', true)
ON CONFLICT (email) DO NOTHING;

-- Then, insert their profiles (using only basic required fields)
INSERT INTO user_profiles (
    user_id, first_name, last_name, gender, date_of_birth, age, height_cm, 
    city, country, marital_status, has_children, number_of_children, 
    wants_children
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001', 
    'Ahmed', 'Hassan', 'male', '1990-05-15', 34, 175, 
    'Cairo', 'Egypt', 'never_married', false, 0, 
    true
),
(
    '550e8400-e29b-41d4-a716-446655440002', 
    'Fatima', 'Ali', 'female', '1992-08-22', 32, 165, 
    'Istanbul', 'Turkey', 'never_married', false, 0, 
    true
),
(
    '550e8400-e29b-41d4-a716-446655440003', 
    'Omar', 'Ibrahim', 'male', '1988-12-10', 35, 180, 
    'Dubai', 'UAE', 'never_married', false, 0, 
    true
),
(
    '550e8400-e29b-41d4-a716-446655440004', 
    'Aisha', 'Mohamed', 'female', '1995-03-18', 29, 160, 
    'London', 'UK', 'never_married', false, 0, 
    true
),
(
    '550e8400-e29b-41d4-a716-446655440005', 
    'Yusuf', 'Ahmed', 'male', '1987-09-25', 37, 178, 
    'Toronto', 'Canada', 'never_married', false, 0, 
    true
),
(
    '550e8400-e29b-41d4-a716-446655440006', 
    'Zainab', 'Omar', 'female', '1993-11-07', 31, 168, 
    'Sydney', 'Australia', 'never_married', false, 0, 
    true
)
ON CONFLICT (user_id) DO NOTHING;

-- Add some media references for profile pictures (using placeholder URLs)
INSERT INTO media_references (
    user_id, media_type, external_url, is_profile_picture, 
    visibility_level, created_at
) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'photo', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop', true, 'public', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'photo', 'https://images.unsplash.com/photo-1494790108755-2616b612b1e5?w=300&h=400&fit=crop', true, 'public', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'photo', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop', true, 'public', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'photo', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop', true, 'public', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'photo', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop', true, 'public', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'photo', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop', true, 'public', NOW())
ON CONFLICT (user_id, media_type, is_profile_picture) DO NOTHING;
