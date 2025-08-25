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

      // 3. Pre-check: if a record with the same do_spaces_key already exists, return it (idempotent)
      const { data: existingByKeyPre } = await supabase
        .from('media_references')
        .select('*')
        .eq('do_spaces_key', uploadResult.data.key)
        .eq('user_id', options.userId)
        .maybeSingle();

      if (existingByKeyPre) {
        return {
          success: true,
          data: existingByKeyPre
        };
      }

      // 4. Get next media order if not specified
      const mediaOrder = options.mediaOrder || await this.getNextMediaOrder(
        options.userId,
        options.mediaType
      );

      // 5. Create database reference
      // Ensure thumbnail_url isn't too long (max 500 chars for VARCHAR(500))
      let thumbnailUrl = uploadResult.data.thumbnailUrl;
      if (thumbnailUrl && thumbnailUrl.length > 480) {
        console.log('Thumbnail URL too long, truncating or using fallback');
        // Use a simple URL parameter instead of a data URI
        thumbnailUrl = `${uploadResult.data.cdnUrl}?thumbnail=true`;
      }
      
      const mediaReference = {
        user_id: options.userId,
        media_type: options.mediaType,
        external_url: uploadResult.data.cdnUrl, // Use CDN URL for better performance
        thumbnail_url: thumbnailUrl,
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

      // Try insert; if unique_violation (e.g., media_order clash), recompute order and retry once
      let dbRecord: any | null = null;
      let dbError: any | null = null;

      const doInsert = async () => {
        console.log('Attempting to insert media reference:', JSON.stringify(mediaReference));
        const { data, error } = await supabase
          .from('media_references')
          .insert([mediaReference])
          .select()
          .single();
        dbRecord = data;
        dbError = error;
        if (error) {
          console.error('Database insert error details:', JSON.stringify(error));
        }
      };

      await doInsert();

      if (dbError && (dbError.code === '23505' || dbError.code === '409' || /unique|duplicate/i.test(dbError.message || ''))) {
        // First try: if duplicate key for do_spaces_key, fetch the existing row and return it
        const { data: existingByKey } = await supabase
          .from('media_references')
          .select('*')
          .eq('do_spaces_key', uploadResult.data.key)
          .eq('user_id', options.userId)
          .maybeSingle();

        if (existingByKey) {
          dbRecord = existingByKey;
          dbError = null;
        } else {
          // Otherwise assume media_order conflict: recompute order and retry once
          const nextOrder = await this.getNextMediaOrder(options.userId, options.mediaType);
          mediaReference.media_order = nextOrder;
          await doInsert();
        }
      }

      if (dbError) {
        // If database creation still fails, delete from DigitalOcean
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
      console.log(`Deleting media ${mediaId} for user ${userId}`);
      
      // 1. Get media record from database
      const { data: mediaRecord, error: fetchError } = await supabase
        .from('media_references')
        .select('*')
        .eq('id', mediaId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching media record:', fetchError);
        return {
          success: false,
          error: `Media fetch error: ${fetchError.message}`
        };
      }

      if (!mediaRecord) {
        console.error('Media record not found');
        return {
          success: false,
          error: 'Media not found or access denied'
        };
      }

      console.log('Found media record:', mediaRecord);

      // 2. Delete from DigitalOcean Spaces
      if (mediaRecord.do_spaces_key) {
        console.log('Deleting from DigitalOcean Spaces:', mediaRecord.do_spaces_key);
        const deleteResult = await DigitalOceanMediaService.deleteMedia(mediaRecord.do_spaces_key);
        if (!deleteResult.success) {
          console.warn('Failed to delete from DigitalOcean:', deleteResult.error);
          // Continue with database deletion even if DigitalOcean deletion fails
        } else {
          console.log('Successfully deleted from DigitalOcean Spaces');
        }
      } else {
        console.log('No DO Spaces key found, skipping storage deletion');
      }

      // 3. Delete from database
      console.log('Deleting from database...', mediaId, userId);
      const deleteResponse = await supabase
        .from('media_references')
        .delete()
        .eq('id', mediaId)
        .eq('user_id', userId);
      
      const { error: dbDeleteError } = deleteResponse;
      console.log('Delete response:', deleteResponse);

      if (dbDeleteError) {
        console.error('Database deletion error:', dbDeleteError);
        return {
          success: false,
          error: `Database deletion failed: ${dbDeleteError.message}`
        };
      }
      
      console.log('Successfully deleted from database');

      // 4. If this was a profile picture, clear profile picture URL
      if (mediaRecord.is_profile_picture) {
        console.log('This was a profile picture, clearing profile_picture_url in user_profiles');
        const { error: profileUpdateError } = await supabase
          .from('user_profiles')
          .update({
            profile_picture_url: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (profileUpdateError) {
          console.warn('Failed to clear profile_picture_url:', profileUpdateError);
          // Don't fail the operation if only the profile update fails
        } else {
          console.log('Successfully cleared profile_picture_url');
        }
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
      console.log(`Setting photo ${photoId} as profile picture for user ${userId}`);
      
      // Verify the photo exists and belongs to the user
      const { data: photoCheck, error: checkError } = await supabase
        .from('media_references')
        .select('*')
        .eq('id', photoId)
        .eq('user_id', userId)
        .eq('media_type', 'photo')
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking photo existence:', checkError);
        return {
          success: false,
          error: `Photo check error: ${checkError.message}`
        };
      }
      
      if (!photoCheck) {
        console.error('Photo not found or does not belong to user');
        return {
          success: false,
          error: 'Photo not found or access denied'
        };
      }
      
      console.log('Found photo to set as profile picture:', photoCheck);
      
      // 1. Clear current profile picture
      await this.clearCurrentProfilePicture(userId);
      console.log('Cleared current profile picture');

      // 2. Set new profile picture
      console.log('Setting is_profile_picture=true for photo:', photoId);
      const updateResponse = await supabase
        .from('media_references')
        .update({
          is_profile_picture: true
          // Removed updated_at field as it doesn't exist in the table
        })
        .eq('id', photoId)
        .eq('user_id', userId)
        .eq('media_type', 'photo')
        .select()
        .single();
        
      const { data: updatedPhoto, error: updateError } = updateResponse;
      console.log('Update response:', updateResponse);

      if (updateError) {
        console.error('Error updating media_references:', updateError);
        return {
          success: false,
          error: `Failed to update profile picture: ${updateError.message}`
        };
      }
      
      if (!updatedPhoto) {
        console.error('No photo found after update');
        return {
          success: false,
          error: 'Photo not found after update'
        };
      }

      console.log('Updated photo in media_references:', updatedPhoto);
      
      // Choose the best URL for the profile picture
      const profilePictureUrl = updatedPhoto.do_spaces_url || updatedPhoto.external_url;
      console.log('Using URL for profile picture:', profilePictureUrl);

      // 3. Update user profile table
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({
          profile_picture_url: profilePictureUrl
          // Removed updated_at field as it might not exist in all versions of the table
        })
        .eq('user_id', userId);
        
      if (profileUpdateError) {
        console.error('Error updating user_profiles:', profileUpdateError);
        // Don't fail the operation if only the profile update fails
        console.warn('Profile picture set in media_references but not in user_profiles');
      } else {
        console.log('Successfully updated profile_picture_url in user_profiles');
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
    console.log('Clearing current profile picture for user:', userId);
    try {
      const response = await supabase
        .from('media_references')
        .update({ is_profile_picture: false })
        .eq('user_id', userId)
        .eq('media_type', 'photo')
        .eq('is_profile_picture', true);
        
      console.log('Clear profile picture response:', response);
      
      if (response.error) {
        console.error('Error clearing current profile picture:', response.error);
      } else {
        console.log('Successfully cleared current profile picture');
      }
    } catch (err) {
      console.error('Exception in clearCurrentProfilePicture:', err);
    }
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
      .limit(1);

    const lastOrder = Array.isArray(data) && data.length > 0 ? (data[0] as any).media_order : 0;
    return (lastOrder || 0) + 1;
  }
}
