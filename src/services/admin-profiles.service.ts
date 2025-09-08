import { supabase } from '../config/supabase';
import AdminAuthService from './admin-auth.service';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  age: number;
  email?: string;
  date_of_birth: string;
  country?: string;
  city?: string;
  admin_approved?: boolean | null;
  created_at: string;
  updated_at: string;
  // Additional profile fields
  occupation?: string;
  education_level?: string;
  height_cm?: number;
  weight_kg?: number;
  bio?: string;
  religious_level?: string;
  marital_status?: string;
}

export interface MediaReference {
  id: string;
  user_id: string;
  media_type: 'photo' | 'video';
  external_url: string;
  thumbnail_url?: string;
  is_profile_picture: boolean;
  visibility_level: string;
  media_order: number;
  file_size_bytes?: number;
  mime_type?: string;
  created_at: string;
}

export interface ProfileFilters {
  gender?: 'male' | 'female';
  admin_approved?: boolean | null;
  country?: string;
  city?: string;
  age_min?: number;
  age_max?: number;
  created_from?: string;
  created_to?: string;
  search?: string;
}

class AdminProfilesService {
  /**
   * Get profiles with filters and pagination
   */
  async getProfiles(
    filters: ProfileFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data?: {
      profiles: UserProfile[];
      total: number;
      page: number;
      totalPages: number;
    };
    error?: string;
  }> {
    try {
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          users!inner(email)
        `, { count: 'exact' });

      // Apply filters
      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }

      if (filters.admin_approved !== undefined) {
        if (filters.admin_approved === null) {
          query = query.is('admin_approved', null);
        } else {
          query = query.eq('admin_approved', filters.admin_approved);
        }
      }

      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      if (filters.city) {
        query = query.eq('city', filters.city);
      }

      if (filters.age_min) {
        query = query.gte('age', filters.age_min);
      }

      if (filters.age_max) {
        query = query.lte('age', filters.age_max);
      }

      if (filters.created_from) {
        query = query.gte('created_at', filters.created_from);
      }

      if (filters.created_to) {
        query = query.lte('created_at', filters.created_to);
      }

      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,users.email.ilike.%${filters.search}%`);
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

      // Format the data to include email from joined users table
      const profiles = data?.map(profile => ({
        ...profile,
        email: (profile as any).users?.email
      })) || [];

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: {
          profiles,
          total: count || 0,
          page,
          totalPages
        }
      };

    } catch (error: any) {
      console.error('Get profiles error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get media for a specific user
   */
  async getUserMedia(userId: string): Promise<{
    success: boolean;
    data?: MediaReference[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('media_references')
        .select('*')
        .eq('user_id', userId)
        .order('media_order', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };

    } catch (error: any) {
      console.error('Get user media error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve user profile
   */
  async approveProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ admin_approved: true })
        .eq('id', profileId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log admin activity
      await AdminAuthService.logActivity(
        'approve_profile',
        'user_profiles',
        profileId,
        { action: 'approved' }
      );

      return { success: true };

    } catch (error: any) {
      console.error('Approve profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject user profile
   */
  async rejectProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ admin_approved: false })
        .eq('id', profileId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log admin activity
      await AdminAuthService.logActivity(
        'reject_profile',
        'user_profiles',
        profileId,
        { action: 'rejected' }
      );

      return { success: true };

    } catch (error: any) {
      console.error('Reject profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete media item
   */
  async deleteMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get media details first for logging
      const { data: media, error: getError } = await supabase
        .from('media_references')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (getError) {
        return { success: false, error: getError.message };
      }

      // Delete from database
      const { error } = await supabase
        .from('media_references')
        .delete()
        .eq('id', mediaId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log admin activity
      await AdminAuthService.logActivity(
        'delete_media',
        'media_references',
        mediaId,
        {
          user_id: media.user_id,
          media_type: media.media_type,
          external_url: media.external_url
        }
      );

      return { success: true };

    } catch (error: any) {
      console.error('Delete media error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get profile details with media
   */
  async getProfileDetails(profileId: string): Promise<{
    success: boolean;
    data?: {
      profile: UserProfile;
      media: MediaReference[];
    };
    error?: string;
  }> {
    try {
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          users!inner(email)
        `)
        .eq('id', profileId)
        .single();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      // Get media
      const mediaResult = await this.getUserMedia(profileData.user_id);
      
      if (!mediaResult.success) {
        return { success: false, error: mediaResult.error };
      }

      const profile = {
        ...profileData,
        email: (profileData as any).users?.email
      };

      return {
        success: true,
        data: {
          profile,
          media: mediaResult.data || []
        }
      };

    } catch (error: any) {
      console.error('Get profile details error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available filter options
   */
  async getFilterOptions(): Promise<{
    success: boolean;
    data?: {
      countries: string[];
      cities: string[];
      ageRange: { min: number; max: number };
    };
    error?: string;
  }> {
    try {
      // Get unique countries
      const { data: countries, error: countriesError } = await supabase
        .from('user_profiles')
        .select('country')
        .not('country', 'is', null)
        .order('country');

      // Get unique cities
      const { data: cities, error: citiesError } = await supabase
        .from('user_profiles')
        .select('city')
        .not('city', 'is', null)
        .order('city');

      // Get age range
      const { data: ageRange, error: ageError } = await supabase
        .from('user_profiles')
        .select('age')
        .not('age', 'is', null);

      if (countriesError || citiesError || ageError) {
        console.warn('Some filter options failed to load');
      }

      const uniqueCountries = [...new Set(countries?.map(c => c.country).filter(Boolean))] as string[];
      const uniqueCities = [...new Set(cities?.map(c => c.city).filter(Boolean))] as string[];
      
      const ages = ageRange?.map(a => a.age).filter(Boolean) || [];
      const minAge = ages.length > 0 ? Math.min(...ages) : 18;
      const maxAge = ages.length > 0 ? Math.max(...ages) : 80;

      return {
        success: true,
        data: {
          countries: uniqueCountries,
          cities: uniqueCities,
          ageRange: { min: minAge, max: maxAge }
        }
      };

    } catch (error: any) {
      console.error('Get filter options error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk approve profiles
   */
  async bulkApproveProfiles(profileIds: string[]): Promise<{
    success: boolean;
    results?: { success: number; failed: number };
    error?: string;
  }> {
    try {
      let successCount = 0;
      let failedCount = 0;

      for (const profileId of profileIds) {
        const result = await this.approveProfile(profileId);
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
      console.error('Bulk approve profiles error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk reject profiles
   */
  async bulkRejectProfiles(profileIds: string[]): Promise<{
    success: boolean;
    results?: { success: number; failed: number };
    error?: string;
  }> {
    try {
      let successCount = 0;
      let failedCount = 0;

      for (const profileId of profileIds) {
        const result = await this.rejectProfile(profileId);
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
      console.error('Bulk reject profiles error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AdminProfilesService();
