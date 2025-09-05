/**
 * Comprehensive Cache Warming Service
 * Preloads critical data for instant app experiences
 * Inspired by Instagram/TikTok preloading strategies
 */

import { queryClient } from '../config/queryClient';
import { QueryKeys } from '../config/queryClient';
import { OptimizedProfilesService } from './optimized-profiles.service';
import { InterestsService } from './interests';
import { imageCache } from '../../utils/imageCache';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheWarmingOptions {
  enableImagePreloading?: boolean;
  enableProfilePreloading?: boolean;
  enableInterestsPreloading?: boolean;
  maxProfilesToPreload?: number;
  maxImagesToPreload?: number;
  priority?: 'low' | 'normal' | 'high';
}

interface CacheWarmingStats {
  profilesPreloaded: number;
  imagesPreloaded: number;
  interestsPreloaded: boolean;
  totalTime: number;
  errors: string[];
}

export class CacheWarmingService {
  private static readonly CACHE_WARMING_KEY = 'cache_warming_stats';
  private static readonly LAST_WARMING_KEY = 'last_cache_warming';
  private static readonly WARMING_INTERVAL = 30 * 60 * 1000; // 30 minutes
  
  private static isWarming = false;
  private static warmingPromise: Promise<CacheWarmingStats> | null = null;

  /**
   * Main cache warming function - call on app start
   */
  static async warmCache(options: CacheWarmingOptions = {}): Promise<CacheWarmingStats> {
    // Prevent multiple simultaneous warming sessions
    if (this.isWarming && this.warmingPromise) {
      return this.warmingPromise;
    }

    // Check if we need to warm cache (avoid too frequent warming)
    const shouldWarm = await this.shouldWarmCache();
    if (!shouldWarm) {
      const lastStats = await this.getLastWarmingStats();
      return lastStats || this.getEmptyStats();
    }

    this.isWarming = true;
    this.warmingPromise = this.performCacheWarming(options);

    try {
      const result = await this.warmingPromise;
      await this.saveWarmingStats(result);
      return result;
    } finally {
      this.isWarming = false;
      this.warmingPromise = null;
    }
  }

  /**
   * Background cache warming - non-blocking
   */
  static warmCacheBackground(options: CacheWarmingOptions = {}): void {
    // Run in background without awaiting
    this.warmCache({ ...options, priority: 'low' }).catch(error => {
      console.log('Background cache warming failed:', error);
    });
  }

  /**
   * Warm cache for specific user context
   */
  static async warmCacheForUser(
    userId: string,
    options: CacheWarmingOptions = {}
  ): Promise<CacheWarmingStats> {
    const startTime = Date.now();
    const stats: CacheWarmingStats = {
      profilesPreloaded: 0,
      imagesPreloaded: 0,
      interestsPreloaded: false,
      totalTime: 0,
      errors: []
    };

    try {
      // Get user's gender for personalized preloading
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('gender, country, city')
        .eq('user_id', userId)
        .single();

      if (userProfile) {
        // Warm profiles based on user preferences
        const filters = {
          selectedCountry: userProfile.country,
          selectedCity: userProfile.city,
        };

        await this.preloadProfiles(filters, options, stats);
        await this.preloadInterests(userId, stats);
      }

      stats.totalTime = Date.now() - startTime;
      return stats;

    } catch (error) {
      stats.errors.push(`User warming failed: ${error.message}`);
      stats.totalTime = Date.now() - startTime;
      return stats;
    }
  }

