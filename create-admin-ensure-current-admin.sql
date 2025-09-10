-- Create helper RPC to ensure current authenticated user exists/approved in admin_users
-- Run this in Supabase SQL editor

drop function if exists public.ensure_current_admin();
create or replace function public.ensure_current_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_uid uuid;
begin
  -- Extract email and uid from JWT
  v_email := coalesce((current_setting('request.jwt.claims', true)::json ->> 'email'), NULL);
  v_uid := auth.uid();

  if v_email is null then
    raise exception 'missing_email_claim';
  end if;

  -- Insert or update admin_users row for this email
  insert into public.admin_users (email, first_name, last_name, is_super_admin, is_approved, approved_at)
  values (v_email, '', '', true, true, now())
  on conflict (email) do update set
    is_approved = true,
    is_super_admin = true,
    approved_at = now();

  return;
end;
$$;

grant execute on function public.ensure_current_admin() to authenticated;


