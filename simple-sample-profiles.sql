-- Add simple sample user profiles for testing
-- Only using basic fields that definitely exist

-- First, insert sample users
INSERT INTO users (id, email, profile_status, is_verified) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'ahmed.hassan@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440002', 'fatima.ali@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440003', 'omar.ibrahim@example.com', 'active', true),
('550e8400-e29b-41d4-a716-446655440004', 'aisha.mohamed@example.com', 'active', true)
ON CONFLICT (email) DO NOTHING;

-- Then, insert their profiles with minimal required fields
INSERT INTO user_profiles (
    user_id, first_name, last_name, gender, date_of_birth, age, height_cm, 
    city, country
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001', 
    'Ahmed', 'Hassan', 'male', '1990-05-15', 34, 175, 
    'Cairo', 'Egypt'
),
(
    '550e8400-e29b-41d4-a716-446655440002', 
    'Fatima', 'Ali', 'female', '1992-08-22', 32, 165, 
    'Istanbul', 'Turkey'
),
(
    '550e8400-e29b-41d4-a716-446655440003', 
    'Omar', 'Ibrahim', 'male', '1988-12-10', 35, 180, 
    'Dubai', 'UAE'
),
(
    '550e8400-e29b-41d4-a716-446655440004', 
    'Aisha', 'Mohamed', 'female', '1995-03-18', 29, 160, 
    'London', 'UK'
)
ON CONFLICT (user_id) DO NOTHING;
