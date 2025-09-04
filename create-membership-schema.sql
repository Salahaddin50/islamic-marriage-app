-- MEMBERSHIP PACKAGES AND PAYMENTS SCHEMA
-- Run this in Supabase SQL Editor to create the membership system

-- Create package types enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'package_type') THEN
    CREATE TYPE package_type AS ENUM ('premium', 'vip_premium', 'golden_premium');
  END IF;
END $$;

-- Create payment status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
END $$;

-- Create payment method enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('manual', 'paypal', 'stripe', 'bank_transfer');
  END IF;
END $$;

-- Create user_packages table to track current user memberships
CREATE TABLE IF NOT EXISTS user_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_type package_type NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_lifetime BOOLEAN DEFAULT TRUE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL for lifetime packages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active package per user
    CONSTRAINT unique_active_package UNIQUE(user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create payment_records table to track all payment transactions
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_type package_type NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'pending',
    payment_method payment_method DEFAULT 'manual',
    
    -- Payment gateway details
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Metadata
    notes TEXT,
    processed_by UUID REFERENCES auth.users(id), -- Admin who processed manual payments
    processed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure payment_details JSONB column exists for one-line item metadata
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_records' AND column_name = 'payment_details'
  ) THEN
    ALTER TABLE payment_records ADD COLUMN payment_details JSONB;
  END IF;
END $$;

-- Ensure complaints JSONB column exists for recording user complaints per payment
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_records' AND column_name = 'complaints'
  ) THEN
    ALTER TABLE payment_records ADD COLUMN complaints JSONB;
    ALTER TABLE payment_records ALTER COLUMN complaints SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Optional helpful index for querying by fields inside payment_details
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname = 'idx_payment_records_payment_details' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_payment_records_payment_details ON payment_records USING GIN (payment_details);
  END IF;
END $$;

-- Optional helpful index for querying by fields inside complaints
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname = 'idx_payment_records_complaints' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_payment_records_complaints ON payment_records USING GIN (complaints);
  END IF;
END $$;

-- Create package_features table for dynamic feature management
CREATE TABLE IF NOT EXISTS package_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_type package_type NOT NULL,
    feature_name VARCHAR(200) NOT NULL,
    feature_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(package_type, feature_name)
);

-- Insert default package features
INSERT INTO package_features (package_type, feature_name, sort_order) VALUES
-- Premium features
('premium', 'Lifetime subscription till marriage', 1),
('premium', 'Arrange video call', 2),
('premium', 'Request whatsapp number', 3),

-- VIP Premium features
('vip_premium', 'All Premium Features', 1),
('vip_premium', '24/7 facilitation and convincing support', 2),

-- Golden Premium features
('golden_premium', 'All VIP Premium features', 1),
('golden_premium', 'Just Relax, we will reach you in your whatsapp and marry you', 2)

ON CONFLICT (package_type, feature_name) DO NOTHING;

-- Create crown_colors table for package crown colors
CREATE TABLE IF NOT EXISTS crown_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_type package_type UNIQUE NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    color_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert crown colors
INSERT INTO crown_colors (package_type, color_hex, color_name) VALUES
('premium', '#4285F4', 'Blue'),
('vip_premium', '#34A853', 'Green'),
('golden_premium', '#FFD700', 'Gold')
ON CONFLICT (package_type) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE crown_colors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_packages (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_packages' AND policyname='Users can view own packages'
  ) THEN
    CREATE POLICY "Users can view own packages" ON user_packages
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_packages' AND policyname='Users can insert own packages'
  ) THEN
    CREATE POLICY "Users can insert own packages" ON user_packages
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_packages' AND policyname='Users can update own packages'
  ) THEN
    CREATE POLICY "Users can update own packages" ON user_packages
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for payment_records (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_records' AND policyname='Users can view own payment records'
  ) THEN
    CREATE POLICY "Users can view own payment records" ON payment_records
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_records' AND policyname='Users can insert own payment records'
  ) THEN
    CREATE POLICY "Users can insert own payment records" ON payment_records
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_records' AND policyname='Users can update own payment records'
  ) THEN
    CREATE POLICY "Users can update own payment records" ON payment_records
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for package_features (read-only for users) (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='package_features' AND policyname='Anyone can view package features'
  ) THEN
    CREATE POLICY "Anyone can view package features" ON package_features
      FOR SELECT USING (true);
  END IF;
