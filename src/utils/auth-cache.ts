/**
 * Authentication cache for instant user data access
 */

import { supabase } from '../config/supabase';

interface CachedUserData {
  user: any;
  profile: any;
  timestamp: number;
}

class AuthCacheManager {
  private static instance: AuthCacheManager;
  private cache: CachedUserData | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AuthCacheManager {
    if (!AuthCacheManager.instance) {
      AuthCacheManager.instance = new AuthCacheManager();
    }
    return AuthCacheManager.instance;
  }

  // Get cached user data or fetch if needed
  async getCurrentUserData(): Promise<CachedUserData | null> {
    // Return cached data if fresh
    if (this.cache && (Date.now() - this.cache.timestamp) < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      // Fetch fresh user data
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        this.cache = null;
        return null;
      }

      // Fetch user profile in parallel
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('gender, first_name, id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.warn('Failed to fetch user profile for cache:', profileError);
      }

      // Cache the result
      this.cache = {
        user,
        profile: profile || null,
        timestamp: Date.now()
      };

      return this.cache;
    } catch (error) {
      console.error('Failed to fetch user data for cache:', error);
      this.cache = null;
      return null;
    }
  }

  // Get cached user data synchronously (returns null if not cached)
  getCachedUserData(): CachedUserData | null {
    if (this.cache && (Date.now() - this.cache.timestamp) < this.CACHE_TTL) {
      return this.cache;
    }
    return null;
  }

  // Clear cache (on logout)
  clearCache(): void {
    this.cache = null;
  }

  // Update cache with new data
  updateCache(user: any, profile: any): void {
    this.cache = {
      user,
      profile,
      timestamp: Date.now()
    };
  }

  // Preload user data in background
  async preloadUserData(): Promise<void> {
    try {
      await this.getCurrentUserData();
    } catch (error) {
      console.warn('Failed to preload user data:', error);
    }
  }
}

export const authCache = AuthCacheManager.getInstance();

// Initialize auth cache on app start
export const initializeAuthCache = async (): Promise<void> => {
  try {
    await authCache.preloadUserData();
  } catch (error) {
    console.warn('Failed to initialize auth cache:', error);
  }
};

// Listen for auth state changes and update cache
let authListener: { data: { subscription: any } } | null = null;

export const setupAuthCacheListener = (): void => {
  if (authListener) return; // Already set up

  authListener = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      authCache.clearCache();
    } else if (event === 'SIGNED_IN' && session?.user) {
      // Preload user data for the new session
      authCache.preloadUserData().catch(() => {});
    }
  });
};

export const cleanupAuthCacheListener = (): void => {
  if (authListener) {
    authListener.data.subscription.unsubscribe();
    authListener = null;
  }
};
