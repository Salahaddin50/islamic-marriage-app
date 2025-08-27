// ============================================================================
// THUMBNAIL REGENERATION UTILITY - HUME ISLAMIC DATING APP
// ============================================================================
// Utility to regenerate thumbnails for existing videos in the database
// Run this after implementing the new thumbnail service
// ============================================================================

import { supabase } from '../config/supabase';
import { ThumbnailService } from '../services/thumbnail.service';

interface MediaRecord {
  id: string;
  user_id: string;
  media_type: string;
  external_url: string;
  thumbnail_url: string | null;
  do_spaces_key: string;
}

export class ThumbnailRegenerationUtility {
  /**
   * Regenerate thumbnails for all videos missing proper thumbnails
   */
  static async regenerateVideoThumbnails(
    onProgress?: (completed: number, total: number, currentVideo: string) => void
  ): Promise<{
    success: boolean;
    processed: number;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processed = 0;
    let updated = 0;

    try {
      // Get all videos without proper thumbnails
      const { data: videos, error } = await supabase
        .from('media_references')
        .select('id, user_id, media_type, external_url, thumbnail_url, do_spaces_key')
        .eq('media_type', 'video')
        .or('thumbnail_url.is.null,thumbnail_url.like.%?thumbnail=true%');

      if (error) {
        throw new Error(`Failed to fetch videos: ${error.message}`);
      }

      if (!videos || videos.length === 0) {
        return {
          success: true,
          processed: 0,
          updated: 0,
          errors: ['No videos found that need thumbnail regeneration']
        };
      }

      console.log(`Found ${videos.length} videos that need thumbnail regeneration`);

      // Process each video
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i] as MediaRecord;
        processed++;

        if (onProgress) {
          onProgress(processed, videos.length, video.external_url);
        }

        try {
          // Fetch the video file
          const response = await fetch(video.external_url);
          if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.status}`);
          }

          const videoBlob = await response.blob();

          // Generate thumbnail
          const thumbnailResult = await ThumbnailService.generateAndUploadThumbnail(
            videoBlob,
            'video',
            video.user_id,
            video.do_spaces_key,
            {
              width: 400,
              height: 300,
              quality: 0.8,
              timeframe: 1,
              format: 'jpeg'
            }
          );

          if (thumbnailResult.success && thumbnailResult.thumbnailUrl) {
            // Update database with new thumbnail URL
            const { error: updateError } = await supabase
              .from('media_references')
              .update({ thumbnail_url: thumbnailResult.thumbnailUrl })
              .eq('id', video.id);

            if (updateError) {
              throw new Error(`Failed to update database: ${updateError.message}`);
            }

            updated++;
            console.log(`✅ Updated thumbnail for video ${video.id}`);
          } else {
            throw new Error(thumbnailResult.error || 'Unknown error');
          }
        } catch (error) {
          const errorMessage = `Video ${video.id}: ${error}`;
          errors.push(errorMessage);
          console.error(`❌ ${errorMessage}`);
        }
      }

      return {
        success: true,
        processed,
        updated,
        errors
      };
    } catch (error) {
      return {
        success: false,
        processed,
        updated,
        errors: [...errors, `Fatal error: ${error}`]
      };
    }
  }

  /**
   * Regenerate thumbnails for photos (optimize existing ones)
   */
  static async regeneratePhotoThumbnails(
    onProgress?: (completed: number, total: number, currentPhoto: string) => void
  ): Promise<{
    success: boolean;
    processed: number;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processed = 0;
    let updated = 0;

    try {
      // Get all photos that use the original URL as thumbnail (not optimized)
      const { data: photos, error } = await supabase
        .from('media_references')
        .select('id, user_id, media_type, external_url, thumbnail_url, do_spaces_key')
        .eq('media_type', 'photo')
        .eq('external_url', 'thumbnail_url'); // Where thumbnail_url equals external_url

      if (error) {
        throw new Error(`Failed to fetch photos: ${error.message}`);
      }

      if (!photos || photos.length === 0) {
        return {
          success: true,
          processed: 0,
          updated: 0,
          errors: ['No photos found that need thumbnail optimization']
        };
      }

      console.log(`Found ${photos.length} photos that need thumbnail optimization`);

      // Process each photo
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i] as MediaRecord;
        processed++;

        if (onProgress) {
          onProgress(processed, photos.length, photo.external_url);
        }

        try {
          // Fetch the photo file
          const response = await fetch(photo.external_url);
          if (!response.ok) {
            throw new Error(`Failed to fetch photo: ${response.status}`);
          }

          const photoBlob = await response.blob();

          // Generate optimized thumbnail
          const thumbnailResult = await ThumbnailService.generateAndUploadThumbnail(
            photoBlob,
            'photo',
            photo.user_id,
            photo.do_spaces_key,
            {
              width: 400,
              height: 400,
              quality: 0.8,
              format: 'jpeg'
            }
          );

          if (thumbnailResult.success && thumbnailResult.thumbnailUrl) {
            // Update database with new thumbnail URL
            const { error: updateError } = await supabase
              .from('media_references')
              .update({ thumbnail_url: thumbnailResult.thumbnailUrl })
              .eq('id', photo.id);

            if (updateError) {
              throw new Error(`Failed to update database: ${updateError.message}`);
            }

            updated++;
            console.log(`✅ Updated thumbnail for photo ${photo.id}`);
          } else {
            throw new Error(thumbnailResult.error || 'Unknown error');
          }
        } catch (error) {
          const errorMessage = `Photo ${photo.id}: ${error}`;
          errors.push(errorMessage);
          console.error(`❌ ${errorMessage}`);
        }
      }

      return {
        success: true,
        processed,
        updated,
        errors
      };
    } catch (error) {
      return {
        success: false,
        processed,
        updated,
        errors: [...errors, `Fatal error: ${error}`]
      };
    }
  }

  /**
   * Run complete thumbnail regeneration for all media
   */
  static async regenerateAllThumbnails(
    onProgress?: (type: 'video' | 'photo', completed: number, total: number, current: string) => void
  ): Promise<{
    success: boolean;
    videos: { processed: number; updated: number; errors: string[] };
    photos: { processed: number; updated: number; errors: string[] };
  }> {
    console.log('🚀 Starting complete thumbnail regeneration...');

    // Regenerate video thumbnails
    console.log('📹 Processing videos...');
    const videoResult = await this.regenerateVideoThumbnails(
      onProgress ? (completed, total, current) => onProgress('video', completed, total, current) : undefined
    );

    // Regenerate photo thumbnails
    console.log('📸 Processing photos...');
    const photoResult = await this.regeneratePhotoThumbnails(
      onProgress ? (completed, total, current) => onProgress('photo', completed, total, current) : undefined
    );

    const success = videoResult.success && photoResult.success;

    console.log('✅ Thumbnail regeneration completed!');
    console.log(`Videos: ${videoResult.updated}/${videoResult.processed} updated`);
    console.log(`Photos: ${photoResult.updated}/${photoResult.processed} updated`);

    if (videoResult.errors.length > 0 || photoResult.errors.length > 0) {
      console.log('❌ Errors encountered:');
      [...videoResult.errors, ...photoResult.errors].forEach(error => console.log(`  - ${error}`));
    }

    return {
      success,
      videos: videoResult,
      photos: photoResult
    };
  }
}
