import { ThumbnailStorageService } from '../services/thumbnail-storage.service';
import { supabase } from '../config/supabase';

export interface ThumbnailGenerationRequest {
  videoId: string;
  videoUrl: string;
}

export interface ThumbnailGenerationResponse {
  success: boolean;
  data?: {
    thumbnailUrl: string;
    cdnUrl: string;
    key: string;
  };
  error?: string;
}

export class ThumbnailAPI {
  /**
   * Generate and store video thumbnail permanently
   */
  static async generateAndStoreThumbnail(
    request: ThumbnailGenerationRequest
  ): Promise<ThumbnailGenerationResponse> {
    try {
      // 1. Get current user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        return {
          success: false,
          error: 'Please login first'
        };
      }

      // 2. Verify the video belongs to the user
      const { data: videoRecord, error: videoError } = await supabase
        .from('media_references')
        .select('user_id, external_url')
        .eq('id', request.videoId)
        .eq('media_type', 'video')
        .maybeSingle();

      if (videoError || !videoRecord) {
        return {
          success: false,
          error: 'Video not found'
        };
      }

      if (videoRecord.user_id !== authUser.id) {
        return {
          success: false,
          error: 'Access denied'
        };
      }

      // 3. Generate and store thumbnail
      const result = await ThumbnailStorageService.generateAndStoreThumbnail(
        request.videoUrl,
        request.videoId,
        authUser.id
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Thumbnail generation failed'
        };
      }

      // 4. Update database with new thumbnail URL
      const { error: updateError } = await supabase
        .from('media_references')
        .update({
          thumbnail_url: result.data.cdnUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.videoId)
        .eq('user_id', authUser.id);

      if (updateError) {
        console.error('Failed to update database with thumbnail URL:', updateError);
        // Don't fail the whole operation if DB update fails
        // The thumbnail is still stored and can be used
      }

      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('Thumbnail API error:', error);
      return {
        success: false,
        error: 'Failed to generate thumbnail'
      };
    }
  }

  /**
   * Get thumbnail for a video
   */
  static async getVideoThumbnail(videoId: string): Promise<{
    success: boolean;
    data?: {
      thumbnailUrl: string;
      hasThumbnail: boolean;
    };
    error?: string;
  }> {
    try {
      // Get thumbnail URL from database
      const { data: videoRecord, error } = await supabase
        .from('media_references')
        .select('thumbnail_url, external_url')
        .eq('id', videoId)
        .eq('media_type', 'video')
        .maybeSingle();

      if (error || !videoRecord) {
        return {
          success: false,
          error: 'Video not found'
        };
      }

      const hasThumbnail = !!(videoRecord.thumbnail_url && 
        (videoRecord.thumbnail_url.includes('.png') || 
         videoRecord.thumbnail_url.includes('.jpg') || 
         videoRecord.thumbnail_url.includes('.jpeg')));

      return {
        success: true,
        data: {
          thumbnailUrl: videoRecord.thumbnail_url || '',
          hasThumbnail
        }
      };

    } catch (error) {
      console.error('Get thumbnail error:', error);
      return {
        success: false,
        error: 'Failed to get thumbnail'
      };
    }
  }
}
