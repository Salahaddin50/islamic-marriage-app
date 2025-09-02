-- Adds a visibility flag to user profiles
-- Run this on your Supabase/Postgres database

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;

-- Ensure existing rows get a concrete value
UPDATE user_profiles SET is_public = TRUE WHERE is_public IS NULL;
