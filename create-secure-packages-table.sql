-- SECURE PACKAGES TABLE MIGRATION
-- Run this in Supabase SQL Editor to create secure package management

-- Create packages table with admin-controlled pricing
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id VARCHAR(50) UNIQUE NOT NULL, -- 'premium', 'vip_premium', 'golden_premium'
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    crown_color VARCHAR(7) NOT NULL, -- hex color
    features JSONB NOT NULL DEFAULT '[]', -- array of feature strings
    is_active BOOLEAN DEFAULT TRUE,
    is_lifetime BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active packages (for display)
CREATE POLICY "Anyone can view active packages" ON packages
    FOR SELECT USING (is_active = true);

-- Policy: Only service role can modify packages (for admin panel via Edge Functions)
CREATE POLICY "Service role can modify packages" ON packages
    FOR ALL USING (auth.role() = 'service_role');

-- Insert default packages (secure server-side pricing)
INSERT INTO packages (package_id, name, price, crown_color, features, sort_order) VALUES
('premium', 'Premium', 0.50, '#6A1B9A', 
    '["Lifetime subscription till marriage", "Arrange video call", "Request whatsapp number"]', 1),
('vip_premium', 'VIP Premium', 200.00, '#34A853',
    '["All Premium Features", "24/7 facilitation and convincing support"]', 2),
('golden_premium', 'Golden Premium', 500.00, '#B8860B',
    '["All VIP Premium features", "Just Relax, we will reach you in your whatsapp and marry you"]', 3)
ON CONFLICT (package_id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    crown_color = EXCLUDED.crown_color,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- Create function to get package price securely (server-side validation)
CREATE OR REPLACE FUNCTION get_package_price(p_package_id VARCHAR)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    package_price DECIMAL(10,2);
BEGIN
    SELECT price INTO package_price
    FROM packages
    WHERE package_id = p_package_id AND is_active = true;
    
    IF package_price IS NULL THEN
        RAISE EXCEPTION 'Invalid package ID: %', p_package_id;
    END IF;
    
    RETURN package_price;
END;
$$;

-- Create function to validate and create secure payment
CREATE OR REPLACE FUNCTION create_secure_payment(
    p_package_id VARCHAR,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
    payment_id UUID,
    package_name VARCHAR,
    actual_price DECIMAL(10,2),
    upgrade_price DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_package packages%ROWTYPE;
    v_current_package_price DECIMAL(10,2) := 0;
    v_upgrade_price DECIMAL(10,2);
    v_payment_id UUID;
BEGIN
    -- Validate user is authenticated
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get package details
    SELECT * INTO v_package
    FROM packages
    WHERE package_id = p_package_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid package ID: %', p_package_id;
    END IF;
    
    -- Get current user's package price (if any)
    SELECT COALESCE(
        (SELECT p.price 
         FROM user_packages up
         JOIN packages p ON p.package_id = up.package_type
         WHERE up.user_id = p_user_id AND up.is_active = true
         ORDER BY p.price DESC
         LIMIT 1), 0
    ) INTO v_current_package_price;
    
    -- Calculate upgrade price
    v_upgrade_price := GREATEST(v_package.price - v_current_package_price, 0);
    
    -- Create pending payment record
    INSERT INTO payment_records (
        user_id,
        package_name,
        package_type,
        amount,
        status,
        payment_method,
        payment_details
    ) VALUES (
        p_user_id,
        v_package.name,
        v_package.package_id,
        v_upgrade_price,
        'pending',
        'paypal',
        jsonb_build_object(
            'type', CASE WHEN v_current_package_price > 0 THEN 'upgrade' ELSE 'purchase' END,
            'target_package', v_package.package_id,
            'target_price', v_package.price,
            'baseline_price', v_current_package_price,
            'upgrade_price', v_upgrade_price,
            'timestamp', NOW()
        )
    ) RETURNING id INTO v_payment_id;
    
    RETURN QUERY SELECT 
        v_payment_id,
        v_package.name,
        v_package.price,
        v_upgrade_price;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_packages_package_id ON packages(package_id);

-- Update existing payment_records to add validation
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS server_validated BOOLEAN DEFAULT FALSE;

-- Add trigger to update packages updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON packages TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_package_price(VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_secure_payment(VARCHAR, UUID) TO authenticated;
