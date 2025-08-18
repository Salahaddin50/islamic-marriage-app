-- ============================================================================
-- FIX DATABASE FOR MEDIA REFERENCES TABLE
-- ============================================================================
-- This script will create the media_references table if it doesn't exist
-- and add DigitalOcean specific columns

-- Create custom types if they don't exist
DO $$ BEGIN
    CREATE TYPE verification_status_type AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create media_references table if it doesn't exist
CREATE TABLE IF NOT EXISTS media_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    media_type VARCHAR(20) NOT NULL, -- 'photo', 'video'
    external_url VARCHAR(500) NOT NULL, -- URL to external media server
    thumbnail_url VARCHAR(500), -- Thumbnail URL for videos
    media_order INTEGER DEFAULT 1, -- Order of display
    is_profile_picture BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE, -- For photo verification
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    
    -- Privacy settings
    visibility_level VARCHAR(20) DEFAULT 'private', -- 'public', 'private', 'matched_only'
    
    -- DigitalOcean specific columns
    do_spaces_key VARCHAR(500),
    do_spaces_url VARCHAR(500),
    do_spaces_cdn_url VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint if users table exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE media_references 
        ADD CONSTRAINT fk_media_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_references_user_id 
ON media_references(user_id);

CREATE INDEX IF NOT EXISTS idx_media_references_user_type 
ON media_references(user_id, media_type);

CREATE INDEX IF NOT EXISTS idx_media_references_profile_pic 
ON media_references(user_id, is_profile_picture) WHERE is_profile_picture = true;

CREATE INDEX IF NOT EXISTS idx_media_references_do_key 
ON media_references(do_spaces_key);

CREATE INDEX IF NOT EXISTS idx_media_references_order 
ON media_references(user_id, media_type, media_order);

-- Enable Row Level Security
ALTER TABLE media_references ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (if auth.uid() function exists)
DO $$ BEGIN
    -- Policy for users to see their own media
    CREATE POLICY "Users can view their own media" ON media_references
        FOR SELECT USING (user_id = auth.uid());
    
    -- Policy for users to insert their own media
    CREATE POLICY "Users can insert their own media" ON media_references
        FOR INSERT WITH CHECK (user_id = auth.uid());
    
    -- Policy for users to update their own media
    CREATE POLICY "Users can update their own media" ON media_references
        FOR UPDATE USING (user_id = auth.uid());
    
    -- Policy for users to delete their own media
    CREATE POLICY "Users can delete their own media" ON media_references
        FOR DELETE USING (user_id = auth.uid());
        
EXCEPTION
    WHEN undefined_function THEN 
        RAISE NOTICE 'auth.uid() function not available - skipping RLS policies';
    WHEN duplicate_object THEN 
        RAISE NOTICE 'RLS policies already exist';
END $$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_media_references_updated_at ON media_references;
CREATE TRIGGER update_media_references_updated_at
    BEFORE UPDATE ON media_references
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT 'media_references table created successfully' as status;
