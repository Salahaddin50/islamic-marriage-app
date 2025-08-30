-- Interests feature schema and policies

-- Table: public.interests
create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','accepted','rejected')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sender_id, receiver_id)
);

-- Enable RLS
alter table public.interests enable row level security;

-- Policies
do $$ begin
  -- Select: users can see interests where they are sender or receiver
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='interests' and policyname='interests_select_involved'
  ) then
    create policy interests_select_involved on public.interests
      for select using (
        auth.uid() = sender_id or auth.uid() = receiver_id
      );
  end if;

  -- Insert: only as sender
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='interests' and policyname='interests_insert_as_sender'
  ) then
    create policy interests_insert_as_sender on public.interests
      for insert with check (
        auth.uid() = sender_id
      );
  end if;

  -- Update: only receiver can update status, and only to accepted/rejected
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='interests' and policyname='interests_update_by_receiver'
  ) then
    create policy interests_update_by_receiver on public.interests
      for update using (
        auth.uid() = receiver_id
      ) with check (
        auth.uid() = receiver_id and status in ('pending','accepted','rejected')
      );
  end if;

  -- Prevent deletes except by sender or receiver (optional)
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='interests' and policyname='interests_delete_involved'
  ) then
    create policy interests_delete_involved on public.interests
      for delete using (
        auth.uid() = sender_id or auth.uid() = receiver_id
      );
  end if;
end $$;

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_interests_updated_at on public.interests;
create trigger set_interests_updated_at
before update on public.interests
for each row execute function public.set_updated_at();

-- Performance indexes
create index if not exists idx_interests_receiver_status_created on public.interests(receiver_id, status, created_at desc);
create index if not exists idx_interests_sender_status_created on public.interests(sender_id, status, created_at desc);
create index if not exists idx_interests_status_updated on public.interests(status, updated_at desc);


