-- Requires: Supabase with pgcrypto/gen_random_uuid() enabled or use extensions accordingly

-- Ensure pgcrypto is available for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Create conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null,
  user_b uuid not null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_read_at_user_a timestamptz,
  last_read_at_user_b timestamptz,
  constraint conversations_users_not_equal check (user_a <> user_b)
);

-- Unique by unordered pair (user_a, user_b) using a functional unique index
create unique index if not exists conversations_unique_pair
  on public.conversations (least(user_a, user_b), greatest(user_a, user_b));

-- Messages table
create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  content text,
  message_type text not null default 'system', -- 'text' | 'system' | others if needed
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

-- Policies: only participants can select
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select
  using (
    auth.uid() is not null and (user_a = auth.uid() or user_b = auth.uid())
  );

-- Admins can select all conversations
drop policy if exists conversations_admin_select on public.conversations;
create policy conversations_admin_select on public.conversations
  for select
  using (
    exists (
      select 1 from public.admin_users au
      where coalesce(au.is_approved, false) = true
        and (
          au.id = auth.uid()
          or lower(au.email) = lower( (current_setting('request.jwt.claims', true)::jsonb ->> 'email') )
        )
    )
  );

-- Insert/upsert: allow only if inserting a conversation where current user is one of the participants
drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations
  for insert
  with check (
    auth.uid() is not null and (user_a = auth.uid() or user_b = auth.uid())
  );

-- Allow participants to update (e.g., last_message_at or messages JSON)
drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations
  for update
  using (
    auth.uid() is not null and (user_a = auth.uid() or user_b = auth.uid())
  )
  with check (
    auth.uid() is not null and (user_a = auth.uid() or user_b = auth.uid())
  );

-- Messages policies: only participants of parent conversation can select/insert
drop policy if exists conversation_messages_select on public.conversation_messages;
create policy conversation_messages_select on public.conversation_messages
  for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists conversation_messages_insert on public.conversation_messages;
create policy conversation_messages_insert on public.conversation_messages
  for insert
  with check (
    auth.uid() is not null and
    sender_id = auth.uid() and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Helpful index for messages
create index if not exists idx_conversation_messages_conversation_time
  on public.conversation_messages (conversation_id, created_at);

-- Denormalized messages JSON on conversations
alter table public.conversations
  add column if not exists messages jsonb not null default '[]'::jsonb;

-- Append each inserted conversation message into conversations.messages as JSON
drop function if exists public.conversations_append_message cascade;
create function public.conversations_append_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations c
     set messages = coalesce(c.messages, '[]'::jsonb)
                    || jsonb_build_array(
                         jsonb_build_object(
                           'id', NEW.id,
                           'sender_id', NEW.sender_id,
                           'content', NEW.content,
                           'message_type', NEW.message_type,
                           'created_at', NEW.created_at
                         )
                       ),
         last_message_at = NEW.created_at
   where c.id = NEW.conversation_id;

  return NEW;
end;
$$;

-- Grants: allow web app (authenticated) to call moderation RPCs
grant execute on function public.approve_conversation_message(text, text) to authenticated;
grant execute on function public.reject_conversation_message(text, text, text) to authenticated;

-- Moderation table: queue user messages for admin approval
create table if not exists public.moderation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  content text not null,
  status text not null default 'pending', -- pending | approved | rejected
  reason text,
  created_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz
);

alter table public.moderation_messages enable row level security;

-- Users can insert their own pending items if participants
drop policy if exists moderation_insert on public.moderation_messages;
create policy moderation_insert on public.moderation_messages
  for insert
  with check (
    auth.uid() is not null
    and sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = moderation_messages.conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Users can see their own submitted items
drop policy if exists moderation_select_own on public.moderation_messages;
create policy moderation_select_own on public.moderation_messages
  for select
  using (
    auth.uid() is not null and sender_id = auth.uid()
  );

-- Admins can read and update all moderation messages
drop policy if exists moderation_admin_select on public.moderation_messages;
create policy moderation_admin_select on public.moderation_messages
  for select
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and coalesce(au.is_approved, false) = true
    )
  );

drop policy if exists moderation_admin_update on public.moderation_messages;
create policy moderation_admin_update on public.moderation_messages
  for update
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and coalesce(au.is_approved, false) = true
    )
  )
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and coalesce(au.is_approved, false) = true
    )
  );

-- RPC: submit message for review (returns pending id & timestamps)
drop function if exists public.submit_message_for_review cascade;
create function public.submit_message_for_review(p_conversation_id uuid, p_content text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_row public.moderation_messages%rowtype;
begin
  if v_sender is null then raise exception 'Not authenticated'; end if;
  if p_content is null or length(trim(p_content)) = 0 then raise exception 'Empty content'; end if;
  if not exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and (c.user_a = v_sender or c.user_b = v_sender)
  ) then
    raise exception 'Not a participant';
  end if;

  insert into public.moderation_messages (conversation_id, sender_id, content, status)
  values (p_conversation_id, v_sender, p_content, 'pending')
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'conversation_id', v_row.conversation_id,
    'sender_id', v_row.sender_id,
    'content', v_row.content,
    'status', v_row.status,
    'created_at', v_row.created_at
  );
end;
$$;

