import { supabase } from '@/src/config/supabase';

export type NotificationType = 
  | 'photo_request' 
  | 'photo_shared' 
  | 'video_call_request' 
  | 'video_call_approved' 
  | 'whatsapp_request' 
  | 'whatsapp_shared'
  | 'interest_received'
  | 'interest_accepted'
  | 'meet_request_received'
  | 'meet_request_accepted'
  | 'message_received'
  | 'profile_approved';

export interface NotificationRecord {
  id: string;
  user_id: string;
  sender_id: string;
  sender_name: string;
  sender_age?: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface CreateNotificationData {
  user_id: string;
  sender_id: string;
  sender_name: string;
  sender_age?: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: {
    [key: string]: any;
  };
}

export const NotificationsService = {
  // Create a new notification
  async create(data: CreateNotificationData): Promise<NotificationRecord> {
    console.log('Creating notification:', data);
    
    const { data: result, error } = await supabase
      .from('notifications')
      .insert({
        ...data,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error('Notification creation error:', error);
      throw error;
    }
    
    console.log('Notification created successfully:', result);
    return result as NotificationRecord;
  },

  // Get all notifications for current user
  async getForUser(userId: string, limit: number = 50, offset: number = 0): Promise<NotificationRecord[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data as NotificationRecord[]) || [];
  },

  // Get unread count for current user
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Mark all notifications as read for user
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  // Delete notification
  async delete(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Helper methods to create specific notification types
  async createPhotoRequest(receiverId: string, senderName: string, senderAge: number): Promise<NotificationRecord> {
    return this.create({
      user_id: receiverId,
      sender_id: await this.getCurrentUserId(),
      sender_name: senderName,
      sender_age: senderAge,
      type: 'photo_request',
      title: 'Photo Request',
      message: `${senderName}, ${senderAge} requests your photo`
    });
  },

  async createPhotoShared(receiverId: string, senderName: string, senderAge: number): Promise<NotificationRecord> {
    return this.create({
      user_id: receiverId,
      sender_id: await this.getCurrentUserId(),
      sender_name: senderName,
      sender_age: senderAge,
      type: 'photo_shared',
      title: 'Photos Shared',
      message: `${senderName}, ${senderAge} has shared photos with you`
    });
  },

  async createVideoCallRequest(receiverId: string, senderName: string, senderAge: number): Promise<NotificationRecord> {
    return this.create({
      user_id: receiverId,
      sender_id: await this.getCurrentUserId(),
      sender_name: senderName,
      sender_age: senderAge,
      type: 'video_call_request',
      title: 'Video Call Request',
      message: `${senderName}, ${senderAge} requests a video call`
    });
  },

  async createVideoCallApproved(receiverId: string, senderName: string, senderAge: number): Promise<NotificationRecord> {
    return this.create({
      user_id: receiverId,
      sender_id: await this.getCurrentUserId(),
      sender_name: senderName,
      sender_age: senderAge,
      type: 'video_call_approved',
      title: 'Video Call Approved',
      message: `${senderName}, ${senderAge} approved your video call request`
    });
  },

  async createWhatsAppRequest(receiverId: string, senderName: string, senderAge: number): Promise<NotificationRecord> {
    return this.create({
      user_id: receiverId,
      sender_id: await this.getCurrentUserId(),
      sender_name: senderName,
      sender_age: senderAge,
      type: 'whatsapp_request',
      title: 'WhatsApp Request',
      message: `${senderName}, ${senderAge} requests your whatsapp number`
    });
  },

  async createWhatsAppShared(receiverId: string, senderName: string, senderAge: number): Promise<NotificationRecord> {
    return this.create({
      user_id: receiverId,
      sender_id: await this.getCurrentUserId(),
      sender_name: senderName,
      sender_age: senderAge,
      type: 'whatsapp_shared',
      title: 'WhatsApp Shared',
      message: `${senderName}, ${senderAge} has shared whatsapp number`
    });
  },

  async createInterestReceived(receiverId: string, senderName: string, senderAge: number): Promise<NotificationRecord> {
    const senderId = await this.getCurrentUserId();
    return this.create({
      user_id: receiverId,
      sender_id: senderId,
      sender_name: senderName,
      sender_age: senderAge,
      type: 'photo_request', // Using photo_request type as that's what the user expects
      title: 'Photo Request',
      message: `${senderName}, ${senderAge} requests your photo`
    });
  },

  async createInterestAccepted(receiverId: string, senderName: string, senderAge: number): Promise<NotificationRecord> {
    const senderId = await this.getCurrentUserId();
    return this.create({
      user_id: receiverId,
      sender_id: senderId,
      sender_name: senderName,
      sender_age: senderAge,
      type: 'photo_shared', // Using photo_shared type for when interest is accepted
      title: 'Photos Shared',
      message: `${senderName}, ${senderAge} has shared photos with you`
    });
  },

  async createMeetRequestReceived(receiverId: string, senderName: string, senderAge: number): Promise<NotificationRecord> {
    return this.create({
      user_id: receiverId,
      sender_id: await this.getCurrentUserId(),
      sender_name: senderName,
      sender_age: senderAge,
      type: 'meet_request_received',
      title: 'Meet Request',
      message: `${senderName}, ${senderAge} wants to meet you`
    });
  },

  async createMeetRequestAccepted(receiverId: string, senderName: string, senderAge: number): Promise<NotificationRecord> {
    return this.create({
      user_id: receiverId,
      sender_id: await this.getCurrentUserId(),
      sender_name: senderName,
      sender_age: senderAge,
      type: 'meet_request_accepted',
      title: 'Meet Request Accepted',
      message: `${senderName}, ${senderAge} accepted your meet request`
    });
  },

  async createMessageReceived(receiverId: string, senderName: string, senderAge: number, messagePreview: string): Promise<NotificationRecord> {
    return this.create({
      user_id: receiverId,
      sender_id: await this.getCurrentUserId(),
      sender_name: senderName,
      sender_age: senderAge,
      type: 'message_received',
      title: 'New Message',
      message: `${senderName}: ${messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview}`,
      metadata: { preview: messagePreview }
    });
  },

  async createProfileApproved(receiverId: string): Promise<NotificationRecord> {
    return this.create({
      user_id: receiverId,
      sender_id: 'admin', // Admin system sender
      sender_name: 'Admin Team',
      sender_age: undefined,
      type: 'profile_approved',
      title: 'Profile Approved! 🎉',
      message: 'Congratulations! Your profile has been approved and is now visible to other users. Start exploring and connecting with people!'
    });
  },

  // Helper to get current user ID
  async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  },

  // Real-time subscription for notifications
  subscribeToNotifications(userId: string, callback: (notification: NotificationRecord) => void) {
    return supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as NotificationRecord);
      })
      .subscribe();
  }
};
