import { generateVideoThumbnail } from '../../utils/videoThumbnailGenerator';
import AWS from '../../aws-config';

// Configure AWS SDK for DigitalOcean Spaces (S3-compatible)
const spacesEndpoint = new AWS.Endpoint(process.env.EXPO_PUBLIC_DO_SPACES_ENDPOINT || '');

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.EXPO_PUBLIC_DO_SPACES_KEY,
  secretAccessKey: process.env.EXPO_PUBLIC_DO_SPACES_SECRET,
  region: process.env.EXPO_PUBLIC_DO_SPACES_REGION || 'nyc3',
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

export interface ThumbnailGenerationResult {
  success: boolean;
  data?: {
    thumbnailUrl: string;
    cdnUrl: string;
    key: string;
  };
  error?: string;
}

export class ThumbnailStorageService {
  private static spaceName = process.env.EXPO_PUBLIC_DO_SPACES_NAME || '';
  private static cdnUrl = process.env.EXPO_PUBLIC_DO_SPACES_CDN || '';

  /**
   * Generate and store video thumbnail permanently
   */
  static async generateAndStoreThumbnail(
    videoUrl: string,
    videoId: string,
    userId: string
  ): Promise<ThumbnailGenerationResult> {
    try {
      // 1. Generate thumbnail from video
      const thumbnailDataUrl = await generateVideoThumbnail(videoUrl, {
        time: 3, // 3 seconds into video
        width: 400,
        height: 300,
        quality: 0.8,
        retries: 2
      });

      if (!thumbnailDataUrl || thumbnailDataUrl === 'data:image/png;base64,') {
        return {
          success: false,
          error: 'Failed to generate thumbnail from video'
        };
      }

      // 2. Convert data URL to Blob
      const thumbnailBlob = await this.dataUrlToBlob(thumbnailDataUrl);

      // 3. Generate file key for thumbnail
      const thumbnailKey = this.generateThumbnailKey(userId, videoId);

      // 4. Upload thumbnail to DigitalOcean
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.spaceName,
        Key: thumbnailKey,
        Body: thumbnailBlob,
        ContentType: 'image/png',
        ContentLength: thumbnailBlob.size,
        ACL: 'public-read',
        Metadata: {
          'user-id': userId,
          'video-id': videoId,
          'type': 'thumbnail',
          'generated-at': new Date().toISOString()
        }
      };

      const uploadResult = await s3.upload(uploadParams).promise();

      // 5. Generate CDN URL
      const cdnUrl = this.generateCDNUrl(thumbnailKey);

      return {
        success: true,
        data: {
          thumbnailUrl: uploadResult.Location,
          cdnUrl: cdnUrl,
          key: thumbnailKey
        }
      };

    } catch (error) {
      console.error('Thumbnail generation and storage failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Thumbnail generation failed'
      };
    }
  }

  /**
   * Convert data URL to Blob for upload
   */
  private static async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return await response.blob();
  }

  /**
   * Generate unique key for thumbnail storage
   */
  private static generateThumbnailKey(userId: string, videoId: string): string {
    const timestamp = Date.now();
    return `users/${userId}/thumbnails/${videoId}-${timestamp}.png`;
  }

  /**
   * Generate CDN URL for thumbnail
   */
  private static generateCDNUrl(thumbnailKey: string): string {
    return `${this.cdnUrl}/${thumbnailKey}`;
  }

  /**
   * Delete thumbnail from storage
   */
  static async deleteThumbnail(thumbnailKey: string): Promise<boolean> {
    try {
      await s3.deleteObject({
        Bucket: this.spaceName,
        Key: thumbnailKey
      }).promise();
      return true;
    } catch (error) {
      console.error('Failed to delete thumbnail:', error);
      return false;
    }
  }
}
