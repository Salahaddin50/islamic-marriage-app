import { supabase } from '../config/supabase';
import { DigitalOceanMediaService } from './digitalocean-media.service';
import { PhotoVideoItem } from './photos-videos.service';

export interface MediaUploadOptions {
  userId: string;
  mediaType: 'photo' | 'video';
  isProfilePicture?: boolean;
  visibility?: 'public' | 'private' | 'matched_only';
  mediaOrder?: number;
}

export class MediaIntegrationService {
  /**
   * Complete media upload flow: DigitalOcean + Database
   */
  static async uploadMedia(
    file: File | Blob,
    options: MediaUploadOptions
  ): Promise<{
    success: boolean;
    data?: PhotoVideoItem;
    error?: string;
  }> {
    try {
      // 1. Upload to DigitalOcean Spaces
      const uploadResult = await DigitalOceanMediaService.uploadMedia(file, options);
      
      if (!uploadResult.success || !uploadResult.data) {
        return {
          success: false,
          error: uploadResult.error || 'Upload to DigitalOcean failed'
        };
      }

      // 2. If setting as profile picture, clear existing profile picture
      if (options.isProfilePicture && options.mediaType === 'photo') {
        await this.clearCurrentProfilePicture(options.userId);
      }

      // 3. Get next media order if not specified
      const mediaOrder = options.mediaOrder || await this.getNextMediaOrder(
        options.userId,
        options.mediaType
      );

      // 4. Create database reference
      const mediaReference = {
        user_id: options.userId,
        media_type: options.mediaType,
        external_url: uploadResult.data.cdnUrl, // Use CDN URL for faster delivery
        thumbnail_url: uploadResult.data.thumbnailUrl,
        is_profile_picture: options.isProfilePicture || false,
        visibility_level: options.visibility || 'private',
        media_order: mediaOrder,
        file_size_bytes: file.size,
        mime_type: file.type,
        // DigitalOcean specific data
        do_spaces_key: uploadResult.data.key,
        do_spaces_url: uploadResult.data.url,
        do_spaces_cdn_url: uploadResult.data.cdnUrl
      };

      const { data: dbRecord, error: dbError } = await supabase
        .from('media_references')
        .insert([mediaReference])
        .select()
        .single();

      if (dbError) {
        // If database creation fails, delete from DigitalOcean
        await DigitalOceanMediaService.deleteMedia(uploadResult.data.key);
        return {
          success: false,
          error: `Database reference creation failed: ${dbError.message}`
        };
      }

      // 5. Update user profile picture URL if this is a profile picture
      if (options.isProfilePicture && options.mediaType === 'photo') {
        await supabase
          .from('user_profiles')
          .update({
            profile_picture_url: uploadResult.data.cdnUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', options.userId);
      }

      return {
        success: true,
        data: dbRecord
      };

    } catch (error) {
      console.error('Media integration upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete media from both DigitalOcean and database
   */
  static async deleteMedia(
    mediaId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Get media record from database
      const { data: mediaRecord, error: fetchError } = await supabase
        .from('media_references')
        .select('*')
        .eq('id', mediaId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !mediaRecord) {
        return {
          success: false,
          error: 'Media not found or access denied'
        };
      }

      // 2. Delete from DigitalOcean Spaces
      if (mediaRecord.do_spaces_key) {
        const deleteResult = await DigitalOceanMediaService.deleteMedia(mediaRecord.do_spaces_key);
        if (!deleteResult.success) {
          console.warn('Failed to delete from DigitalOcean:', deleteResult.error);
          // Continue with database deletion even if DigitalOcean deletion fails
        }
      }

      // 3. Delete from database
      const { error: dbDeleteError } = await supabase
        .from('media_references')
        .delete()
        .eq('id', mediaId)
        .eq('user_id', userId);

      if (dbDeleteError) {
        return {
          success: false,
          error: `Database deletion failed: ${dbDeleteError.message}`
        };
      }

      // 4. If this was a profile picture, clear profile picture URL
      if (mediaRecord.is_profile_picture) {
        await supabase
          .from('user_profiles')
          .update({
            profile_picture_url: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      return { success: true };

    } catch (error) {
      console.error('Media integration delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Get all media for a user
   */
  static async getUserMedia(userId: string): Promise<{
    success: boolean;
    data?: {
      photos: PhotoVideoItem[];
      videos: PhotoVideoItem[];
    };
    error?: string;
  }> {
    try {
      const { data: mediaItems, error } = await supabase
        .from('media_references')
        .select('*')
        .eq('user_id', userId)
        .order('media_order', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `Failed to fetch media: ${error.message}`
        };
      }

      const photos = mediaItems?.filter(item => item.media_type === 'photo') || [];
      const videos = mediaItems?.filter(item => item.media_type === 'video') || [];

      return {
        success: true,
        data: { photos, videos }
      };

    } catch (error) {
      console.error('Get user media error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch media'
      };
    }
  }

  /**
   * Set photo as profile picture
   */
  static async setAsProfilePicture(
    photoId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Clear current profile picture
      await this.clearCurrentProfilePicture(userId);

      // 2. Set new profile picture
      const { data: updatedPhoto, error: updateError } = await supabase
        .from('media_references')
        .update({
          is_profile_picture: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', photoId)
        .eq('user_id', userId)
        .eq('media_type', 'photo')
        .select()
        .single();

      if (updateError || !updatedPhoto) {
        return {
          success: false,
          error: 'Failed to update profile picture or photo not found'
        };
      }

      // 3. Update user profile table
      await supabase
        .from('user_profiles')
        .update({
          profile_picture_url: updatedPhoto.external_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

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
   * Update media visibility
   */
  static async updateMediaVisibility(
    mediaId: string,
    userId: string,
    visibility: 'public' | 'private' | 'matched_only'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('media_references')
        .update({
          visibility_level: visibility,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaId)
        .eq('user_id', userId);

      if (error) {
        return {
          success: false,
          error: `Failed to update visibility: ${error.message}`
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

  /**
   * Get user storage statistics
   */
  static async getUserStorageStats(userId: string): Promise<{
    success: boolean;
    data?: {
      totalPhotos: number;
      totalVideos: number;
      totalStorageBytes: number;
      profilePictureSet: boolean;
    };
    error?: string;
  }> {
    try {
      const mediaResult = await this.getUserMedia(userId);
      
      if (!mediaResult.success || !mediaResult.data) {
        return {
          success: false,
          error: mediaResult.error || 'Failed to get media'
        };
      }

      const { photos, videos } = mediaResult.data;
      
      const totalPhotos = photos.length;
      const totalVideos = videos.length;
      const profilePictureSet = photos.some(photo => photo.is_profile_picture);
      
      const totalStorageBytes = [...photos, ...videos].reduce((total, item) => {
        return total + (item.file_size_bytes || 0);
      }, 0);

      return {
        success: true,
        data: {
          totalPhotos,
          totalVideos,
          totalStorageBytes,
          profilePictureSet
        }
      };

    } catch (error) {
      console.error('Get storage stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get storage stats'
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

  private static async getNextMediaOrder(
    userId: string,
    mediaType: 'photo' | 'video'
  ): Promise<number> {
    const { data } = await supabase
      .from('media_references')
      .select('media_order')
      .eq('user_id', userId)
      .eq('media_type', mediaType)
      .order('media_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    return (data?.media_order || 0) + 1;
  }
}
