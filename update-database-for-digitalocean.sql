-- ============================================================================
-- UPDATE DATABASE FOR DIGITALOCEAN SPACES INTEGRATION
-- ============================================================================
-- Add DigitalOcean specific columns to media_references table

-- Add DigitalOcean columns if they don't exist
ALTER TABLE media_references 
ADD COLUMN IF NOT EXISTS do_spaces_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS do_spaces_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS do_spaces_cdn_url VARCHAR(500);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_references_do_key 
ON media_references(do_spaces_key);

CREATE INDEX IF NOT EXISTS idx_media_references_user_type 
ON media_references(user_id, media_type);

CREATE INDEX IF NOT EXISTS idx_media_references_profile_pic 
ON media_references(user_id, is_profile_picture) WHERE is_profile_picture = true;

-- Update any existing policies to include new columns
-- (Run this if you have Row Level Security enabled)
-- DROP POLICY IF EXISTS "Users can manage their own media" ON media_references;
-- CREATE POLICY "Users can manage their own media" ON media_references
--   FOR ALL USING (auth.uid() = user_id);

-- Verify the changes
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'media_references' 
-- AND table_schema = 'public'
-- ORDER BY ordinal_position;
