/**
 * React hook for cache warming integration
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CacheWarmingService } from '../services/cache-warming.service';
import { AppState } from 'react-native';

interface CacheWarmingState {
  isWarming: boolean;
  lastWarmingStats: any;
  cacheStats: any;
  warmCache: (options?: any) => Promise<void>;
  clearCache: () => Promise<void>;
  warmCacheBackground: () => void;
}

/**
 * Hook for cache warming functionality
 */
export function useCacheWarming(): CacheWarmingState {
  const [isWarming, setIsWarming] = useState(false);
  const queryClient = useQueryClient();

  // Get cache statistics
  const { data: cacheStats, refetch: refetchStats } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: CacheWarmingService.getCacheStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Get last warming statistics
  const { data: lastWarmingStats } = useQuery({
    queryKey: ['last-warming-stats'],
    queryFn: async () => {
      const stats = await CacheWarmingService.getCacheStats();
      return stats.lastWarming;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Manual cache warming
  const warmCache = useCallback(async (options: any = {}) => {
    setIsWarming(true);
    try {
      await CacheWarmingService.warmCache(options);
      refetchStats();
    } catch (error) {
      console.error('Manual cache warming failed:', error);
    } finally {
      setIsWarming(false);
    }
  }, [refetchStats]);

  // Background cache warming
  const warmCacheBackground = useCallback(() => {
    CacheWarmingService.warmCacheBackground({
      priority: 'low',
      enableImagePreloading: true,
      maxProfilesToPreload: 30,
      maxImagesToPreload: 15,
    });
  }, []);

  // Clear all caches
  const clearCache = useCallback(async () => {
    await CacheWarmingService.clearAllCaches();
    queryClient.clear();
    refetchStats();
  }, [queryClient, refetchStats]);

  return {
    isWarming,
    lastWarmingStats,
    cacheStats,
    warmCache,
    clearCache,
    warmCacheBackground,
  };
}

/**
 * Hook for automatic cache warming on app lifecycle events
 */
export function useAutoCacheWarming(enabled: boolean = true) {
  const { warmCacheBackground } = useCacheWarming();

  useEffect(() => {
    if (!enabled) return;

    // Warm cache on app start
    const timer = setTimeout(() => {
      warmCacheBackground();
    }, 2000); // Wait 2 seconds after app start

    // Handle app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Warm cache when app becomes active
        setTimeout(warmCacheBackground, 1000);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearTimeout(timer);
      subscription?.remove();
    };
  }, [enabled, warmCacheBackground]);
}

/**
 * Hook for user-specific cache warming
 */
export function useUserCacheWarming(userId?: string) {
  const [isWarming, setIsWarming] = useState(false);
  const [warmingStats, setWarmingStats] = useState<any>(null);

  const warmCacheForUser = useCallback(async (options: any = {}) => {
    if (!userId) return;

    setIsWarming(true);
    try {
      const stats = await CacheWarmingService.warmCacheForUser(userId, options);
      setWarmingStats(stats);
    } catch (error) {
      console.error('User cache warming failed:', error);
    } finally {
      setIsWarming(false);
    }
  }, [userId]);

  // Auto-warm cache for user on mount
  useEffect(() => {
    if (userId) {
      const timer = setTimeout(() => {
        warmCacheForUser({
          priority: 'normal',
          maxProfilesToPreload: 20,
          maxImagesToPreload: 10,
        });
      }, 3000); // Wait 3 seconds after user is available

      return () => clearTimeout(timer);
    }
  }, [userId, warmCacheForUser]);

  return {
    isWarming,
    warmingStats,
    warmCacheForUser,
  };
}
