-- Simple test RPC to debug the approve issue
drop function if exists public.test_approve cascade;
create function public.test_approve(p_conversation_id text, p_message_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_conv record;
  v_result jsonb;
begin
  if v_admin is null then 
    return jsonb_build_object('error', 'Not authenticated');
  end if;
  
  -- Check admin
  if not exists (
    select 1 from public.admin_users au 
    where coalesce(au.is_approved, false) = true
      and (
        au.id = v_admin or lower(au.email) = lower( (current_setting('request.jwt.claims', true)::jsonb ->> 'email') )
      )
  ) then
    return jsonb_build_object('error', 'Not authorized as admin');
  end if;

  -- Get conversation
  select * into v_conv from public.conversations where id = p_conversation_id::uuid;
  if not found then
    return jsonb_build_object('error', 'Conversation not found', 'id', p_conversation_id);
  end if;

  -- Try the update
  begin
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

    return jsonb_build_object('success', true, 'updated_rows', 1);
  exception when others then
    return jsonb_build_object('error', 'Update failed', 'sqlstate', SQLSTATE, 'sqlerrm', SQLERRM);
  end;
end;
$$;

grant execute on function public.test_approve(text, text) to authenticated;
