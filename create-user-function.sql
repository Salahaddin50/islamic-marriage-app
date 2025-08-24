-- Create a secure function to create users
CREATE OR REPLACE FUNCTION create_user_profile(
  p_auth_user_id UUID,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id
  FROM users
  WHERE auth_user_id = p_auth_user_id;
  
  IF new_user_id IS NOT NULL THEN
    RETURN new_user_id;
  END IF;
  
  -- Create new user
  INSERT INTO users (
    auth_user_id,
    email,
    phone,
    profile_status,
    is_verified,
    verification_documents_submitted
  ) VALUES (
    p_auth_user_id,
    p_email,
    p_phone,
    'active',
    FALSE,
    FALSE
  )
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT) TO authenticated;
