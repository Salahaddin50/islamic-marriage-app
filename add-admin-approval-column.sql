-- Add admin approval system to user_profiles table
-- This migration adds the approval column and creates admin-related tables

-- Step 1: Add approval column to user_profiles table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'admin_approved'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN admin_approved BOOLEAN DEFAULT NULL;
    
    -- Add comment to explain the column
    COMMENT ON COLUMN user_profiles.admin_approved IS 'Admin approval status: NULL = pending review, TRUE = approved, FALSE = rejected';
  END IF;
END $$;

-- Step 2: Create/Update admin_users table for admin authentication
DO $$ BEGIN
  -- Check if admin_users table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    -- Create new table
    CREATE TABLE admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      profile_picture TEXT,
      is_super_admin BOOLEAN DEFAULT FALSE,
      is_approved BOOLEAN DEFAULT FALSE,
      approved_by UUID REFERENCES admin_users(id),
      approved_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_login TIMESTAMP WITH TIME ZONE
    );
  ELSE
    -- Table exists, check if google_id column exists and drop it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'google_id'
    ) THEN
      -- Drop the google_id column and its constraints
      ALTER TABLE admin_users DROP COLUMN IF EXISTS google_id CASCADE;
    END IF;
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'first_name'
    ) THEN
      ALTER TABLE admin_users ADD COLUMN first_name VARCHAR(100) NOT NULL DEFAULT 'Admin';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'last_name'
    ) THEN
      ALTER TABLE admin_users ADD COLUMN last_name VARCHAR(100) NOT NULL DEFAULT 'User';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'profile_picture'
    ) THEN
      ALTER TABLE admin_users ADD COLUMN profile_picture TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'is_super_admin'
    ) THEN
      ALTER TABLE admin_users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'is_approved'
    ) THEN
      ALTER TABLE admin_users ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'approved_by'
    ) THEN
      ALTER TABLE admin_users ADD COLUMN approved_by UUID REFERENCES admin_users(id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'approved_at'
    ) THEN
      ALTER TABLE admin_users ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'last_login'
    ) THEN
      ALTER TABLE admin_users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
  END IF;
END $$;

-- Step 3: Create admin_sessions table for session management
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Step 4: Create admin_activity_log table for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  target_table VARCHAR(100),
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create subscriptions table for analytics (if not exists)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin_approved ON user_profiles(admin_approved);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender_created ON user_profiles(gender, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at);

-- Step 7: Enable RLS on admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for admin tables (with proper checks)
DO $$ BEGIN
  -- Admin users can only see themselves unless they're super admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'admin_users_select_policy'
  ) THEN
    CREATE POLICY "admin_users_select_policy" ON admin_users
      FOR SELECT USING (
        id = auth.uid()::text::uuid OR 
        EXISTS (
          SELECT 1 FROM admin_users 
          WHERE id = auth.uid()::text::uuid AND is_super_admin = TRUE
        )
      );
  END IF;

  -- Only super admins can insert/update admin users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'admin_users_insert_policy'
  ) THEN
    CREATE POLICY "admin_users_insert_policy" ON admin_users
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM admin_users 
          WHERE id = auth.uid()::text::uuid AND is_super_admin = TRUE
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'admin_users_update_policy'
  ) THEN
    CREATE POLICY "admin_users_update_policy" ON admin_users
      FOR UPDATE USING (
        id = auth.uid()::text::uuid OR
        EXISTS (
          SELECT 1 FROM admin_users 
          WHERE id = auth.uid()::text::uuid AND is_super_admin = TRUE
        )
      );
  END IF;

  -- Admin sessions - users can only see their own sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admin_sessions' AND policyname = 'admin_sessions_policy'
  ) THEN
    CREATE POLICY "admin_sessions_policy" ON admin_sessions
      FOR ALL USING (admin_user_id = auth.uid()::text::uuid);
  END IF;

  -- Admin activity log - users can see their own actions, super admins can see all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admin_activity_log' AND policyname = 'admin_activity_log_select_policy'
  ) THEN
    CREATE POLICY "admin_activity_log_select_policy" ON admin_activity_log
      FOR SELECT USING (
        admin_user_id = auth.uid()::text::uuid OR
        EXISTS (
          SELECT 1 FROM admin_users 
          WHERE id = auth.uid()::text::uuid AND is_super_admin = TRUE
        )
      );
  END IF;
END $$;

-- Step 9: Create function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if the current user is an admin
  IF EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text::uuid) THEN
    INSERT INTO admin_activity_log (
      admin_user_id,
      action,
      target_table,
      target_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid()::text::uuid,
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create triggers for audit logging on sensitive tables
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'user_profiles_admin_audit'
  ) THEN
    CREATE TRIGGER user_profiles_admin_audit
      AFTER INSERT OR UPDATE OR DELETE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION log_admin_activity();
  END IF;
END $$;

-- Step 11: Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create triggers for updated_at columns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'admin_users_updated_at'
  ) THEN
    CREATE TRIGGER admin_users_updated_at
      BEFORE UPDATE ON admin_users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER subscriptions_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Step 13: Insert first super admin (replace with your email)
-- You'll need to register with this email and then run the approval SQL
INSERT INTO admin_users (
  email, 
  first_name, 
  last_name, 
  is_super_admin, 
  is_approved
) VALUES (
  'admin@example.com', -- Replace with your email
  'Super', 
  'Admin', 
  TRUE, 
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- Step 14: Create view for user analytics
CREATE OR REPLACE VIEW admin_user_analytics AS
SELECT 
  DATE(created_at) as date,
  gender,
  COUNT(*) as new_users,
  COUNT(*) FILTER (WHERE admin_approved = TRUE) as approved_users,
  COUNT(*) FILTER (WHERE admin_approved = FALSE) as rejected_users,
  COUNT(*) FILTER (WHERE admin_approved IS NULL) as pending_users
FROM user_profiles
GROUP BY DATE(created_at), gender
ORDER BY date DESC;

-- Step 15: Create view for subscription analytics
CREATE OR REPLACE VIEW admin_subscription_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_subscriptions,
  COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
  SUM(amount) FILTER (WHERE status = 'active') as total_revenue
FROM subscriptions
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON TABLE admin_users IS 'Admin users with Google OAuth authentication';
COMMENT ON TABLE admin_sessions IS 'Admin session management';
COMMENT ON TABLE admin_activity_log IS 'Audit log for admin actions';
COMMENT ON VIEW admin_user_analytics IS 'Daily user registration and approval analytics';
COMMENT ON VIEW admin_subscription_analytics IS 'Daily subscription and revenue analytics';
