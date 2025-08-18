-- CREATE ISLAMIC QUESTIONNAIRES TABLE
-- Run this in Supabase SQL Editor to fix the missing table

-- Create islamic_questionnaires table
CREATE TABLE IF NOT EXISTS islamic_questionnaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Religious practice questions
    religious_level VARCHAR(100),
    prayer_frequency VARCHAR(100),
    quran_reading_level VARCHAR(100),
    hijab_practice VARCHAR(100), -- For females (legacy)
    covering_level VARCHAR(100), -- For females (new)
    beard_practice VARCHAR(100), -- For males
    
    -- Polygamy preferences
    seeking_wife_number VARCHAR(20), -- For males
    accepted_wife_positions TEXT[], -- For females
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE islamic_questionnaires ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own questionnaire" ON islamic_questionnaires
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_islamic_questionnaires_user_id ON islamic_questionnaires(user_id);

-- Add comments
COMMENT ON TABLE islamic_questionnaires IS 'Islamic questionnaire responses for dating profiles';

-- Verify table creation
SELECT 'islamic_questionnaires table created successfully' as status;
