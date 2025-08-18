import { PhotosVideosService, PhotoVideoItem, MediaUploadResult, MediaListResult } from '../services/photos-videos.service';
import { MediaIntegrationService } from '../services/media-integration.service';
import { supabase } from '../config/supabase';

/**
 * API layer for Photos and Videos functionality
 * This layer handles the business logic and validation before calling services
 */
export class PhotosVideosAPI {
  
  /**
   * Get all photos and videos for the current user
   */
  static async getMyMedia(): Promise<MediaListResult> {
    try {
      // Get current user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return {
          success: false,
          error: 'Please login first'
        };
      }

      // Use DigitalOcean integration service
      const result = await MediaIntegrationService.getUserMedia(user.id);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    } catch (error) {
      console.error('API: Get media error:', error);
      return {
        success: false,
        error: 'Failed to fetch media items'
      };
    }
  }

  /**
   * Upload a new photo
   */
  static async uploadPhoto(
    file: File | Blob,
    options: {
      isProfilePicture?: boolean;
      visibility?: 'public' | 'private' | 'matched_only';
    } = {}
  ): Promise<MediaUploadResult> {
    try {
      // Validate that it's actually a photo
      if (file.type && !file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'File must be an image'
        };
      }

      // Get current user ID (replace with your auth logic)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return {
          success: false,
          error: 'Please login first'
        };
      }

      // Use DigitalOcean integration service
      const result = await MediaIntegrationService.uploadMedia(file, {
        userId: user.id,
        mediaType: 'photo',
        isProfilePicture: options.isProfilePicture,
        visibility: options.visibility
      });

      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    } catch (error) {
      console.error('API: Upload photo error:', error);
      return {
        success: false,
        error: 'Failed to upload photo'
      };
    }
  }

  /**
   * Upload a new video
   */
  static async uploadVideo(
    file: File | Blob,
    options: {
      visibility?: 'public' | 'private' | 'matched_only';
    } = {}
  ): Promise<MediaUploadResult> {
    try {
      // Validate that it's actually a video
      if (file.type && !file.type.startsWith('video/')) {
        return {
          success: false,
          error: 'File must be a video'
        };
      }

      // Get current user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return {
          success: false,
          error: 'Please login first'
        };
      }

      // Use DigitalOcean integration service
      const result = await MediaIntegrationService.uploadMedia(file, {
        userId: user.id,
        mediaType: 'video',
        visibility: options.visibility
      });

      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    } catch (error) {
      console.error('API: Upload video error:', error);
      return {
        success: false,
        error: 'Failed to upload video'
      };
    }
  }

  /**
   * Delete a photo or video
   */
  static async deleteMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!mediaId) {
        return {
          success: false,
          error: 'Media ID is required'
        };
      }

      // Get current user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return {
          success: false,
          error: 'Please login first'
        };
      }

      return await MediaIntegrationService.deleteMedia(mediaId, user.id);
    } catch (error) {
      console.error('API: Delete media error:', error);
      return {
        success: false,
        error: 'Failed to delete media'
      };
    }
  }

  /**
   * Set a photo as profile picture
   */
  static async setProfilePicture(photoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!photoId) {
        return {
          success: false,
          error: 'Photo ID is required'
        };
      }

      // Get current user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return {
          success: false,
          error: 'Please login first'
        };
      }

      return await MediaIntegrationService.setAsProfilePicture(photoId, user.id);
    } catch (error) {
      console.error('API: Set profile picture error:', error);
      return {
        success: false,
        error: 'Failed to set profile picture'
      };
    }
  }

  /**
   * Reorder photos
   */
  static async reorderPhotos(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (!orderedIds || orderedIds.length === 0) {
        return {
          success: false,
          error: 'Photo IDs are required'
        };
      }

      return await PhotosVideosService.reorderMediaItems('photo', orderedIds);
    } catch (error) {
      console.error('API: Reorder photos error:', error);
      return {
        success: false,
        error: 'Failed to reorder photos'
      };
    }
  }

  /**
   * Reorder videos
   */
  static async reorderVideos(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (!orderedIds || orderedIds.length === 0) {
        return {
          success: false,
          error: 'Video IDs are required'
        };
      }

      return await PhotosVideosService.reorderMediaItems('video', orderedIds);
    } catch (error) {
      console.error('API: Reorder videos error:', error);
      return {
        success: false,
        error: 'Failed to reorder videos'
      };
    }
  }

  /**
   * Update media visibility
   */
  static async updateVisibility(
    mediaId: string,
    visibility: 'public' | 'private' | 'matched_only'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!mediaId) {
        return {
          success: false,
          error: 'Media ID is required'
        };
      }

      const validVisibilities = ['public', 'private', 'matched_only'];
      if (!validVisibilities.includes(visibility)) {
        return {
          success: false,
          error: 'Invalid visibility level'
        };
      }

      return await PhotosVideosService.updateMediaVisibility(mediaId, visibility);
    } catch (error) {
      console.error('API: Update visibility error:', error);
      return {
        success: false,
        error: 'Failed to update visibility'
      };
    }
  }

  /**
   * Batch upload multiple photos
   */
  static async uploadMultiplePhotos(
    files: (File | Blob)[],
    options: {
      visibility?: 'public' | 'private' | 'matched_only';
    } = {}
  ): Promise<{
    success: boolean;
    results: MediaUploadResult[];
    successCount: number;
    failCount: number;
  }> {
    try {
      const results: MediaUploadResult[] = [];
      let successCount = 0;
      let failCount = 0;

      // Upload files one by one to avoid overwhelming the server
      for (const file of files) {
        const result = await this.uploadPhoto(file, options);
        results.push(result);
        
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return {
        success: successCount > 0,
        results,
        successCount,
        failCount
      };
    } catch (error) {
      console.error('API: Batch upload error:', error);
      return {
        success: false,
        results: [],
        successCount: 0,
        failCount: files.length
      };
    }
  }

  /**
   * Get media statistics for the current user
   */
  static async getMediaStats(): Promise<{
    success: boolean;
    data?: {
      totalPhotos: number;
      totalVideos: number;
      profilePictureSet: boolean;
      storageUsed: number; // in bytes
    };
    error?: string;
  }> {
    try {
      const mediaResult = await this.getMyMedia();
      
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
      
      const storageUsed = [...photos, ...videos].reduce((total, item) => {
        return total + (item.file_size_bytes || 0);
      }, 0);

      return {
        success: true,
        data: {
          totalPhotos,
          totalVideos,
          profilePictureSet,
          storageUsed
        }
      };
    } catch (error) {
      console.error('API: Get media stats error:', error);
      return {
        success: false,
        error: 'Failed to get media statistics'
      };
    }
  }
}
