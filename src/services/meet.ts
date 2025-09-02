import { supabase } from '@/src/config/supabase';
import { NotificationsService } from './notifications';

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
    
    // Get sender profile for notification
    const { data: senderProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, age')
      .eq('user_id', user.id)
      .maybeSingle();

    const senderName = senderProfile 
      ? `${senderProfile.first_name || 'Someone'} ${senderProfile.last_name || ''}`.trim()
      : 'Someone';

    const { data, error } = await supabase
      .from('meet_requests')
      .insert({ sender_id: user.id, receiver_id: targetUserId, status: 'pending', scheduled_at: scheduledAtISO })
      .select('*')
      .single();
    if (error) throw error;

    // Create notification for the receiver
    try {
      await NotificationsService.create({
        user_id: targetUserId,
        sender_id: user.id,
        sender_name: senderName,
        sender_age: senderProfile?.age || undefined,
        type: 'video_call_request',
        title: 'Video Call Request',
        message: `${senderName}, ${senderProfile?.age || ''} requests a video call`
      });
    } catch (notificationError) {
      console.log('Failed to create meet request notification:', notificationError);
    }

    return data as unknown as MeetRecord;
  },

  async accept(meetId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the meet request to find the sender
    const { data: meetRequest } = await supabase
      .from('meet_requests')
      .select('sender_id, receiver_id')
      .eq('id', meetId)
      .maybeSingle();

    if (!meetRequest) throw new Error('Meet request not found');

    // Get accepter profile for notification
    const { data: accepterProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, age')
      .eq('user_id', user.id)
      .maybeSingle();

    const accepterName = accepterProfile 
      ? `${accepterProfile.first_name || 'Someone'} ${accepterProfile.last_name || ''}`.trim()
      : 'Someone';

    // Generate a Jitsi room link instantly (no external API)
    const randomPart = `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    const generatedLink = `https://meet.jit.si/hume-${randomPart}`;

    const { error } = await supabase
      .from('meet_requests')
      .update({ status: 'accepted', meet_link: generatedLink })
      .eq('id', meetId);
    if (error) throw error;

    // Create notification for the original sender
    try {
      await NotificationsService.create({
        user_id: meetRequest.sender_id,
        sender_id: user.id,
        sender_name: accepterName,
        sender_age: accepterProfile?.age || undefined,
        type: 'video_call_approved',
        title: 'Video Call Approved',
        message: `${accepterName}, ${accepterProfile?.age || ''} approved your video call request`
      });
    } catch (notificationError) {
      console.log('Failed to create meet request accepted notification:', notificationError);
    }
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

  async listIncoming({ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<MeetRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('meet_requests')
      .select('id,sender_id,receiver_id,status,scheduled_at,meet_link,created_at,updated_at')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return (data as unknown as MeetRecord[]) || [];
  },

  async listOutgoing({ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<MeetRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('meet_requests')
      .select('id,sender_id,receiver_id,status,scheduled_at,meet_link,created_at,updated_at')
      .eq('sender_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return (data as unknown as MeetRecord[]) || [];
  },

  async listApproved({ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<MeetRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('meet_requests')
      .select('id,sender_id,receiver_id,status,scheduled_at,meet_link,created_at,updated_at')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
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


