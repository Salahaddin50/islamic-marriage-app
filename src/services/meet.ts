import { supabase } from '@/src/config/supabase';

export type MeetStatus = 'pending' | 'accepted' | 'rejected';
export type MeetOverallStatus = 'none' | MeetStatus;

export interface MeetRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: MeetStatus;
  scheduled_at: string | null;
  meet_link: string | null;
  created_at: string;
  updated_at: string;
}

export const MeetService = {
  async sendRequest(targetUserId: string, scheduledAtISO: string): Promise<MeetRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    if (user.id === targetUserId) throw new Error('Cannot send meet request to yourself');
    const { data, error } = await supabase
      .from('meet_requests')
      .insert({ sender_id: user.id, receiver_id: targetUserId, status: 'pending', scheduled_at: scheduledAtISO })
      .select('*')
      .single();
    if (error) throw error;
    return data as unknown as MeetRecord;
  },

  async accept(meetId: string): Promise<void> {
    // Set accepted and store a generic Google Meet creation link (user will create/join)
    const { error } = await supabase
      .from('meet_requests')
      .update({ status: 'accepted', meet_link: 'https://meet.google.com/new' })
      .eq('id', meetId);
    if (error) throw error;
  },

  async reject(meetId: string): Promise<void> {
    const { error } = await supabase
      .from('meet_requests')
      .update({ status: 'rejected' })
      .eq('id', meetId);
    if (error) throw error;
  },

  async cancel(meetId: string): Promise<void> {
    const { error } = await supabase
      .from('meet_requests')
      .delete()
      .eq('id', meetId);
    if (error) throw error;
  },

  async listIncoming(): Promise<MeetRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('meet_requests')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    return (data as unknown as MeetRecord[]) || [];
  },

  async listOutgoing(): Promise<MeetRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('meet_requests')
      .select('*')
      .eq('sender_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    return (data as unknown as MeetRecord[]) || [];
  },

  async listApproved(): Promise<MeetRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('meet_requests')
      .select('*')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });
    return (data as unknown as MeetRecord[]) || [];
  },

  async getLatestBetween(userA: string, userB: string): Promise<MeetRecord | null> {
    const { data } = await supabase
      .from('meet_requests')
      .select('*')
      .or(`and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as unknown as MeetRecord) || null;
  },

  async getStatusForTarget(targetUserId: string): Promise<{ status: MeetOverallStatus; record: MeetRecord | null; isSender: boolean; meetLink?: string | null }>
  {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: 'none', record: null, isSender: false, meetLink: null };
    const rec = await this.getLatestBetween(user.id, targetUserId);
    if (!rec) return { status: 'none', record: null, isSender: false, meetLink: null };
    return { status: rec.status as MeetOverallStatus, record: rec, isSender: rec.sender_id === user.id, meetLink: rec.meet_link };
  }
};


