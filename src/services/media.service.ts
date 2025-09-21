import { supabase, db } from '../config/supabase';
import { CreateMediaReference } from '../types/database.types';

export interface MediaUploadOptions {
  userId: string;
  mediaType: 'photo' | 'video';
  isProfilePicture?: boolean;
  visibility?: 'public' | 'private' | 'matched_only';
  mediaOrder?: number;
}

export interface ExternalMediaServer {
  uploadUrl: string;
  apiKey: string;
  maxFileSize: number;
  allowedTypes: string[];
}

export class MediaService {
  private static externalServer: ExternalMediaServer = {
    uploadUrl: process.env.EXPO_PUBLIC_MEDIA_SERVER_URL || 'https://your-media-server.com',
    apiKey: process.env.EXPO_PUBLIC_MEDIA_SERVER_API_KEY || '',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      // Image formats
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
      'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml',
      // Video formats  
      'video/mp4', 'video/webm', 'video/quicktime', 
      'video/avi', 'video/x-msvideo', 'video/x-matroska'
    ]
  };

  /**
   * Upload media to external server and create database reference
   */
  static async uploadMedia(
    file: File | Blob,
    options: MediaUploadOptions
  ) {
    try {
      // Validate file
      const validation = this.validateMediaFile(file, options.mediaType);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Upload to external server
      const uploadResult = await this.uploadToExternalServer(file, options);
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Create database reference
      const mediaReference: CreateMediaReference = {
        user_id: options.userId,
        media_type: options.mediaType,
        external_url: uploadResult.data.url,
        thumbnail_url: uploadResult.data.thumbnailUrl,
        is_profile_picture: options.isProfilePicture || false,
        visibility_level: options.visibility || 'private',
        media_order: options.mediaOrder || 1,
        file_size_bytes: file.size,
        mime_type: file.type
      };

      const { data: mediaRef, error } = await db.media.create(mediaReference);

      if (error) {
        // If database creation fails, attempt to delete from external server
        await this.deleteFromExternalServer(uploadResult.data.url);
        return {
          success: false,
          error: `Database reference creation failed: ${error}`
        };
      }

      return {
        success: true,
        data: {
          mediaReference: mediaRef,
          externalUrl: uploadResult.data.url,
          thumbnailUrl: uploadResult.data.thumbnailUrl
        }
      };

    } catch (error) {
      console.error('Media upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Media upload failed'
      };
    }
  }

  /**
   * Upload file to external media server
   */
  private static async uploadToExternalServer(
    file: File | Blob,
    options: MediaUploadOptions
  ) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', options.userId);
      formData.append('mediaType', options.mediaType);
      formData.append('isProfilePicture', String(options.isProfilePicture || false));

      const response = await fetch(`${this.externalServer.uploadUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.externalServer.apiKey}`,
          'X-User-Id': options.userId
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          fileId: result.fileId
        }
      };

    } catch (error) {
      console.error('External upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'External upload failed'
      };
    }
  }

  /**
   * Delete media from both database and external server
   */
  static async deleteMedia(mediaId: string, userId: string) {
    try {
      // Get media reference
      const { data: mediaRef, error: fetchError } = await supabase
        .from('media_references')
        .select('*')
        .eq('id', mediaId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !mediaRef) {
        return {
          success: false,
          error: 'Media reference not found'
        };
      }

      // Delete from external server
      await this.deleteFromExternalServer(mediaRef.external_url);

      // Delete from database
      const { error: deleteError } = await db.media.delete(mediaId);

      if (deleteError) {
        return {
          success: false,
          error: `Database deletion failed: ${deleteError}`
        };
      }

      return {
        success: true,
        data: { deletedMediaId: mediaId }
      };

    } catch (error) {
      console.error('Media deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Media deletion failed'
      };
    }
  }

  /**
   * Delete file from external server
   */
  private static async deleteFromExternalServer(fileUrl: string) {
    try {
      const response = await fetch(`${this.externalServer.uploadUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.externalServer.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileUrl })
      });

      if (!response.ok) {
        console.warn(`Failed to delete from external server: ${response.status}`);
      }

    } catch (error) {
      console.warn('External deletion error:', error);
      // Don't throw - database cleanup is more important
    }
  }

  /**
   * Get user's media with privacy filtering
   */
  static async getUserMedia(
    userId: string,
    viewerUserId?: string,
    mediaType?: 'photo' | 'video'
  ) {
    try {
      let query = supabase
        .from('media_references')
        .select('*')
        .eq('user_id', userId)
        .order('media_order');

      if (mediaType) {
        query = query.eq('media_type', mediaType);
      }

      const { data: media, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Failed to fetch media: ${error.message}`
        };
      }

      // Filter based on privacy settings
      const filteredMedia = media?.filter(item => {
        // Owner can see all
        if (viewerUserId === userId) return true;
        
        // Public media visible to all
        if (item.visibility_level === 'public') return true;
        
        // Private media only visible to owner
        if (item.visibility_level === 'private') return false;
        
        // For 'matched_only', check if users are matched
        if (item.visibility_level === 'matched_only' && viewerUserId) {
          // This would require checking the user_matches table
          // For now, return false (implement match checking separately)
          return false;
        }
        
        return false;
      }) || [];

      return {
        success: true,
        data: filteredMedia
      };

    } catch (error) {
      console.error('Get user media error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get media'
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
  ) {
    try {
      const { data, error } = await supabase
        .from('media_references')
        .update({ visibility_level: visibility })
        .eq('id', mediaId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Visibility update failed: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Update visibility error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Visibility update failed'
      };
    }
  }

  /**
   * Set profile picture
   */
  static async setProfilePicture(mediaId: string, userId: string) {
    try {
      // First, unset current profile picture
      await supabase
        .from('media_references')
        .update({ is_profile_picture: false })
        .eq('user_id', userId)
        .eq('is_profile_picture', true);

      // Set new profile picture
      const { data, error } = await supabase
        .from('media_references')
        .update({ is_profile_picture: true })
        .eq('id', mediaId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Profile picture update failed: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Set profile picture error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile picture update failed'
      };
    }
  }

  /**
   * Reorder media
   */
  static async reorderMedia(userId: string, mediaOrders: { id: string; order: number }[]) {
    try {
      const updates = mediaOrders.map(({ id, order }) =>
        supabase
          .from('media_references')
          .update({ media_order: order })
          .eq('id', id)
          .eq('user_id', userId)
      );

      await Promise.all(updates);

      return {
        success: true,
        data: { updated: mediaOrders.length }
      };

    } catch (error) {
      console.error('Reorder media error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Media reorder failed'
      };
    }
  }

  /**
   * Validate media file
   */
  private static validateMediaFile(
    file: File | Blob,
    mediaType: 'photo' | 'video'
  ): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.externalServer.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds ${this.externalServer.maxFileSize / (1024 * 1024)}MB limit`
      };
    }

    // Check MIME type
    if (!this.externalServer.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} not allowed`
      };
    }

    // Media type specific validation
    if (mediaType === 'photo' && !file.type.startsWith('image/')) {
      return {
        isValid: false,
        error: 'Photo uploads must be image files'
      };
    }

    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      return {
        isValid: false,
        error: 'Video uploads must be video files'
      };
    }

    return { isValid: true };
  }

  /**
   * Generate secure URL for temporary access
   */
  static async generateSecureUrl(mediaId: string, viewerUserId: string, expiryHours = 24) {
    try {
      const response = await fetch(`${this.externalServer.uploadUrl}/api/secure-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.externalServer.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mediaId,
          viewerUserId,
          expiryHours
        })
      });

      if (!response.ok) {
        throw new Error(`Secure URL generation failed: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          secureUrl: result.secureUrl,
          expiresAt: result.expiresAt
        }
      };

    } catch (error) {
      console.error('Secure URL generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Secure URL generation failed'
      };
    }
  }

  /**
   * Get media statistics for user
   */
  static async getMediaStats(userId: string) {
    try {
      const { data: media, error } = await supabase
        .from('media_references')
        .select('media_type, file_size_bytes, visibility_level')
        .eq('user_id', userId);

      if (error) {
        return {
          success: false,
          error: `Failed to get media stats: ${error.message}`
        };
      }

      const stats = {
        totalCount: media?.length || 0,
        photoCount: media?.filter(m => m.media_type === 'photo').length || 0,
        videoCount: media?.filter(m => m.media_type === 'video').length || 0,
        totalSize: media?.reduce((sum, m) => sum + (m.file_size_bytes || 0), 0) || 0,
        publicCount: media?.filter(m => m.visibility_level === 'public').length || 0,
        privateCount: media?.filter(m => m.visibility_level === 'private').length || 0,
        matchedOnlyCount: media?.filter(m => m.visibility_level === 'matched_only').length || 0
      };

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('Get media stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get media stats'
      };
    }
  }
}

export default MediaService;