END $$;

-- RLS Policies for crown_colors (read-only for users) (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crown_colors' AND policyname='Anyone can view crown colors'
  ) THEN
    CREATE POLICY "Anyone can view crown colors" ON crown_colors
      FOR SELECT USING (true);
  END IF;
END $$;

-- Create indexes for better performance (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname = 'idx_user_packages_user_id' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_user_packages_user_id ON user_packages(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname = 'idx_user_packages_active' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_user_packages_active ON user_packages(user_id, is_active) WHERE is_active = true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname = 'idx_payment_records_user_id' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_payment_records_user_id ON payment_records(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname = 'idx_payment_records_status' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_payment_records_status ON payment_records(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname = 'idx_payment_records_created_at' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_payment_records_created_at ON payment_records(created_at DESC);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname = 'idx_package_features_type' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_package_features_type ON package_features(package_type);
  END IF;
END $$;

-- Create triggers for updated_at (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'update_user_packages_updated_at'
      AND c.relname = 'user_packages'
      AND n.nspname = 'public'
  ) THEN
    CREATE TRIGGER update_user_packages_updated_at BEFORE UPDATE ON user_packages
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'update_payment_records_updated_at'
      AND c.relname = 'payment_records'
      AND n.nspname = 'public'
  ) THEN
    CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON payment_records
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create function to activate package after successful payment
CREATE OR REPLACE FUNCTION activate_user_package(
    p_user_id UUID,
    p_package_type package_type,
    p_package_name VARCHAR,
    p_amount DECIMAL,
    p_payment_record_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Deactivate any existing active packages
    UPDATE user_packages 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = p_user_id AND is_active = true;
    
    -- Insert new active package
    INSERT INTO user_packages (
        user_id, 
        package_type, 
        package_name, 
        amount_paid,
        is_active,
        is_lifetime
    ) VALUES (
        p_user_id,
        p_package_type,
        p_package_name,
        p_amount,
        true,
        true
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's crown color based on package
CREATE OR REPLACE FUNCTION get_user_crown_color(p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    crown_color VARCHAR;
BEGIN
    SELECT cc.color_hex INTO crown_color
    FROM user_packages up
    JOIN crown_colors cc ON up.package_type = cc.package_type
    WHERE up.user_id = p_user_id AND up.is_active = true
    LIMIT 1;
    
    RETURN COALESCE(crown_color, '#666666'); -- Default gray if no package
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate upgrade price
CREATE OR REPLACE FUNCTION calculate_upgrade_price(
    p_user_id UUID,
    p_target_package package_type
)
RETURNS DECIMAL AS $$
DECLARE
    current_package_price DECIMAL := 0;
    target_package_price DECIMAL;
BEGIN
    -- Get current package price
    SELECT 
        CASE up.package_type
            WHEN 'premium' THEN 100
            WHEN 'vip_premium' THEN 200
            WHEN 'golden_premium' THEN 500
        END INTO current_package_price
    FROM user_packages up
    WHERE up.user_id = p_user_id AND up.is_active = true;
    
    -- Get target package price
    target_package_price := 
        CASE p_target_package
            WHEN 'premium' THEN 100
            WHEN 'vip_premium' THEN 200
            WHEN 'golden_premium' THEN 500
        END;
    
    -- Return upgrade price (difference)
    RETURN GREATEST(target_package_price - COALESCE(current_package_price, 0), 0);
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE user_packages IS 'Tracks active user package subscriptions';
COMMENT ON TABLE payment_records IS 'Records all payment transactions for packages';
COMMENT ON TABLE package_features IS 'Defines features available for each package type';
COMMENT ON TABLE crown_colors IS 'Defines crown colors for each package type';

COMMENT ON FUNCTION activate_user_package IS 'Activates a package for user after successful payment';
COMMENT ON FUNCTION get_user_crown_color IS 'Returns the crown color for users current active package';
COMMENT ON FUNCTION calculate_upgrade_price IS 'Calculates the upgrade price between packages';

-- Verify tables were created
SELECT 'Membership schema created successfully' as status;
