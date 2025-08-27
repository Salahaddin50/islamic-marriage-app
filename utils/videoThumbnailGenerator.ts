/**
 * Video thumbnail generation utility for web browsers
 */

export interface VideoThumbnailOptions {
  time?: number; // Time in seconds to capture the frame (default: 3)
  width?: number; // Thumbnail width (default: 400)
  height?: number; // Thumbnail height (default: 300)
  quality?: number; // JPEG quality (0-1, default: 0.8)
  retries?: number; // Number of retries if first attempt fails (default: 3)
}

/**
 * Generate a thumbnail from a video file or URL with improved reliability
 */
export async function generateVideoThumbnail(
  videoSource: string | File | Blob,
  options: VideoThumbnailOptions = {}
): Promise<string> {
  const { time = 3, width = 400, height = 300, quality = 0.8, retries = 3 } = options;

  return new Promise((resolve, reject) => {
    let attemptCount = 0;

    const attemptThumbnailGeneration = () => {
      attemptCount++;
      
      // Create video element
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata'; // Load metadata first
      
      // Create canvas for thumbnail
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = width;
      canvas.height = height;

      let hasSeekCompleted = false;
      let timeoutId: NodeJS.Timeout;

      // Cleanup function
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        video.pause();
        video.removeAttribute('src');
        video.load(); // Reset video element
        video.remove();
        canvas.remove();
      };

      // Set a timeout to prevent hanging
      timeoutId = setTimeout(() => {
        cleanup();
        if (attemptCount < retries) {
          console.log(`Thumbnail generation attempt ${attemptCount} failed, retrying...`);
          setTimeout(attemptThumbnailGeneration, 1000); // Wait 1 second before retry
        } else {
          reject(new Error('Video thumbnail generation timed out after multiple attempts'));
        }
      }, 15000); // 15 second timeout

      // Handle video ready state
      video.addEventListener('loadedmetadata', () => {
        console.log(`Video metadata loaded. Duration: ${video.duration}s`);
        
        // Ensure we don't seek beyond video duration
        const seekTime = Math.min(time, Math.max(video.duration - 1, 0));
        
        // Add small delay to ensure video is fully ready
        setTimeout(() => {
          video.currentTime = seekTime;
        }, 100);
      });

      // Handle successful seek
      video.addEventListener('seeked', () => {
        if (hasSeekCompleted) return; // Prevent multiple calls
        hasSeekCompleted = true;

        try {
          // Wait a bit more to ensure frame is rendered
          setTimeout(() => {
            try {
              // Verify video has valid dimensions
              if (video.videoWidth === 0 || video.videoHeight === 0) {
                throw new Error('Video has invalid dimensions');
              }

              // Draw video frame to canvas
              ctx.drawImage(video, 0, 0, width, height);
              
              // Convert canvas to data URL
              const thumbnailDataUrl = canvas.toDataURL('image/jpeg', quality);
              
              // Verify we got a valid thumbnail (not just empty canvas)
              if (thumbnailDataUrl.length < 1000) { // Very small data URL likely means empty canvas
                throw new Error('Generated thumbnail appears to be empty');
              }
              
              clearTimeout(timeoutId);
              cleanup();
              
              console.log('Video thumbnail generated successfully');
              resolve(thumbnailDataUrl);
            } catch (drawError) {
              clearTimeout(timeoutId);
              cleanup();
              
              if (attemptCount < retries) {
                console.log(`Thumbnail draw attempt ${attemptCount} failed, retrying...`, drawError);
                setTimeout(attemptThumbnailGeneration, 1000);
              } else {
                reject(drawError);
              }
            }
          }, 200); // Wait 200ms for frame to render
        } catch (error) {
          clearTimeout(timeoutId);
          cleanup();
          
          if (attemptCount < retries) {
            console.log(`Thumbnail generation attempt ${attemptCount} failed, retrying...`, error);
            setTimeout(attemptThumbnailGeneration, 1000);
          } else {
            reject(error);
          }
        }
      });

      // Handle video errors
      video.addEventListener('error', (error) => {
        clearTimeout(timeoutId);
        cleanup();
        
        if (attemptCount < retries) {
          console.log(`Video load attempt ${attemptCount} failed, retrying...`, error);
          setTimeout(attemptThumbnailGeneration, 1000);
        } else {
          reject(error);
        }
      });

      // Handle cases where video can't play
      video.addEventListener('stalled', () => {
        console.log('Video loading stalled, this might be a network issue');
      });

      video.addEventListener('loadstart', () => {
        console.log('Video loading started...');
      });

      video.addEventListener('canplay', () => {
        console.log('Video can start playing');
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
    };

    // Start the first attempt
    attemptThumbnailGeneration();
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
      console.log('Video thumbnail generation not supported in this browser');
      return defaultThumbnail;
    }

    console.log(`Generating thumbnail for video: ${videoUrl.substring(0, 50)}...`);
    const thumbnail = await generateVideoThumbnail(videoUrl, {
      time: 3, // Default to 3 seconds
      width: 400,
      height: 300,
      quality: 0.8,
      retries: 3,
      ...options // Allow overrides
    });
    
    return thumbnail;
  } catch (error) {
    console.warn('Failed to generate video thumbnail after all retries:', error);
    return defaultThumbnail;
  }
}

/**
 * Batch generate thumbnails for multiple videos with proper delay between requests
 */
export async function generateMultipleVideoThumbnails(
  videos: Array<{ id: string; url: string }>,
  defaultThumbnail: string,
  options: VideoThumbnailOptions = {},
  onProgress?: (completed: number, total: number, videoId: string, thumbnail: string) => void
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    
    try {
      // Add delay between requests to prevent overwhelming the browser
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
      const thumbnail = await generateVideoThumbnailWithFallback(
        video.url,
        defaultThumbnail,
        { time: 3, ...options }
      );
      
      results[video.id] = thumbnail;
      
      if (onProgress) {
        onProgress(i + 1, videos.length, video.id, thumbnail);
      }
    } catch (error) {
      console.warn(`Failed to generate thumbnail for video ${video.id}:`, error);
      results[video.id] = defaultThumbnail;
    }
  }
  
  return results;
}