-- remove-constraint.sql
-- This script simply removes the foreign key constraint without adding a new one
-- Use this if you just want to get the app working without foreign key validation

-- Drop the existing foreign key constraint
ALTER TABLE media_references 
DROP CONSTRAINT IF EXISTS media_references_user_id_fkey;

-- Also try with the actual constraint name from the error message
ALTER TABLE media_references 
DROP CONSTRAINT IF EXISTS fk_media_user;

-- Confirm the constraint is removed
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS referenced_table,
  af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE contype = 'f' AND conrelid = 'media_references'::regclass;
