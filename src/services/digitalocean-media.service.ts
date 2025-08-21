import AWS from '../../aws-config';
import { PhotoVideoItem } from './photos-videos.service';
import { Buffer } from 'buffer';

// Configure AWS SDK for DigitalOcean Spaces (S3-compatible)
const spacesEndpoint = new AWS.Endpoint(process.env.EXPO_PUBLIC_DO_SPACES_ENDPOINT || '');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.EXPO_PUBLIC_DO_SPACES_KEY,
  secretAccessKey: process.env.EXPO_PUBLIC_DO_SPACES_SECRET,
  region: process.env.EXPO_PUBLIC_DO_SPACES_REGION || 'nyc3',
  s3ForcePathStyle: false, // Configures to use subdomain/virtual calling format
  signatureVersion: 'v4'
});

export interface DOSpacesUploadResult {
  success: boolean;
  data?: {
    url: string;
    cdnUrl: string;
    key: string;
    thumbnailUrl?: string;
  };
  error?: string;
}

export class DigitalOceanMediaService {
  private static spaceName = process.env.EXPO_PUBLIC_DO_SPACES_NAME || '';
  private static cdnUrl = process.env.EXPO_PUBLIC_DO_SPACES_CDN || '';

  /**
   * Upload media file to DigitalOcean Spaces
   */
  static async uploadMedia(
    file: File | Blob,
    options: {
      userId: string;
      mediaType: 'photo' | 'video';
      isProfilePicture?: boolean;
      visibility?: 'public' | 'private' | 'matched_only';
    }
  ): Promise<DOSpacesUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, options.mediaType);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generate file key (path in bucket)
      const fileKey = this.generateFileKey(
        options.userId,
        options.mediaType,
        options.isProfilePicture || false,
        file.type
      );

      // For web environment, we can pass the Blob directly
      // AWS SDK handles Blob/File objects in browser environment
      const fileBody = file;

      // Upload parameters
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.spaceName,
        Key: fileKey,
        Body: fileBody,
        ContentType: file.type,
        ContentLength: file.size,
        ACL: this.getACL(options.visibility || 'private'),
        Metadata: {
          'user-id': options.userId,
          'media-type': options.mediaType,
          'is-profile': String(options.isProfilePicture || false),
          'visibility': options.visibility || 'private',
          'uploaded-at': new Date().toISOString()
        }
      };

      // Upload to DigitalOcean Spaces
      const uploadResult = await s3.upload(uploadParams).promise();

      // Generate CDN URL for faster delivery
      const cdnUrl = this.generateCDNUrl(fileKey);

      // Generate thumbnail for videos (basic implementation)
      let thumbnailUrl;
      if (options.mediaType === 'video') {
        thumbnailUrl = await this.generateVideoThumbnail(fileKey);
      }

      return {
        success: true,
        data: {
          url: uploadResult.Location,
          cdnUrl,
          key: fileKey,
          thumbnailUrl
        }
      };

    } catch (error) {
      console.error('DigitalOcean upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete media file from DigitalOcean Spaces
   */
  static async deleteMedia(fileKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: this.spaceName,
        Key: fileKey
      };

      await s3.deleteObject(deleteParams).promise();

      return { success: true };
    } catch (error) {
      console.error('DigitalOcean delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Generate presigned URL for secure file access
   */
  static generatePresignedUrl(fileKey: string, expiresIn: number = 3600): string {
    try {
      return s3.getSignedUrl('getObject', {
        Bucket: this.spaceName,
        Key: fileKey,
        Expires: expiresIn // URL expires in 1 hour by default
      });
    } catch (error) {
      console.error('Generate presigned URL error:', error);
      return '';
    }
  }

  /**
   * Get media file metadata
   */
  static async getMediaMetadata(fileKey: string): Promise<{
    success: boolean;
    data?: AWS.S3.HeadObjectOutput;
    error?: string;
  }> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.spaceName,
        Key: fileKey
      };

      const metadata = await s3.headObject(params).promise();

      return {
        success: true,
        data: metadata
      };
    } catch (error) {
      console.error('Get metadata error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metadata'
      };
    }
  }

  /**
   * List user's media files
   */
  static async listUserMedia(userId: string): Promise<{
    success: boolean;
    data?: AWS.S3.Object[];
    error?: string;
  }> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: this.spaceName,
        Prefix: `users/${userId}/`, // List all files for this user
        MaxKeys: 1000
      };

      const result = await s3.listObjectsV2(params).promise();

      return {
        success: true,
        data: result.Contents || []
      };
    } catch (error) {
      console.error('List media error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list media'
      };
    }
  }

  // Private helper methods

  private static generateFileKey(
    userId: string,
    mediaType: 'photo' | 'video',
    isProfilePicture: boolean,
    mimeType: string
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(mimeType);
    
    const folder = isProfilePicture ? 'profile' : mediaType + 's';
    
    return `users/${userId}/${folder}/${timestamp}-${random}.${extension}`;
  }

  private static getFileExtension(mimeType: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi'
    };
    
    return extensions[mimeType] || 'bin';
  }

  private static getACL(visibility: string): string {
    switch (visibility) {
      case 'public':
        return 'public-read';
      case 'private':
      case 'matched_only':
      default:
        return 'private';
    }
  }

  private static generateCDNUrl(fileKey: string): string {
    return `${this.cdnUrl}/${fileKey}`;
  }

  private static async generateVideoThumbnail(fileKey: string): Promise<string | undefined> {
    // For basic implementation, we'll return the CDN URL
    // In production, you'd want to use a service like FFmpeg to generate thumbnails
    return this.generateCDNUrl(fileKey);
  }

  private static async fileToBuffer(file: File | Blob): Promise<Uint8Array> {
    // For web environments, we can return Uint8Array instead of Buffer
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  private static validateFile(file: File | Blob, mediaType: 'photo' | 'video'): {
    isValid: boolean;
    error?: string;
  } {
    const maxPhotoSize = parseInt(process.env.EXPO_PUBLIC_MAX_PHOTO_SIZE || '10485760'); // 10MB
    const maxVideoSize = parseInt(process.env.EXPO_PUBLIC_MAX_VIDEO_SIZE || '104857600'); // 100MB

    if (mediaType === 'photo') {
      if (file.size > maxPhotoSize) {
        return {
          isValid: false,
          error: `Photo size must be less than ${Math.round(maxPhotoSize / 1024 / 1024)}MB`
        };
      }

      const allowedPhotoTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp'
      ];

      if (file.type && !allowedPhotoTypes.includes(file.type)) {
        return {
          isValid: false,
          error: 'Photo must be JPEG, PNG, or WebP format'
        };
      }
    } else {
      if (file.size > maxVideoSize) {
        return {
          isValid: false,
          error: `Video size must be less than ${Math.round(maxVideoSize / 1024 / 1024)}MB`
        };
      }

      const allowedVideoTypes = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo'
      ];

      if (file.type && !allowedVideoTypes.includes(file.type)) {
        return {
          isValid: false,
          error: 'Video must be MP4, WebM, MOV, or AVI format'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get storage usage statistics for a user
   */
  static async getUserStorageStats(userId: string): Promise<{
    success: boolean;
    data?: {
      totalFiles: number;
      totalSize: number;
      photoCount: number;
      videoCount: number;
    };
    error?: string;
  }> {
    try {
      const mediaResult = await this.listUserMedia(userId);
      
      if (!mediaResult.success || !mediaResult.data) {
        return {
          success: false,
          error: mediaResult.error || 'Failed to get storage stats'
        };
      }

      const files = mediaResult.data;
      let totalSize = 0;
      let photoCount = 0;
      let videoCount = 0;

      files.forEach(file => {
        totalSize += file.Size || 0;
        
        if (file.Key?.includes('/photos/')) {
          photoCount++;
        } else if (file.Key?.includes('/videos/')) {
          videoCount++;
        }
      });

      return {
        success: true,
        data: {
          totalFiles: files.length,
          totalSize,
          photoCount,
          videoCount
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
}
