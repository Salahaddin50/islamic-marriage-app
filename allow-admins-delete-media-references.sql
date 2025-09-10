-- Allow approved admin users to delete rows from media_references
-- Run this in Supabase SQL editor (or psql) on your project

-- Ensure RLS is enabled (no-op if already enabled)
alter table if exists public.media_references enable row level security;

-- Create or replace policy for delete
drop policy if exists admin_delete_media_references on public.media_references;
create policy admin_delete_media_references
on public.media_references
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


