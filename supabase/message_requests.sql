-- message_requests table
create table if not exists public.message_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','accepted','rejected')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sender_id, receiver_id, created_at)
);

alter table public.message_requests enable row level security;

-- Policies: each party can view their related rows
drop policy if exists "message_select_related" on public.message_requests;
create policy "message_select_related" on public.message_requests
for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);

-- Sender can insert
drop policy if exists "message_insert_sender" on public.message_requests;
create policy "message_insert_sender" on public.message_requests
for insert with check (auth.uid() = sender_id);

-- Receiver can update status to accepted/rejected; sender cannot change status after insert
drop policy if exists "message_update_status" on public.message_requests;
create policy "message_update_status" on public.message_requests
for update using (auth.uid() = receiver_id) with check (auth.uid() = receiver_id);

-- Either party can delete (cancel)
drop policy if exists "message_delete_either" on public.message_requests;
create policy "message_delete_either" on public.message_requests
for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Trigger to keep updated_at fresh
create or replace function public.set_message_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists message_requests_updated_at on public.message_requests;
create trigger message_requests_updated_at before update on public.message_requests
for each row execute function public.set_message_updated_at();
