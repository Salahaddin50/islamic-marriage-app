import { supabase } from '@/src/config/supabase';

export type MessageRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface MessageRequestRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: MessageRequestStatus;
  created_at: string;
  updated_at: string;
}

export const MessageRequestsService = {
  async send(targetUserId: string): Promise<MessageRequestRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    if (user.id === targetUserId) throw new Error('Cannot send message request to yourself');
    const { data, error } = await supabase
      .from('message_requests')
      .insert({ sender_id: user.id, receiver_id: targetUserId, status: 'pending' })
      .select('*')
      .single();
    if (error) throw error;
    return data as unknown as MessageRequestRecord;
  },

  async accept(id: string): Promise<void> {
    const { error } = await supabase
      .from('message_requests')
      .update({ status: 'accepted' })
      .eq('id', id);
    if (error) throw error;
  },

  async reject(id: string): Promise<void> {
    const { error } = await supabase
      .from('message_requests')
      .update({ status: 'rejected' })
      .eq('id', id);
    if (error) throw error;
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('message_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async listIncoming(): Promise<MessageRequestRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('message_requests')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    return (data as unknown as MessageRequestRecord[]) || [];
  },

  async listOutgoing(): Promise<MessageRequestRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('message_requests')
      .select('*')
      .eq('sender_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    return (data as unknown as MessageRequestRecord[]) || [];
  },

  async listApproved(): Promise<MessageRequestRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('message_requests')
      .select('*')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });
    return (data as unknown as MessageRequestRecord[]) || [];
  },

  async getLatestBetween(userA: string, userB: string): Promise<MessageRequestRecord | null> {
    const { data, error } = await supabase
      .from('message_requests')
      .select('*')
      .or(`and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as unknown as MessageRequestRecord) || null;
  },

  async getStatusForTarget(targetUserId: string): Promise<{ status: MessageRequestStatus | 'none'; record: MessageRequestRecord | null; isSender: boolean }>
  {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: 'none', record: null, isSender: false };
    const rec = await this.getLatestBetween(user.id, targetUserId);
    if (!rec) return { status: 'none', record: null, isSender: false };
    return { status: rec.status as MessageRequestStatus, record: rec, isSender: rec.sender_id === user.id };
  },
};
