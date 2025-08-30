-- Performance indexes for large user_profiles lists (Home screen)
create index if not exists idx_user_profiles_gender_created on public.user_profiles(gender, created_at desc);
create index if not exists idx_user_profiles_created on public.user_profiles(created_at desc);

