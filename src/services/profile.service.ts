import { supabase } from '../config/supabase';
import type { GenderType } from '../types/database.types';

export interface UserProfile {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  gender: GenderType;
  date_of_birth: string;
  phone_code?: string;
  mobile_number?: string;
  country?: string;
  city?: string;
  occupation?: string;
  education_level?: string;
  height_cm?: number;
  weight_kg?: number;
  eye_color?: string;
  hair_color?: string;
  skin_tone?: string;
  body_type?: string;
  housing_type?: string;
  living_condition?: string;
  social_condition?: string;
  work_status?: string;
  monthly_income?: string;
  profile_picture_url?: string;
  about_me?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone_code?: string;
  mobile_number?: string;
  occupation?: string;
  date_of_birth?: string;
  gender?: GenderType;
  country?: string;
  city?: string;
  about_me?: string;
}

export class ProfileService {
  /**
   * Get current user's profile
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Fetch user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found
          return null;
        }
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      return profile;
    } catch (error) {
      console.error('Get current user profile error:', error);
      return null;
    }
  }

  /**
   * Update current user's profile
   */
  static async updateCurrentUserProfile(updates: UpdateProfileData): Promise<boolean> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Prepare update data with timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Upload and update profile picture
   */
  static async updateProfilePicture(imageUri: string): Promise<string | null> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Convert image URI to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Generate unique filename
      const filename = `profile_${user.id}_${Date.now()}.jpg`;
      const filePath = `profiles/${filename}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-media')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      // Update profile with new profile picture URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update profile picture: ${updateError.message}`);
      }

      return publicUrl;
    } catch (error) {
      console.error('Update profile picture error:', error);
      throw error;
    }
  }

  /**
   * Get user's profile by user ID (for viewing other profiles)
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No profile found
        }
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      return profile;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Delete current user's profile
   */
  static async deleteCurrentUserProfile(): Promise<boolean> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Soft delete - update profile status instead of hard delete
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          profile_status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to delete profile: ${updateError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Delete profile error:', error);
      throw error;
    }
  }
}

export default ProfileService;
