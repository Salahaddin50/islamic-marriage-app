import { supabase } from '@/src/config/supabase';

export interface ConversationRecord {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  last_message_at: string | null;
  last_read_at_user_a?: string | null;
  last_read_at_user_b?: string | null;
  messages?: any[];
}

export interface ConversationMessageRecord {
  id: string;
  conversation_id?: string;
  sender_id: string;
  content: string | null;
  message_type: string; // 'text' | 'system'
  created_at: string;
}

export class ConversationsService {
  static async getOrCreateByOtherUser(currentUserId: string, otherUserId: string): Promise<ConversationRecord> {
    const { data: existingList, error: selErr } = await supabase
      .from('conversations')
      .select('id,user_a,user_b,created_at,last_message_at,last_read_at_user_a,last_read_at_user_b')
      .or(`and(user_a.eq.${currentUserId},user_b.eq.${otherUserId}),and(user_a.eq.${otherUserId},user_b.eq.${currentUserId})`)
      .limit(1);

    if (selErr) throw selErr;
    if (existingList && existingList.length > 0) {
      return existingList[0] as ConversationRecord;
    }

    const { data: created, error: insErr } = await supabase
      .from('conversations')
      .insert({ user_a: currentUserId, user_b: otherUserId })
      .select('id,user_a,user_b,created_at,last_message_at,last_read_at_user_a,last_read_at_user_b')
      .single();

    if (insErr) throw insErr;
    return created as ConversationRecord;
  }

  static async listMessages(conversationId: string, limit: number = 200): Promise<ConversationMessageRecord[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('messages,last_read_at_user_a,last_read_at_user_b,user_a,user_b')
      .eq('id', conversationId)
      .single();
    if (error) throw error;
    const arr: any[] = (data?.messages ?? []) as any[];
    return arr.map((m: any) => ({
      id: m.id,
      conversation_id: conversationId,
      sender_id: m.sender_id,
      content: m.content ?? null,
      message_type: m.message_type ?? 'text',
      created_at: m.created_at,
    }));
  }

  static async sendText(conversationId: string, currentUserId: string, content: string): Promise<ConversationMessageRecord> {
    console.log('Sending message via RPC append_text_message:', { conversationId, currentUserId, content });

    const { data, error } = await supabase.rpc('append_text_message', {
      p_conversation_id: conversationId,
      p_content: content,
    });

    if (error) {
      console.error('Error sending message via RPC:', error);
      throw error;
    }

    const msg = data as any;
    return {
      id: msg.id,
      conversation_id: conversationId,
      sender_id: msg.sender_id,
      content: msg.content ?? null,
      message_type: msg.message_type ?? 'text',
      created_at: msg.created_at,
    } as ConversationMessageRecord;
  }

  static async markRead(conversationId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId,
    });
    if (error) throw error;
  }
}


