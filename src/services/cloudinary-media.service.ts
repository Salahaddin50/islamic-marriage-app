import { PhotosVideosService } from './photos-videos.service';

export class CloudinaryMediaService {
  private static cloudinaryUrl = 'https://api.cloudinary.com/v1_1/your-cloud-name';
  private static uploadPreset = 'your-upload-preset'; // Create in Cloudinary dashboard

  /**
   * Upload media to Cloudinary (implements your existing MediaService interface)
   */
  static async uploadMedia(file: File | Blob, options: {
    userId: string;
    mediaType: 'photo' | 'video';
    isProfilePicture?: boolean;
    visibility?: 'public' | 'private' | 'matched_only';
  }) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', `islamic-marriage/${options.userId}`);
      
      // Add Islamic app specific tags
      formData.append('tags', `user_${options.userId},${options.mediaType},${options.visibility || 'private'}`);
      
      if (options.isProfilePicture) {
        formData.append('tags', `user_${options.userId},${options.mediaType},profile_picture`);
      }

      const endpoint = options.mediaType === 'video' ? 'video/upload' : 'image/upload';
      const response = await fetch(`${this.cloudinaryUrl}/${endpoint}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.status}`);
      }

      const result = await response.json();

      // Extract URLs
      const url = result.secure_url;
      const thumbnailUrl = options.mediaType === 'video' 
        ? result.secure_url.replace('/video/upload/', '/video/upload/so_0,w_300,h_200,c_fill/')
        : url;

      // Save reference to your database using existing service
      const mediaReference = await PhotosVideosService.createMediaReference({
        user_id: options.userId,
        media_type: options.mediaType,
        external_url: url,
        thumbnail_url: thumbnailUrl,
        is_profile_picture: options.isProfilePicture || false,
        visibility_level: options.visibility || 'private',
        file_size_bytes: file.size,
        mime_type: file.type,
        cloudinary_public_id: result.public_id // For deletion
      });

      return {
        success: true,
        data: mediaReference
      };

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete media from Cloudinary
   */
  static async deleteMedia(publicId: string, mediaType: 'photo' | 'video') {
    try {
      // Note: For production, implement server-side deletion with admin API
      // This is a simplified client-side example
      const endpoint = mediaType === 'video' ? 'video/destroy' : 'image/destroy';
      
      const response = await fetch(`${this.cloudinaryUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          // Note: In production, use server-side with API secret
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Generate optimized URLs for Islamic marriage app
   */
  static generateOptimizedUrl(publicId: string, options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg';
    crop?: 'fill' | 'fit' | 'scale';
  } = {}) {
    const {
      width = 300,
      height = 300,
      quality = 'auto',
      format = 'auto',
      crop = 'fill'
    } = options;

    const transformations = [
      `w_${width}`,
      `h_${height}`,
      `c_${crop}`,
      `q_${quality}`,
      `f_${format}`
    ].join(',');

    return `https://res.cloudinary.com/your-cloud-name/image/upload/${transformations}/${publicId}`;
  }

  /**
   * Generate Islamic-appropriate profile picture URLs
   */
  static generateProfilePictureUrl(publicId: string, size: 'small' | 'medium' | 'large' = 'medium') {
    const sizes = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };

    return this.generateOptimizedUrl(publicId, {
      ...sizes[size],
      quality: 'auto',
      format: 'auto',
      crop: 'fill'
    });
  }
}

// Update your existing MediaService to use Cloudinary
export class MediaService {
  static async uploadMedia(file: File | Blob, options: any) {
    return CloudinaryMediaService.uploadMedia(file, options);
  }
}
