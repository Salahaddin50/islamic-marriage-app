import { supabase } from '../config/supabase';
import { MediaService } from './media.service';

export interface PhotoVideoItem {
  id: string;
  user_id: string;
  media_type: 'photo' | 'video';
  external_url: string;
  thumbnail_url?: string;
  media_order: number;
  is_profile_picture: boolean;
  is_verified: boolean;
  visibility_level: 'public' | 'private' | 'matched_only';
  file_size_bytes?: number;
  mime_type?: string;
  upload_date: string;
  created_at: string;
}

export interface MediaUploadResult {
  success: boolean;
  data?: PhotoVideoItem;
  error?: string;
}

export interface MediaListResult {
  success: boolean;
  data?: {
    photos: PhotoVideoItem[];
    videos: PhotoVideoItem[];
  };
  error?: string;
}

export class PhotosVideosService {
  
  /**
   * Get all photos and videos for current user
   */
  static async getUserMediaItems(): Promise<MediaListResult> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Fetch media references from database
      const { data: mediaItems, error } = await supabase
        .from('media_references')
        .select('*')
        .eq('user_id', user.id)
        .order('media_order', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `Failed to fetch media: ${error.message}`
        };
      }

      // Separate photos and videos
      const photos = mediaItems?.filter(item => item.media_type === 'photo') || [];
      const videos = mediaItems?.filter(item => item.media_type === 'video') || [];

      return {
        success: true,
        data: {
          photos,
          videos
        }
      };

    } catch (error) {
      console.error('Get media items error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch media'
      };
    }
  }

  /**
   * Upload photo or video
   */
  static async uploadMediaItem(
    file: File | Blob,
    mediaType: 'photo' | 'video',
    options: {
      isProfilePicture?: boolean;
      visibility?: 'public' | 'private' | 'matched_only';
      order?: number;
    } = {}
  ): Promise<MediaUploadResult> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Validate file size and type
      const validation = this.validateFile(file, mediaType);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // If setting as profile picture, remove current profile picture flag
      if (options.isProfilePicture && mediaType === 'photo') {
        await this.clearCurrentProfilePicture(user.id);
      }

      // Get next order if not specified
      let mediaOrder = options.order;
      if (!mediaOrder) {
        mediaOrder = await this.getNextMediaOrder(user.id, mediaType);
      }

      // Upload using MediaService
      const uploadResult = await MediaService.uploadMedia(file, {
        userId: user.id,
        mediaType,
        isProfilePicture: options.isProfilePicture || false,
        visibility: options.visibility || 'private',
        mediaOrder
      });

      return uploadResult;

    } catch (error) {
      console.error('Upload media error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete photo or video
   */
  static async deleteMediaItem(mediaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Use MediaService to delete (handles both DB and external server)
      const result = await MediaService.deleteMedia(mediaId, user.id);
      
      return result;

    } catch (error) {
      console.error('Delete media error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Set photo as profile picture
   */
  static async setAsProfilePicture(photoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // First, clear any existing profile picture
      await this.clearCurrentProfilePicture(user.id);

      // Set the selected photo as profile picture
      const { error: updateError } = await supabase
        .from('media_references')
        .update({ 
          is_profile_picture: true
          // Removed updated_at field as it might not exist in the table
        })
        .eq('id', photoId)
        .eq('user_id', user.id)
        .eq('media_type', 'photo');

      if (updateError) {
        return {
          success: false,
          error: `Failed to set profile picture: ${updateError.message}`
        };
      }

      // Also update the user_profiles table with the new profile picture URL
      const { data: mediaRef } = await supabase
        .from('media_references')
        .select('external_url')
        .eq('id', photoId)
        .single();

      if (mediaRef) {
        await supabase
          .from('user_profiles')
          .update({ 
            profile_picture_url: mediaRef.external_url
            // Removed updated_at field as it might not exist in the table
          })
          .eq('user_id', user.id);
      }

      return { success: true };

    } catch (error) {
      console.error('Set profile picture error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set profile picture'
      };
    }
  }

  /**
   * Reorder media items
   */
  static async reorderMediaItems(
    mediaType: 'photo' | 'video',
    orderedIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Update order for each item
      const promises = orderedIds.map((id, index) =>
        supabase
          .from('media_references')
          .update({ 
            media_order: index + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .eq('media_type', mediaType)
      );

      await Promise.all(promises);

      return { success: true };

    } catch (error) {
      console.error('Reorder media error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reorder failed'
      };
    }
  }

  /**
   * Update media visibility
   */
  static async updateMediaVisibility(
    mediaId: string,
    visibility: 'public' | 'private' | 'matched_only'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      const { error: updateError } = await supabase
        .from('media_references')
        .update({ 
          visibility_level: visibility,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaId)
        .eq('user_id', user.id);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update visibility: ${updateError.message}`
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Update visibility error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  // Private helper methods

  private static async clearCurrentProfilePicture(userId: string): Promise<void> {
    await supabase
      .from('media_references')
      .update({ is_profile_picture: false })
      .eq('user_id', userId)
      .eq('media_type', 'photo')
      .eq('is_profile_picture', true);
  }

  private static async getNextMediaOrder(userId: string, mediaType: 'photo' | 'video'): Promise<number> {
    const { data } = await supabase
      .from('media_references')
      .select('media_order')
      .eq('user_id', userId)
      .eq('media_type', mediaType)
      .order('media_order', { ascending: false })
      .limit(1);

    const lastOrder = Array.isArray(data) && data.length > 0 ? (data[0] as any).media_order : 0;
    return (lastOrder || 0) + 1;
  }

  private static validateFile(file: File | Blob, mediaType: 'photo' | 'video'): { isValid: boolean; error?: string } {
    // File size limits
    const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

    if (mediaType === 'photo') {
      if (file.size > MAX_PHOTO_SIZE) {
        return { isValid: false, error: 'Photo size must be less than 10MB' };
      }
      
      const photoTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (file.type && !photoTypes.includes(file.type)) {
        return { isValid: false, error: 'Photo must be JPEG, PNG, or WebP format' };
      }
    } else {
      if (file.size > MAX_VIDEO_SIZE) {
        return { isValid: false, error: 'Video size must be less than 100MB' };
      }
      
      const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (file.type && !videoTypes.includes(file.type)) {
        return { isValid: false, error: 'Video must be MP4, WebM, or MOV format' };
      }
    }

    return { isValid: true };
  }
}
