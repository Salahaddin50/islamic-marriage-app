-- Create RPCs required by the HTML admin panel
-- - get_email_for_user(uuid): returns { email }
-- - get_profiles_with_email(text): returns user_profiles rows filtered by gender (compatibility shim)

-- NOTE: Run this in Supabase SQL editor (or psql) as an owner/admin.
-- It is safe to re-run; objects are created or replaced.

-- 1) Return email for a given auth user id as JSON (so client can read rpc.data.email)
CREATE OR REPLACE FUNCTION public.get_email_for_user(in_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = in_user_id;

  RETURN jsonb_build_object('email', v_email);
END;
$$;

-- Allow anon/authenticated to execute the RPC
GRANT EXECUTE ON FUNCTION public.get_email_for_user(uuid) TO anon, authenticated;


-- 2) Compatibility shim used by the admin pages when attempting an RPC first.
-- It simply returns user_profiles filtered by gender. (Email is fetched separately.)
CREATE OR REPLACE FUNCTION public.get_profiles_with_email(in_gender text)
RETURNS SETOF public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT up.*
  FROM public.user_profiles up
  WHERE (in_gender IS NULL OR up.gender = in_gender)
  ORDER BY up.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profiles_with_email(text) TO anon, authenticated;


