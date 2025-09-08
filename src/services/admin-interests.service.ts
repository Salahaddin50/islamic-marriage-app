import { supabase } from '../config/supabase';
import AdminAuthService from './admin-auth.service';

export interface Interest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  // Joined data
  sender_name?: string;
  sender_email?: string;
  sender_age?: number;
  receiver_name?: string;
  receiver_email?: string;
  receiver_age?: number;
}

export interface MeetRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  scheduled_at?: string;
  meet_link?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  sender_name?: string;
  sender_email?: string;
  sender_age?: number;
  receiver_name?: string;
  receiver_email?: string;
  receiver_age?: number;
}

export interface InterestFilters {
  status?: 'pending' | 'accepted' | 'rejected';
  sender_gender?: 'male' | 'female';
  receiver_gender?: 'male' | 'female';
  created_from?: string;
  created_to?: string;
  search?: string;
}

export interface MeetRequestFilters {
  status?: 'pending' | 'accepted' | 'rejected';
  sender_gender?: 'male' | 'female';
  receiver_gender?: 'male' | 'female';
  created_from?: string;
  created_to?: string;
  scheduled_from?: string;
  scheduled_to?: string;
  search?: string;
}

class AdminInterestsService {
  /**
   * Get interests with filters and pagination
   */
  async getInterests(
    filters: InterestFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data?: {
      interests: Interest[];
      total: number;
      page: number;
      totalPages: number;
    };
    error?: string;
  }> {
    try {
      let query = supabase
        .from('interests')
        .select(`
          *,
          sender_profile:user_profiles!interests_sender_id_fkey(first_name, last_name, age, gender, users!inner(email)),
          receiver_profile:user_profiles!interests_receiver_id_fkey(first_name, last_name, age, gender, users!inner(email))
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.created_from) {
        query = query.gte('created_at', filters.created_from);
      }

      if (filters.created_to) {
        query = query.lte('created_at', filters.created_to);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // Format the data to include joined user information
      const interests = data?.map(interest => ({
        ...interest,
        sender_name: `${(interest as any).sender_profile?.first_name} ${(interest as any).sender_profile?.last_name}`,
        sender_email: (interest as any).sender_profile?.users?.email,
        sender_age: (interest as any).sender_profile?.age,
        receiver_name: `${(interest as any).receiver_profile?.first_name} ${(interest as any).receiver_profile?.last_name}`,
        receiver_email: (interest as any).receiver_profile?.users?.email,
        receiver_age: (interest as any).receiver_profile?.age,
      })) || [];

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: {
          interests,
          total: count || 0,
          page,
          totalPages
        }
      };

    } catch (error: any) {
      console.error('Get interests error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get meet requests with filters and pagination
   */
  async getMeetRequests(
    filters: MeetRequestFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data?: {
      meetRequests: MeetRequest[];
      total: number;
      page: number;
      totalPages: number;
    };
    error?: string;
  }> {
    try {
      let query = supabase
        .from('meet_requests')
        .select(`
          *,
          sender_profile:user_profiles!meet_requests_sender_id_fkey(first_name, last_name, age, gender, users!inner(email)),
          receiver_profile:user_profiles!meet_requests_receiver_id_fkey(first_name, last_name, age, gender, users!inner(email))
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.created_from) {
        query = query.gte('created_at', filters.created_from);
      }

      if (filters.created_to) {
        query = query.lte('created_at', filters.created_to);
      }

      if (filters.scheduled_from) {
        query = query.gte('scheduled_at', filters.scheduled_from);
      }

      if (filters.scheduled_to) {
        query = query.lte('scheduled_at', filters.scheduled_to);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // Format the data to include joined user information
      const meetRequests = data?.map(meetRequest => ({
        ...meetRequest,
        sender_name: `${(meetRequest as any).sender_profile?.first_name} ${(meetRequest as any).sender_profile?.last_name}`,
        sender_email: (meetRequest as any).sender_profile?.users?.email,
        sender_age: (meetRequest as any).sender_profile?.age,
        receiver_name: `${(meetRequest as any).receiver_profile?.first_name} ${(meetRequest as any).receiver_profile?.last_name}`,
        receiver_email: (meetRequest as any).receiver_profile?.users?.email,
        receiver_age: (meetRequest as any).receiver_profile?.age,
      })) || [];

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: {
          meetRequests,
          total: count || 0,
          page,
          totalPages
        }
      };

    } catch (error: any) {
      console.error('Get meet requests error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete interest
   */
  async deleteInterest(interestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get interest details first for logging
      const { data: interest, error: getError } = await supabase
        .from('interests')
        .select('*')
        .eq('id', interestId)
        .single();

      if (getError) {
        return { success: false, error: getError.message };
      }

      // Delete the interest
      const { error } = await supabase
        .from('interests')
        .delete()
        .eq('id', interestId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log admin activity
      await AdminAuthService.logActivity(
        'delete_interest',
        'interests',
        interestId,
        {
          sender_id: interest.sender_id,
          receiver_id: interest.receiver_id,
          status: interest.status
        }
      );

      return { success: true };

    } catch (error: any) {
      console.error('Delete interest error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete meet request
   */
  async deleteMeetRequest(meetRequestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get meet request details first for logging
      const { data: meetRequest, error: getError } = await supabase
        .from('meet_requests')
        .select('*')
        .eq('id', meetRequestId)
        .single();

      if (getError) {
        return { success: false, error: getError.message };
      }

      // Delete the meet request
      const { error } = await supabase
        .from('meet_requests')
        .delete()
        .eq('id', meetRequestId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log admin activity
      await AdminAuthService.logActivity(
        'delete_meet_request',
        'meet_requests',
        meetRequestId,
        {
          sender_id: meetRequest.sender_id,
          receiver_id: meetRequest.receiver_id,
          status: meetRequest.status,
          scheduled_at: meetRequest.scheduled_at
        }
      );

      return { success: true };

    } catch (error: any) {
      console.error('Delete meet request error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get interests analytics
   */
  async getInterestsAnalytics(): Promise<{
    success: boolean;
    data?: {
      totalInterests: number;
      pendingInterests: number;
      acceptedInterests: number;
      rejectedInterests: number;
      todayInterests: number;
      weekInterests: number;
    };
    error?: string;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: interests, error } = await supabase
        .from('interests')
        .select('status, created_at');

      if (error) {
        return { success: false, error: error.message };
      }

      const totalInterests = interests?.length || 0;
      const pendingInterests = interests?.filter(i => i.status === 'pending').length || 0;
      const acceptedInterests = interests?.filter(i => i.status === 'accepted').length || 0;
      const rejectedInterests = interests?.filter(i => i.status === 'rejected').length || 0;
      const todayInterests = interests?.filter(i => i.created_at.startsWith(today)).length || 0;
      const weekInterests = interests?.filter(i => i.created_at >= weekAgo).length || 0;

      return {
        success: true,
        data: {
          totalInterests,
          pendingInterests,
          acceptedInterests,
          rejectedInterests,
          todayInterests,
          weekInterests
        }
      };

    } catch (error: any) {
      console.error('Get interests analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get meet requests analytics
   */
  async getMeetRequestsAnalytics(): Promise<{
    success: boolean;
    data?: {
      totalMeetRequests: number;
      pendingMeetRequests: number;
      acceptedMeetRequests: number;
      rejectedMeetRequests: number;
      todayMeetRequests: number;
      weekMeetRequests: number;
      scheduledMeetings: number;
    };
    error?: string;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: meetRequests, error } = await supabase
        .from('meet_requests')
        .select('status, created_at, scheduled_at');

      if (error) {
        return { success: false, error: error.message };
      }

      const totalMeetRequests = meetRequests?.length || 0;
      const pendingMeetRequests = meetRequests?.filter(m => m.status === 'pending').length || 0;
      const acceptedMeetRequests = meetRequests?.filter(m => m.status === 'accepted').length || 0;
      const rejectedMeetRequests = meetRequests?.filter(m => m.status === 'rejected').length || 0;
      const todayMeetRequests = meetRequests?.filter(m => m.created_at.startsWith(today)).length || 0;
      const weekMeetRequests = meetRequests?.filter(m => m.created_at >= weekAgo).length || 0;
      const scheduledMeetings = meetRequests?.filter(m => m.scheduled_at && new Date(m.scheduled_at) > new Date()).length || 0;

      return {
        success: true,
        data: {
          totalMeetRequests,
          pendingMeetRequests,
          acceptedMeetRequests,
          rejectedMeetRequests,
          todayMeetRequests,
          weekMeetRequests,
          scheduledMeetings
        }
      };

    } catch (error: any) {
      console.error('Get meet requests analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk delete interests
   */
  async bulkDeleteInterests(interestIds: string[]): Promise<{
    success: boolean;
    results?: { success: number; failed: number };
    error?: string;
  }> {
    try {
      let successCount = 0;
      let failedCount = 0;

      for (const interestId of interestIds) {
        const result = await this.deleteInterest(interestId);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      return {
        success: true,
        results: { success: successCount, failed: failedCount }
      };

    } catch (error: any) {
      console.error('Bulk delete interests error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk delete meet requests
   */
  async bulkDeleteMeetRequests(meetRequestIds: string[]): Promise<{
    success: boolean;
    results?: { success: number; failed: number };
    error?: string;
  }> {
    try {
      let successCount = 0;
      let failedCount = 0;

      for (const meetRequestId of meetRequestIds) {
        const result = await this.deleteMeetRequest(meetRequestId);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      return {
        success: true,
        results: { success: successCount, failed: failedCount }
      };

    } catch (error: any) {
      console.error('Bulk delete meet requests error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AdminInterestsService();
