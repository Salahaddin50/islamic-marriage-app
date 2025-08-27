/**
 * Video thumbnail generation utility for web browsers
 */

export interface VideoThumbnailOptions {
  time?: number; // Time in seconds to capture the frame (default: 1)
  width?: number; // Thumbnail width (default: 400)
  height?: number; // Thumbnail height (default: 300)
  quality?: number; // JPEG quality (0-1, default: 0.8)
}

/**
 * Generate a thumbnail from a video file or URL
 */
export async function generateVideoThumbnail(
  videoSource: string | File | Blob,
  options: VideoThumbnailOptions = {}
): Promise<string> {
  const { time = 1, width = 400, height = 300, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    // Create video element
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    
    // Create canvas for thumbnail
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    canvas.width = width;
    canvas.height = height;

    // Handle video load and seek to specific time
    video.addEventListener('loadedmetadata', () => {
      // Set time to capture frame
      video.currentTime = Math.min(time, video.duration || 1);
    });

    video.addEventListener('seeked', () => {
      try {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert canvas to data URL
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Clean up
        video.remove();
        canvas.remove();
        
        resolve(thumbnailDataUrl);
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', (error) => {
      video.remove();
      canvas.remove();
      reject(error);
    });

    // Set video source
    if (typeof videoSource === 'string') {
      video.src = videoSource;
    } else {
      const url = URL.createObjectURL(videoSource);
      video.src = url;
      
      // Clean up object URL when done
      video.addEventListener('loadstart', () => {
        URL.revokeObjectURL(url);
      });
    }

    // Start loading
    video.load();
  });
}

/**
 * Check if the browser supports video thumbnail generation
 */
export function isVideoThumbnailSupported(): boolean {
  try {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return !!(video && canvas && ctx);
  } catch {
    return false;
  }
}

/**
 * Generate thumbnail from video with fallback to default thumbnail
 */
export async function generateVideoThumbnailWithFallback(
  videoUrl: string,
  defaultThumbnail: string,
  options: VideoThumbnailOptions = {}
): Promise<string> {
  try {
    if (!isVideoThumbnailSupported()) {
      return defaultThumbnail;
    }

    const thumbnail = await generateVideoThumbnail(videoUrl, options);
    return thumbnail;
  } catch (error) {
    console.warn('Failed to generate video thumbnail:', error);
    return defaultThumbnail;
  }
}