  /**
   * Intelligent image preloading based on user behavior
   */
  static async preloadImagesIntelligent(
    profileIds: string[],
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<number> {
    try {
      // Get profile images to preload
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('profile_picture_url')
        .in('id', profileIds)
        .limit(20); // Limit to prevent overwhelming

      if (!profiles) return 0;

      const imageUrls = profiles
        .map(p => p.profile_picture_url)
        .filter(Boolean) as string[];

      // Preload with different strategies based on priority
      if (priority === 'high') {
        // Preload immediately
        await imageCache.preloadBatch(imageUrls);
        return imageUrls.length;
      } else {
        // Preload in background with delay
        setTimeout(() => {
          imageCache.preloadBatch(imageUrls).catch(() => {});
        }, priority === 'low' ? 5000 : 1000);
        return imageUrls.length;
      }

    } catch (error) {
      console.error('Intelligent image preloading failed:', error);
      return 0;
    }
  }

  /**
   * Preload popular profiles based on activity
   */
  static async preloadPopularProfiles(limit: number = 50): Promise<number> {
    try {
      // This would ideally use analytics data, but for now use recent profiles
      const result = await OptimizedProfilesService.fetchOptimizedProfiles(0, {}, null);
      
      if (result.profiles.length > 0) {
        // Cache the query result
        queryClient.setQueryData(
          QueryKeys.profilesInfinite({}),
          {
            pages: [{ 
              profiles: result.profiles, 
              nextPage: result.hasMore ? 1 : undefined,
              hasMore: result.hasMore 
            }],
            pageParams: [0]
          }
        );

        // Preload images for these profiles
        const imageUrls = result.profiles
          .map(p => typeof p.image === 'object' && p.image?.uri ? p.image.uri : null)
          .filter(Boolean) as string[];
        
        await imageCache.preloadBatch(imageUrls.slice(0, 10)); // Preload first 10 images

        return result.profiles.length;
      }

      return 0;
    } catch (error) {
      console.error('Popular profiles preloading failed:', error);
      return 0;
    }
  }

  /**
   * Preload user's interests and matches
   */
  static async preloadUserInterests(userId: string): Promise<boolean> {
    try {
      // Preload interests data
      const interests = await InterestsService.loadAllInterestsForUser();
      
      // Cache the interests data
      queryClient.setQueryData(QueryKeys.interests, interests);

      return true;
    } catch (error) {
      console.error('Interests preloading failed:', error);
      return false;
    }
  }

  /**
   * Clear all caches (useful for logout or memory pressure)
   */
  static async clearAllCaches(): Promise<void> {
    try {
      // Clear React Query cache
      queryClient.clear();
      
      // Clear image cache
      imageCache.clearCache();
      
      // Clear warming stats
      await AsyncStorage.removeItem(this.CACHE_WARMING_KEY);
      await AsyncStorage.removeItem(this.LAST_WARMING_KEY);

    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    queryCache: any;
    imageCache: any;
    lastWarming?: CacheWarmingStats;
  }> {
    try {
      const lastWarming = await this.getLastWarmingStats();
      
      return {
        queryCache: {
          queries: queryClient.getQueryCache().getAll().length,
          mutations: queryClient.getMutationCache().getAll().length,
        },
        imageCache: imageCache.getStats(),
        lastWarming,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        queryCache: { queries: 0, mutations: 0 },
        imageCache: { items: 0, sizeBytes: 0, sizeMB: 0 },
      };
    }
  }

  // Private helper methods
  private static async performCacheWarming(options: CacheWarmingOptions): Promise<CacheWarmingStats> {
    const startTime = Date.now();
    const stats: CacheWarmingStats = {
      profilesPreloaded: 0,
      imagesPreloaded: 0,
      interestsPreloaded: false,
      totalTime: 0,
      errors: []
    };

    const {
      enableImagePreloading = true,
      enableProfilePreloading = true,
      enableInterestsPreloading = true,
      maxProfilesToPreload = 50,
      maxImagesToPreload = 20,
      priority = 'normal'
    } = options;

    try {
      // Parallel warming tasks
      const warmingTasks: Promise<any>[] = [];

      if (enableProfilePreloading) {
        warmingTasks.push(
          this.preloadProfiles({}, options, stats)
            .catch(error => stats.errors.push(`Profiles: ${error.message}`))
        );
      }

      if (enableInterestsPreloading) {
        warmingTasks.push(
          this.preloadInterests(null, stats)
            .catch(error => stats.errors.push(`Interests: ${error.message}`))
        );
      }

      // Wait for all tasks with timeout
      const timeout = priority === 'high' ? 30000 : priority === 'normal' ? 15000 : 10000;
      await Promise.race([
        Promise.allSettled(warmingTasks),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]);

    } catch (error) {
      stats.errors.push(`General warming error: ${error.message}`);
    }

    stats.totalTime = Date.now() - startTime;
    return stats;
  }

  private static async preloadProfiles(
    filters: any, 
    options: CacheWarmingOptions, 
    stats: CacheWarmingStats
  ): Promise<void> {
    try {
      const result = await OptimizedProfilesService.fetchOptimizedProfiles(0, filters);
      stats.profilesPreloaded = result.profiles.length;

      // Cache the result
      queryClient.setQueryData(
        QueryKeys.profilesInfinite(filters),
        {
          pages: [{ 
            profiles: result.profiles, 
            nextPage: result.hasMore ? 1 : undefined,
            hasMore: result.hasMore 
          }],
          pageParams: [0]
        }
      );

      // Preload images if enabled
      if (options.enableImagePreloading) {
        const imageUrls = result.profiles
          .slice(0, options.maxImagesToPreload || 20)
          .map(p => typeof p.image === 'object' && p.image?.uri ? p.image.uri : null)
          .filter(Boolean) as string[];
        
        const preloadedCount = await imageCache.preloadBatch(imageUrls);
        stats.imagesPreloaded = preloadedCount;
      }

    } catch (error) {
      throw new Error(`Profile preloading failed: ${error.message}`);
    }
  }

  private static async preloadInterests(userId: string | null, stats: CacheWarmingStats): Promise<void> {
    try {
      const interests = await InterestsService.loadAllInterestsForUser();
      queryClient.setQueryData(QueryKeys.interests, interests);
      stats.interestsPreloaded = true;
    } catch (error) {
      throw new Error(`Interests preloading failed: ${error.message}`);
    }
  }

  private static async shouldWarmCache(): Promise<boolean> {
    try {
      const lastWarming = await AsyncStorage.getItem(this.LAST_WARMING_KEY);
      if (!lastWarming) return true;

      const lastWarmingTime = parseInt(lastWarming, 10);
      const timeSinceLastWarming = Date.now() - lastWarmingTime;
      
      return timeSinceLastWarming > this.WARMING_INTERVAL;
    } catch {
      return true;
    }
  }

  private static async getLastWarmingStats(): Promise<CacheWarmingStats | null> {
    try {
      const stats = await AsyncStorage.getItem(this.CACHE_WARMING_KEY);
      return stats ? JSON.parse(stats) : null;
    } catch {
      return null;
    }
  }

  private static async saveWarmingStats(stats: CacheWarmingStats): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_WARMING_KEY, JSON.stringify(stats));
      await AsyncStorage.setItem(this.LAST_WARMING_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to save warming stats:', error);
    }
  }

  private static getEmptyStats(): CacheWarmingStats {
    return {
      profilesPreloaded: 0,
      imagesPreloaded: 0,
      interestsPreloaded: false,
      totalTime: 0,
      errors: []
    };
  }
}
