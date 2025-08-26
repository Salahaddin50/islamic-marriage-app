-- Check the actual structure of the user_profiles table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Check if there are any existing profiles
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- Check sample data
SELECT id, first_name, last_name, age, gender, city, country 
FROM user_profiles 
LIMIT 5;
