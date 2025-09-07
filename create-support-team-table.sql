-- Create support_team table for managing support staff
CREATE TABLE IF NOT EXISTS support_team (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'Project Manager',
        'Customer support', 
        'Payment support',
        'Profile support (f)',
        'Profile support (m)'
    )),
    whatsapp_number VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_support_team_role ON support_team(role);
CREATE INDEX IF NOT EXISTS idx_support_team_active ON support_team(is_active);

-- Insert dummy support team data
INSERT INTO support_team (name, role, whatsapp_number) VALUES
('Ahmed Al-Rashid', 'Project Manager', '966501234567'),
('Fatima Hassan', 'Customer support', '966501234568'), 
('Omar Abdullah', 'Payment support', '966501234569'),
('Aisha Mohamed', 'Profile support (f)', '966501234570'),
('Khalid Ibrahim', 'Profile support (m)', '966501234571');

-- Enable RLS (Row Level Security)
ALTER TABLE support_team ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all authenticated users
CREATE POLICY "Allow read access to support team" ON support_team
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow admin users to manage support team (you can adjust this based on your admin setup)
CREATE POLICY "Allow admin to manage support team" ON support_team
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email LIKE '%admin%'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_support_team_updated_at
    BEFORE UPDATE ON support_team
    FOR EACH ROW
    EXECUTE FUNCTION update_support_team_updated_at();
