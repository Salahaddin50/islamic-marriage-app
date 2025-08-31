/**
 * High-performance image cache for instant profile loading
 * Inspired by Instagram/TikTok feed optimization
 */

interface CachedImage {
  uri: string;
  blob?: Blob;
  dataUrl?: string;
  timestamp: number;
  size: number;
}

class ImageCacheManager {
  private cache = new Map<string, CachedImage>();
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_ITEMS = 200;
  private currentSize = 0;

  // Preload images in background
  async preloadImage(uri: string): Promise<string> {
    if (this.cache.has(uri)) {
      const cached = this.cache.get(uri)!;
      cached.timestamp = Date.now(); // Update LRU
      return cached.dataUrl || uri;
    }

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert to data URL for instant rendering
      const dataUrl = await this.blobToDataUrl(blob);
      
      const item: CachedImage = {
        uri,
        blob,
        dataUrl,
        timestamp: Date.now(),
        size: blob.size
      };

      this.addToCache(uri, item);
      return dataUrl;
    } catch {
      return uri; // Fallback to original URI
    }
  }

  // Get cached image or original URI
  getCachedImage(uri: string): string {
    const cached = this.cache.get(uri);
    if (cached) {
      cached.timestamp = Date.now(); // Update LRU
      return cached.dataUrl || uri;
    }
    
    // Start preloading in background
    this.preloadImage(uri).catch(() => {});
    return uri;
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private addToCache(uri: string, item: CachedImage) {
    // Remove oldest items if needed
    while (this.currentSize + item.size > this.MAX_CACHE_SIZE || this.cache.size >= this.MAX_ITEMS) {
      this.removeOldestItem();
    }

    this.cache.set(uri, item);
    this.currentSize += item.size;
  }

  private removeOldestItem() {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const item = this.cache.get(oldestKey);
      if (item) {
        this.currentSize -= item.size;
        this.cache.delete(oldestKey);
      }
    }
  }

  // Batch preload multiple images
  async preloadBatch(uris: string[]): Promise<void> {
    const promises = uris.slice(0, 10).map(uri => 
      this.preloadImage(uri).catch(() => {})
    );
    await Promise.allSettled(promises);
  }

  // Clear cache when memory pressure
  clearCache() {
    this.cache.clear();
    this.currentSize = 0;
  }

  // Get cache stats
  getStats() {
    return {
      items: this.cache.size,
      sizeBytes: this.currentSize,
      sizeMB: Math.round(this.currentSize / 1024 / 1024 * 100) / 100
    };
  }
}

export const imageCache = new ImageCacheManager();
