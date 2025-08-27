// ============================================================================
// THUMBNAIL SERVICE - HUME ISLAMIC DATING APP
// ============================================================================
// Comprehensive thumbnail generation and storage service
// Supports video frame extraction and image thumbnail generation
// ============================================================================

import { DigitalOceanMediaService, DOSpacesUploadResult } from './digitalocean-media.service';

export interface ThumbnailGenerationOptions {
  width?: number;
  height?: number;
  quality?: number;
  timeframe?: number; // For videos: time in seconds to extract frame (default: 1)
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ThumbnailResult {
  success: boolean;
  thumbnailUrl?: string;
  error?: string;
  thumbnailBlob?: Blob;
}

export class ThumbnailService {
  private static readonly DEFAULT_OPTIONS: Required<ThumbnailGenerationOptions> = {
    width: 400,
    height: 300,
    quality: 0.8,
    timeframe: 1,
    format: 'jpeg'
  };

  /**
   * Generate thumbnail from video file
   */
  static async generateVideoThumbnail(
    videoFile: File | Blob,
    options: ThumbnailGenerationOptions = {}
  ): Promise<ThumbnailResult> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      
      // Create video element for frame extraction
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      return new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          // Set canvas dimensions
          canvas.width = opts.width;
          canvas.height = opts.height;
          
          // Seek to specified timeframe
          video.currentTime = Math.min(opts.timeframe, video.duration || 1);
        });

        video.addEventListener('seeked', () => {
          try {
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, opts.width, opts.height);
            
            // Convert canvas to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({
                    success: true,
                    thumbnailBlob: blob
                  });
                } else {
                  resolve({
                    success: false,
                    error: 'Failed to generate thumbnail blob'
                  });
                }
                
                // Cleanup
                video.remove();
                canvas.remove();
              },
              `image/${opts.format}`,
              opts.quality
            );
          } catch (error) {
            resolve({
              success: false,
              error: `Failed to draw video frame: ${error}`
            });
          }
        });

        video.addEventListener('error', () => {
          resolve({
            success: false,
            error: 'Failed to load video for thumbnail generation'
          });
        });

        // Load video
        video.src = URL.createObjectURL(videoFile);
        video.load();
      });
    } catch (error) {
      return {
        success: false,
        error: `Thumbnail generation failed: ${error}`
      };
    }
  }

  /**
   * Generate thumbnail from image file (resize/optimize)
   */
  static async generateImageThumbnail(
    imageFile: File | Blob,
    options: ThumbnailGenerationOptions = {}
  ): Promise<ThumbnailResult> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      return new Promise((resolve) => {
        img.onload = () => {
          try {
            // Calculate aspect ratio and dimensions
            const aspectRatio = img.width / img.height;
            let { width, height } = opts;
            
            if (aspectRatio > 1) {
              // Landscape
              height = width / aspectRatio;
            } else {
              // Portrait or square
              width = height * aspectRatio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and resize image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({
                    success: true,
                    thumbnailBlob: blob
                  });
                } else {
                  resolve({
                    success: false,
                    error: 'Failed to generate image thumbnail blob'
                  });
                }
                
                // Cleanup
                canvas.remove();
              },
              `image/${opts.format}`,
              opts.quality
            );
          } catch (error) {
            resolve({
              success: false,
              error: `Failed to process image: ${error}`
            });
          }
        };

        img.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load image for thumbnail generation'
          });
        };

        img.src = URL.createObjectURL(imageFile);
      });
    } catch (error) {
      return {
        success: false,
        error: `Image thumbnail generation failed: ${error}`
      };
    }
  }

  /**
   * Generate and upload thumbnail to storage
   */
  static async generateAndUploadThumbnail(
    mediaFile: File | Blob,
    mediaType: 'photo' | 'video',
    userId: string,
    originalFileKey: string,
    options: ThumbnailGenerationOptions = {}
  ): Promise<ThumbnailResult> {
    try {
      let thumbnailResult: ThumbnailResult;
      
      // Generate thumbnail based on media type
      if (mediaType === 'video') {
        thumbnailResult = await this.generateVideoThumbnail(mediaFile, options);
      } else {
        thumbnailResult = await this.generateImageThumbnail(mediaFile, options);
      }
      
      if (!thumbnailResult.success || !thumbnailResult.thumbnailBlob) {
        return thumbnailResult;
      }
      
      // Upload thumbnail to storage
      const thumbnailFile = new File(
        [thumbnailResult.thumbnailBlob],
        `thumbnail_${originalFileKey}`,
        { type: `image/${options.format || 'jpeg'}` }
      );
      
      const uploadResult = await DigitalOceanMediaService.uploadMedia(thumbnailFile, {
        userId,
        mediaType: 'photo', // Thumbnails are always treated as photos
        isProfilePicture: false,
        visibility: 'private'
      });
      
      if (uploadResult.success && uploadResult.data) {
        return {
          success: true,
          thumbnailUrl: uploadResult.data.cdnUrl
        };
      } else {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload thumbnail'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Thumbnail generation and upload failed: ${error}`
      };
    }
  }

  /**
   * Batch generate thumbnails for multiple videos
   */
  static async batchGenerateThumbnails(
    mediaItems: Array<{
      file: File | Blob;
      mediaType: 'photo' | 'video';
      userId: string;
      fileKey: string;
    }>,
    options: ThumbnailGenerationOptions = {},
    onProgress?: (completed: number, total: number, itemId: string, thumbnail?: string) => void
  ): Promise<Array<ThumbnailResult>> {
    const results: ThumbnailResult[] = [];
    
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      
      if (onProgress) {
        onProgress(i, mediaItems.length, item.fileKey);
      }
      
      const result = await this.generateAndUploadThumbnail(
        item.file,
        item.mediaType,
        item.userId,
        item.fileKey,
        options
      );
      
      results.push(result);
      
      if (onProgress && result.success) {
        onProgress(i + 1, mediaItems.length, item.fileKey, result.thumbnailUrl);
      }
    }
    
    return results;
  }

  /**
   * Generate multiple thumbnail sizes
   */
  static async generateMultipleSizes(
    mediaFile: File | Blob,
    mediaType: 'photo' | 'video',
    userId: string,
    originalFileKey: string
  ): Promise<{
    small?: string;
    medium?: string;
    large?: string;
    errors?: string[];
  }> {
    const sizes = [
      { name: 'small', width: 150, height: 150 },
      { name: 'medium', width: 400, height: 300 },
      { name: 'large', width: 800, height: 600 }
    ];
    
    const results: any = {};
    const errors: string[] = [];
    
    for (const size of sizes) {
      const result = await this.generateAndUploadThumbnail(
        mediaFile,
        mediaType,
        userId,
        `${size.name}_${originalFileKey}`,
        {
          width: size.width,
          height: size.height,
          quality: 0.8,
          format: 'jpeg'
        }
      );
      
      if (result.success) {
        results[size.name] = result.thumbnailUrl;
      } else {
        errors.push(`${size.name}: ${result.error}`);
      }
    }
    
    return { ...results, errors: errors.length > 0 ? errors : undefined };
  }
}
