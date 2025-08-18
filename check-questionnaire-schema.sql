-- Check the actual schema of islamic_questionnaires table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'islamic_questionnaires' 
ORDER BY ordinal_position;

-- Also check a sample of data to see what columns actually have data
SELECT * FROM islamic_questionnaires LIMIT 3;
