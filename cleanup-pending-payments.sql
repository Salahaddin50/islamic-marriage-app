-- Clean up pending payment records that were created during testing
-- Run this in Supabase SQL Editor to remove old pending records

-- First, let's see what pending records exist
SELECT 
    id, 
    user_id, 
    package_name, 
    amount, 
    status, 
    payment_method,
    created_at
FROM payment_records 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Uncomment the line below to DELETE all pending records
-- (Only run this if you're sure these are test records)
-- DELETE FROM payment_records WHERE status = 'pending';

-- Alternative: Update pending records to 'failed' if you want to keep the history
-- UPDATE payment_records SET status = 'failed', notes = 'Cleaned up old pending record' WHERE status = 'pending';









