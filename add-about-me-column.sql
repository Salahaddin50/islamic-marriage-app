-- Add about_me column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS about_me TEXT;

-- Create index for text search
CREATE INDEX IF NOT EXISTS idx_user_profiles_about_me
ON user_profiles USING gin(to_tsvector('english', about_me));

-- Update RLS policies to include about_me
DO $$ BEGIN
    -- Update policy for users to update their own profile
    DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
    CREATE POLICY "Users can update their own profile" ON user_profiles
        FOR UPDATE USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
        
EXCEPTION
    WHEN undefined_function THEN 
        RAISE NOTICE 'auth.uid() function not available - skipping RLS policies';
    WHEN duplicate_object THEN 
        RAISE NOTICE 'RLS policies already exist';
END $$;