-- RPC: approve pending message → append to conversations.messages using same id
drop function if exists public.approve_pending_message cascade;
create function public.approve_pending_message(p_pending_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_row public.moderation_messages%rowtype;
begin
  if v_admin is null then raise exception 'Not authenticated'; end if;
  if not exists (
    select 1 from public.admin_users au 
    where coalesce(au.is_approved, false) = true
      and (
        au.id = v_admin or lower(au.email) = lower( (current_setting('request.jwt.claims', true)::jsonb ->> 'email') )
      )
  ) then
    raise exception 'Not authorized';
  end if;

  select * into v_row from public.moderation_messages where id = p_pending_id;
  if not found then raise exception 'Pending not found'; end if;
  if v_row.status <> 'pending' then return; end if;

  -- Append to conversation using the same message ID
  update public.conversations c
     set messages = coalesce(c.messages, '[]'::jsonb) || jsonb_build_array(
           jsonb_build_object(
             'id', v_row.id,
             'sender_id', v_row.sender_id,
             'content', v_row.content,
             'message_type', 'text',
             'created_at', now()
           )
         ),
         last_message_at = now()
   where c.id = v_row.conversation_id;

  update public.moderation_messages
     set status = 'approved', reviewed_by = v_admin, reviewed_at = now()
   where id = p_pending_id;
end;
$$;

-- RPC: reject pending message
drop function if exists public.reject_pending_message cascade;
create function public.reject_pending_message(p_pending_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
begin
  if v_admin is null then raise exception 'Not authenticated'; end if;
  if not exists (
    select 1 from public.admin_users au 
    where coalesce(au.is_approved, false) = true
      and (
        au.id = v_admin or lower(au.email) = lower( (current_setting('request.jwt.claims', true)::jsonb ->> 'email') )
      )
  ) then
    raise exception 'Not authorized';
  end if;

  update public.moderation_messages
     set status = 'rejected', reviewed_by = v_admin, reviewed_at = now(), reason = p_reason
   where id = p_pending_id;
end;
$$;
drop trigger if exists trg_conversation_messages_append on public.conversation_messages;
create trigger trg_conversation_messages_append
after insert on public.conversation_messages
for each row execute function public.conversations_append_message();

-- RPC to append a text message directly into conversations.messages (single-table usage)
drop function if exists public.append_text_message cascade;
create function public.append_text_message(p_conversation_id uuid, p_content text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_msg jsonb;
  v_convo record;
begin
  if v_sender is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_convo from public.conversations c
  where c.id = p_conversation_id
    and (c.user_a = v_sender or c.user_b = v_sender)
  limit 1;

  if not found then
    raise exception 'User is not a participant of this conversation';
  end if;

  v_msg := jsonb_build_object(
    'id', gen_random_uuid(),
    'sender_id', v_sender,
    'content', p_content,
    'message_type', 'text',
    'created_at', now(),
    'status', 'pending'
  );

  update public.conversations c
     set messages = coalesce(c.messages, '[]'::jsonb) || jsonb_build_array(v_msg),
         last_message_at = now()
   where c.id = p_conversation_id;

  return v_msg;
end;
$$;

-- RPC: approve a specific message inside conversations.messages
drop function if exists public.approve_conversation_message cascade;
create function public.approve_conversation_message(p_conversation_id text, p_message_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
begin
  if v_admin is null then raise exception 'Not authenticated'; end if;
  if not exists (
    select 1 from public.admin_users au 
    where coalesce(au.is_approved, false) = true
      and (
        au.id = v_admin or lower(au.email) = lower( (current_setting('request.jwt.claims', true)::jsonb ->> 'email') )
      )
  ) then
    raise exception 'Not authorized';
  end if;

  update public.conversations c
     set messages = (
       select coalesce(jsonb_agg(
         case when (elem->>'id') = p_message_id
              then elem || jsonb_build_object('status','approved')
              else elem end
       ), '[]'::jsonb)
       from jsonb_array_elements(coalesce(c.messages, '[]'::jsonb)) elem
     ),
         last_message_at = now()
   where c.id = p_conversation_id::uuid;
end;
$$;

-- RPC: reject a specific message inside conversations.messages
drop function if exists public.reject_conversation_message cascade;
create function public.reject_conversation_message(p_conversation_id text, p_message_id text, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
begin
  if v_admin is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.admin_users au where au.id = v_admin and coalesce(au.is_approved, false) = true) then
    raise exception 'Not authorized';
  end if;

  update public.conversations c
     set messages = (
       select coalesce(jsonb_agg(
         case when (elem->>'id') = p_message_id::text
              then elem || jsonb_build_object('status','rejected','reason', coalesce(p_reason,''))
              else elem end
       ), '[]'::jsonb)
       from jsonb_array_elements(coalesce(c.messages, '[]'::jsonb)) elem
     )
   where c.id = p_conversation_id::uuid;
end;
$$;

-- RPC to set last read timestamp for current user
drop function if exists public.mark_conversation_read cascade;
create function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_convo record;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  select * into v_convo from public.conversations where id = p_conversation_id;
  if not found then
    raise exception 'Conversation not found';
  end if;

  if v_convo.user_a = v_uid then
    update public.conversations set last_read_at_user_a = now() where id = p_conversation_id;
  elsif v_convo.user_b = v_uid then
    update public.conversations set last_read_at_user_b = now() where id = p_conversation_id;
  else
    raise exception 'Not a participant';
  end if;
end;
$$;


