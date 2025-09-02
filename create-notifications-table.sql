-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_age INTEGER,
  type TEXT NOT NULL CHECK (type IN (
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
    'message_received'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
    DROP POLICY "Users can view their own notifications" ON notifications;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can create notifications') THEN
    DROP POLICY "Users can create notifications" ON notifications;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
    DROP POLICY "Users can update their own notifications" ON notifications;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can delete their own notifications') THEN
    DROP POLICY "Users can delete their own notifications" ON notifications;
  END IF;
END $$;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only create notifications (for sending to others)
CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure idempotency for the update timestamp trigger
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;

CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO anon;

-- ================================
-- Server-side notifications
-- Create notifications when interests/meet requests change
-- ================================

-- Helper to safely build display name
CREATE OR REPLACE FUNCTION public._display_name(first_name TEXT, last_name TEXT)
RETURNS TEXT AS $$
  SELECT trim(concat_ws(' ', COALESCE(first_name, 'Someone'), NULLIF(last_name, '')));
$$ LANGUAGE sql IMMUTABLE;

-- Interest: on INSERT (pending) → notify receiver (photo_request)
CREATE OR REPLACE FUNCTION public.notify_interest_insert()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT first_name, last_name, age INTO prof FROM user_profiles WHERE user_id = NEW.sender_id;
    name := public._display_name(prof.first_name, prof.last_name);
    INSERT INTO notifications(user_id, sender_id, sender_name, sender_age, type, title, message)
    VALUES (
      NEW.receiver_id,
      NEW.sender_id,
      name,
      prof.age,
      'photo_request',
      'Photo Request',
      concat(name, ', ', COALESCE(prof.age::text, ''), ' requests your photo')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Interest: on UPDATE → accepted → notify original sender (photo_shared)
CREATE OR REPLACE FUNCTION public.notify_interest_update()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  name TEXT;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT first_name, last_name, age INTO prof FROM user_profiles WHERE user_id = NEW.receiver_id;
    name := public._display_name(prof.first_name, prof.last_name);
    INSERT INTO notifications(user_id, sender_id, sender_name, sender_age, type, title, message)
    VALUES (
      NEW.sender_id,
      NEW.receiver_id,
      name,
      prof.age,
      'photo_shared',
      'Photos Shared',
      concat(name, ', ', COALESCE(prof.age::text, ''), ' has shared photos with you')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Meet: on INSERT (pending) → notify receiver (video_call_request)
CREATE OR REPLACE FUNCTION public.notify_meet_insert()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT first_name, last_name, age INTO prof FROM user_profiles WHERE user_id = NEW.sender_id;
    name := public._display_name(prof.first_name, prof.last_name);
    INSERT INTO notifications(user_id, sender_id, sender_name, sender_age, type, title, message)
    VALUES (
      NEW.receiver_id,
      NEW.sender_id,
      name,
      prof.age,
      'video_call_request',
      'Video Call Request',
      concat(name, ', ', COALESCE(prof.age::text, ''), ' requests a video call')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Meet: on UPDATE → accepted → notify original sender (video_call_approved)
CREATE OR REPLACE FUNCTION public.notify_meet_update()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  name TEXT;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT first_name, last_name, age INTO prof FROM user_profiles WHERE user_id = NEW.receiver_id;
    name := public._display_name(prof.first_name, prof.last_name);
    INSERT INTO notifications(user_id, sender_id, sender_name, sender_age, type, title, message)
    VALUES (
      NEW.sender_id,
      NEW.receiver_id,
      name,
      prof.age,
      'video_call_approved',
      'Video Call Approved',
      concat(name, ', ', COALESCE(prof.age::text, ''), ' approved your video call request')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if present to avoid duplicates
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_interests_insert_notify') THEN
    DROP TRIGGER tr_interests_insert_notify ON interests;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_interests_update_notify') THEN
    DROP TRIGGER tr_interests_update_notify ON interests;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_meet_insert_notify') THEN
    DROP TRIGGER tr_meet_insert_notify ON meet_requests;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_meet_update_notify') THEN
    DROP TRIGGER tr_meet_update_notify ON meet_requests;
  END IF;
END $$;

-- Create triggers
CREATE TRIGGER tr_interests_insert_notify
AFTER INSERT ON interests
FOR EACH ROW EXECUTE FUNCTION public.notify_interest_insert();

CREATE TRIGGER tr_interests_update_notify
AFTER UPDATE ON interests
FOR EACH ROW EXECUTE FUNCTION public.notify_interest_update();

CREATE TRIGGER tr_meet_insert_notify
AFTER INSERT ON meet_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_meet_insert();

CREATE TRIGGER tr_meet_update_notify
AFTER UPDATE ON meet_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_meet_update();

-- Message Requests: on INSERT (pending) → notify receiver (whatsapp_request)
CREATE OR REPLACE FUNCTION public.notify_message_insert()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT first_name, last_name, age INTO prof FROM user_profiles WHERE user_id = NEW.sender_id;
    name := public._display_name(prof.first_name, prof.last_name);
    INSERT INTO notifications(user_id, sender_id, sender_name, sender_age, type, title, message)
    VALUES (
      NEW.receiver_id,
      NEW.sender_id,
      name,
      prof.age,
      'whatsapp_request',
      'WhatsApp Request',
      concat(name, ', ', COALESCE(prof.age::text, ''), ' requests your whatsapp number')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Message Requests: on UPDATE → accepted → notify original sender (whatsapp_shared)
CREATE OR REPLACE FUNCTION public.notify_message_update()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  name TEXT;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT first_name, last_name, age INTO prof FROM user_profiles WHERE user_id = NEW.receiver_id;
    name := public._display_name(prof.first_name, prof.last_name);
    INSERT INTO notifications(user_id, sender_id, sender_name, sender_age, type, title, message)
    VALUES (
      NEW.sender_id,
      NEW.receiver_id,
      name,
      prof.age,
      'whatsapp_shared',
      'WhatsApp Shared',
      concat(name, ', ', COALESCE(prof.age::text, ''), ' has shared whatsapp number')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exist then create triggers for message_requests
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_message_insert_notify') THEN
    DROP TRIGGER tr_message_insert_notify ON message_requests;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_message_update_notify') THEN
    DROP TRIGGER tr_message_update_notify ON message_requests;
  END IF;
END $$;

CREATE TRIGGER tr_message_insert_notify
AFTER INSERT ON message_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_message_insert();

CREATE TRIGGER tr_message_update_notify
AFTER UPDATE ON message_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_message_update();
