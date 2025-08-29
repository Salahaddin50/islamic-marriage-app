import { supabase } from '@/src/config/supabase';

export type InterestStatus = 'none' | 'pending' | 'accepted' | 'rejected';

export interface InterestRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export const InterestsService = {
  async sendInterest(targetUserId: string): Promise<InterestRecord | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    if (user.id === targetUserId) throw new Error('Cannot send interest to yourself');

    // Upsert ignoring duplicates to avoid RLS update failures on existing rows
    const { error } = await supabase
      .from('interests')
      .upsert({ sender_id: user.id, receiver_id: targetUserId }, { onConflict: 'sender_id,receiver_id', ignoreDuplicates: true });

    if (error) {
      // If unique violation or RLS, fallback to reading existing status
      const existing = await this.getInterestBetween(user.id, targetUserId);
      if (existing) return existing;
      throw error;
    }

    // Fetch the row to return the current state
    const existing = await this.getInterestBetween(user.id, targetUserId);
    return existing;
  },

  async getInterestBetween(userA: string, userB: string): Promise<InterestRecord | null> {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .or(`and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`)
      .maybeSingle();
    if (error) return null;
    return (data as unknown as InterestRecord) || null;
  },

  async getStatusForTarget(targetUserId: string): Promise<{ status: InterestStatus; record: InterestRecord | null; isSender: boolean }>
  {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: 'none', record: null, isSender: false };
    const rec = await this.getInterestBetween(user.id, targetUserId);
    if (!rec) return { status: 'none', record: null, isSender: false };
    return { status: rec.status as InterestStatus, record: rec, isSender: rec.sender_id === user.id };
  },

  async accept(interestId: string): Promise<InterestRecord> {
    const { data, error } = await supabase
      .from('interests')
      .update({ status: 'accepted' })
      .eq('id', interestId)
      .select('*')
      .single();
    if (error) throw error;
    return data as unknown as InterestRecord;
  },

  async reject(interestId: string): Promise<InterestRecord> {
    const { data, error } = await supabase
      .from('interests')
      .update({ status: 'rejected' })
      .eq('id', interestId)
      .select('*')
      .single();
    if (error) throw error;
    return data as unknown as InterestRecord;
  },

  async listIncoming(): Promise<InterestRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('interests')
      .select('*')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });
    return (data as unknown as InterestRecord[]) || [];
  },

  async listOutgoing(): Promise<InterestRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('interests')
      .select('*')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });
    return (data as unknown as InterestRecord[]) || [];
  },

  async listApproved(): Promise<InterestRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('interests')
      .select('*')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });
    return (data as unknown as InterestRecord[]) || [];
  }
};


