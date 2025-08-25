-- Fix the trigger for media_references table

-- First, create the update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Check if updated_at column exists and fix the trigger
DO $$ 
BEGIN
    -- Check if updated_at column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'media_references' 
        AND column_name = 'updated_at'
    ) THEN
        -- Drop the existing trigger if it exists
        DROP TRIGGER IF EXISTS update_media_references_updated_at ON media_references;
        
        -- Create a proper trigger with BEFORE INSERT OR UPDATE
        CREATE TRIGGER update_media_references_updated_at
        BEFORE INSERT OR UPDATE ON media_references
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Trigger updated successfully';
    ELSE
        -- If updated_at column doesn't exist, add it
        ALTER TABLE media_references ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Create the trigger
        DROP TRIGGER IF EXISTS update_media_references_updated_at ON media_references;
        CREATE TRIGGER update_media_references_updated_at
        BEFORE INSERT OR UPDATE ON media_references
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Column added and trigger created successfully';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;
