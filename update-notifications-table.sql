-- Update notifications table to support profile_approved type
-- First, check if the constraint exists and drop it
DO $$ 
BEGIN
    -- Drop the existing check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_type_check' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    END IF;
END $$;

-- Add the new check constraint with profile_approved included
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'photo_request',
    'photo_shared',
    'video_call_request', 
    'video_call_approved',
    'whatsapp_request',
    'whatsapp_shared',
    'interest_received',
    'interest_accepted',
    'meet_request_received',
    'meet_request_accepted',
    'message_received',
    'profile_approved'
));

-- Create a system admin user entry in auth.users if it doesn't exist
-- This is needed for the foreign key constraint
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@system.local',
    '$2a$10$dummy.hash.for.system.admin.user.that.cannot.login',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "system", "providers": ["system"]}',
    '{"name": "System Admin"}',
    false,
    'authenticated'
) ON CONFLICT (id) DO NOTHING;
