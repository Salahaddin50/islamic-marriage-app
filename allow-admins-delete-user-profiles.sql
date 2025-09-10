-- Allow approved admin users to delete rows from user_profiles
-- Run this in Supabase SQL editor (or psql)

alter table if exists public.user_profiles enable row level security;

drop policy if exists admin_delete_user_profiles on public.user_profiles;
create policy admin_delete_user_profiles
on public.user_profiles
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.id = auth.uid()
      and coalesce(au.is_approved, false) = true
  )
);


