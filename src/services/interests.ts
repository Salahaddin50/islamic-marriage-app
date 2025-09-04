import { supabase } from '@/src/config/supabase';
import { NotificationsService } from './notifications';

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

    // Get sender profile for notification
    const { data: senderProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, age')
      .eq('user_id', user.id)
      .maybeSingle();

    const senderName = senderProfile 
      ? `${senderProfile.first_name || 'Someone'} ${senderProfile.last_name || ''}`.trim()
      : 'Someone';

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

    // Create notification for the receiver
    try {
      await NotificationsService.create({
        user_id: targetUserId,
        sender_id: user.id,
        sender_name: senderName,
        sender_age: senderProfile?.age || undefined,
        type: 'photo_request',
        title: 'Photo Request',
        message: `${senderName}, ${senderProfile?.age || ''} requests your photo`
      });
    } catch (notificationError) {
      console.log('Failed to create interest notification:', notificationError);
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

  async accept(interestId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the interest record to find the sender
    const { data: interest } = await supabase
      .from('interests')
      .select('sender_id, receiver_id')
      .eq('id', interestId)
      .maybeSingle();

    if (!interest) throw new Error('Interest not found');

    // Get accepter profile for notification
    const { data: accepterProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, age')
      .eq('user_id', user.id)
      .maybeSingle();

    const accepterName = accepterProfile 
      ? `${accepterProfile.first_name || 'Someone'} ${accepterProfile.last_name || ''}`.trim()
      : 'Someone';

    // Update the interest status
    const { error } = await supabase
      .from('interests')
      .update({ status: 'accepted' })
      .eq('id', interestId);
    
    if (error) throw error;

    // Create notification for the original sender
    try {
      await NotificationsService.create({
        user_id: interest.sender_id,
        sender_id: user.id,
        sender_name: accepterName,
        sender_age: accepterProfile?.age || undefined,
        type: 'photo_shared',
        title: 'Photos Shared',
        message: `${accepterName}, ${accepterProfile?.age || ''} has shared photos with you`
      });
    } catch (notificationError) {
      console.log('Failed to create interest accepted notification:', notificationError);
    }
  },

  async reject(interestId: string): Promise<void> {
    const { error } = await supabase
      .from('interests')
      .update({ status: 'rejected' })
      .eq('id', interestId);
    if (error) throw error;
  },

  async listIncoming({ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<InterestRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('interests')
      .select('id,sender_id,receiver_id,status,created_at,updated_at')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return (data as unknown as InterestRecord[]) || [];
  },

  async listOutgoing({ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<InterestRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('interests')
      .select('id,sender_id,receiver_id,status,created_at,updated_at')
      .eq('sender_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return (data as unknown as InterestRecord[]) || [];
  },

  async listApproved({ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<InterestRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('interests')
      .select('id,sender_id,receiver_id,status,created_at,updated_at')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return (data as unknown as InterestRecord[]) || [];
  },

  async withdraw(interestId: string): Promise<void> {
    const { error } = await supabase
      .from('interests')
      .delete()
      .eq('id', interestId);
    if (error) throw error;
  },

  async cancel(interestId: string): Promise<void> {
    // For approved interests, cancel by deleting the record
    const { error } = await supabase
      .from('interests')
      .delete()
      .eq('id', interestId);
    if (error) throw error;
  },

  // Optimized batch loading for home screen performance
  async loadAllInterestsForUser(): Promise<{
    pendingIncoming: Set<string>;
    pendingOutgoing: Set<string>;
    approved: Set<string>;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        pendingIncoming: new Set(),
        pendingOutgoing: new Set(),
        approved: new Set()
      };
    }

    try {
      // Single query to get all interests involving the current user
      const { data: interests, error } = await supabase
        .from('interests')
        .select('sender_id, receiver_id, status')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .limit(500); // Reasonable limit for performance

      if (error) throw error;

      const pendingIncoming = new Set<string>();
      const pendingOutgoing = new Set<string>();
      const approved = new Set<string>();

      interests?.forEach(interest => {
        const isUserSender = interest.sender_id === user.id;
        const otherUserId = isUserSender ? interest.receiver_id : interest.sender_id;

        switch (interest.status) {
          case 'pending':
            if (isUserSender) {
              pendingOutgoing.add(otherUserId);
            } else {
              pendingIncoming.add(otherUserId);
            }
            break;
          case 'accepted':
            approved.add(otherUserId);
            break;
          // 'rejected' interests are ignored for home screen purposes
        }
      });

      return { pendingIncoming, pendingOutgoing, approved };
    } catch (error) {
      console.error('Failed to load interests batch:', error);
      return {
        pendingIncoming: new Set(),
        pendingOutgoing: new Set(),
        approved: new Set()
      };
    }
  }
};


