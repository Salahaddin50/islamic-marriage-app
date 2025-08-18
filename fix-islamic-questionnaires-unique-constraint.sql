-- Fix islamic_questionnaires table to prevent duplicate user records
-- Add unique constraint on user_id to ensure only one questionnaire per user

-- First, check if there are any duplicate records and clean them up
DO $$
BEGIN
    -- Remove duplicate records, keeping only the latest one per user
    DELETE FROM islamic_questionnaires
    WHERE id NOT IN (
        SELECT DISTINCT ON (user_id) id
        FROM islamic_questionnaires
        ORDER BY user_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    );
    
    RAISE NOTICE 'Removed duplicate questionnaire records';
END $$;

-- Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'islamic_questionnaires_user_id_unique' 
        AND table_name = 'islamic_questionnaires'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE islamic_questionnaires 
        ADD CONSTRAINT islamic_questionnaires_user_id_unique UNIQUE (user_id);
        
        RAISE NOTICE 'Added unique constraint on user_id to islamic_questionnaires table';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on islamic_questionnaires.user_id';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding unique constraint: %', SQLERRM;
END $$;

-- Verify the constraint was added
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'islamic_questionnaires' 
    AND tc.constraint_type = 'UNIQUE';
