-- Create a secure RPC to delete a user profile as an approved admin
-- Run this in Supabase SQL editor

-- Ensure extension for auth.uid()
create extension if not exists pgjwt with schema extensions;

-- Function drops/creates
drop function if exists public.admin_delete_user_profile(uuid);
create or replace function public.admin_delete_user_profile(in_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_jwt_email text;
begin
  -- Extract JWT email claim (if present)
  begin
    v_jwt_email := coalesce((current_setting('request.jwt.claims', true)::json ->> 'email'), null);
  exception when others then
    v_jwt_email := null;
  end;

  -- Verify caller is an approved admin either by uid match OR email match
  select coalesce(is_approved, false)
    into v_is_admin
  from public.admin_users au
  where (au.id = auth.uid())
     or (v_jwt_email is not null and lower(au.email) = lower(v_jwt_email))
  limit 1;

  if not coalesce(v_is_admin, false) then
    raise exception 'not_authorized';
  end if;

  -- Delete the profile row
  delete from public.user_profiles
  where id = in_profile_id;

  return;
end;
$$;

-- Allow authenticated to execute
grant execute on function public.admin_delete_user_profile(uuid) to authenticated;


