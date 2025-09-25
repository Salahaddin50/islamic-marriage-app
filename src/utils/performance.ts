/**
 * Performance optimization utilities for the dating app
 */

import { OptimizedProfilesService } from '../services/optimized-profiles.service';

// Refresh materialized view periodically for optimal performance
export const refreshMaterializedView = async () => {
  try {
    console.log('🔄 Refreshing materialized view for optimal performance...');
    await OptimizedProfilesService.refreshMaterializedView();
    console.log('✅ Materialized view refreshed successfully');
  } catch (error) {
    console.error('❌ Failed to refresh materialized view:', error);
  }
};

// Initialize performance optimizations on app start
export const initializePerformanceOptimizations = async () => {
  try {
    // Check if materialized view exists
    const viewStatus = await OptimizedProfilesService.checkViewStatus();
    
    if (!viewStatus.exists) {
      console.log('⚠️ Optimized profiles view does not exist');
      return false;
    }
    
    console.log(`✅ Optimized profiles view ready with ${viewStatus.rowCount} profiles`);
    
    // Refresh view if it's been more than 1 hour
    const lastRefreshKey = 'last_mv_refresh';
    const lastRefresh = localStorage.getItem(lastRefreshKey);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    if (!lastRefresh || parseInt(lastRefresh) < oneHourAgo) {
      // Refresh in background
      refreshMaterializedView().then(() => {
        localStorage.setItem(lastRefreshKey, Date.now().toString());
      }).catch(() => {});
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize performance optimizations:', error);
    return false;
  }
};

// Database query optimization helpers
export const optimizeQuery = {
  // Batch multiple queries into a single request when possible
  batchQueries: async <T>(queries: (() => Promise<T>)[]): Promise<T[]> => {
    return Promise.all(queries.map(query => query()));
  },
  
  // Add query timeout to prevent hanging
  withTimeout: <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      )
    ]);
  }
};

// Memory management for large lists
export const memoryOptimization = {
  // Clear old cached data to free memory
  clearOldCache: () => {
    try {
      // Clear localStorage items older than 24 hours
      const now = Date.now();
      const dayAgo = now - (24 * 60 * 60 * 1000);
      
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith('hume_cache_')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed.timestamp && parsed.timestamp < dayAgo) {
                localStorage.removeItem(key);
              }
            }
          } catch {}
        }
      }
    } catch (error) {
      console.warn('Failed to clear old cache:', error);
    }
  },
  
  // Monitor memory usage (web only)
  getMemoryUsage: (): { used: number; limit: number } | null => {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }
};
