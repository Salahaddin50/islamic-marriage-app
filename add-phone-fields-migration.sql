-- Migration to add phone code and mobile number fields to user_profiles table

-- Add phone_code and mobile_number columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20);

-- Add comments for clarity
COMMENT ON COLUMN user_profiles.phone_code IS 'International phone code (e.g., +1, +44, +92)';
COMMENT ON COLUMN user_profiles.mobile_number IS 'Mobile/cell phone number without country code';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_code ON user_profiles(phone_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_mobile_number ON user_profiles(mobile_number);

-- Verification query to check if columns were added successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' 
-- AND column_name IN ('phone_code', 'mobile_number');
