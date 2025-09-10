/**
 * High-performance virtualized profiles hook
 * Optimized for massive datasets like Instagram/TikTok
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../src/config/supabase';
import { InterestsService } from '../src/services/interests';
import { imageCache } from '../utils/imageCache';
import { images } from '../constants';

export interface ProfileItem {
  id: string;
  user_id: string;
  name: string;
  age: number;
  height?: string;
  weight?: string;
  country?: string;
  city?: string;
  image: any;
  unlocked?: boolean;
}

interface UseVirtualizedProfilesOptions {
  pageSize?: number;
  enablePrefetch?: boolean;
  cacheKey?: string;
}

export const useVirtualizedProfiles = (options: UseVirtualizedProfilesOptions = {}) => {
  const { pageSize = 12, enablePrefetch = true, cacheKey = 'profiles_cache' } = options; // Reduced for faster initial load
  
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const prefetchedPages = useRef(new Set<number>());
  const oppositeGender = useRef<string | null>(null);
  const interestCache = useRef<{
    pendingIncoming: Set<string>;
    approved: Set<string>;
    loadTime: number;
  } | null>(null);

  // Fast interest status loading with caching
  const loadInterestStatus = useCallback(async () => {
    const now = Date.now();
    if (interestCache.current && (now - interestCache.current.loadTime) < 30000) {
      return interestCache.current;
    }

    try {
      const { data: { user: me } } = await supabase.auth.getUser();
      if (!me) return { pendingIncoming: new Set(), approved: new Set(), loadTime: now };

      // Use optimized batch loading
      const interests = await InterestsService.loadAllInterestsForUser();
      const result = { 
        pendingIncoming: interests.pendingIncoming, 
        approved: interests.approved, 
        loadTime: now 
      };
      interestCache.current = result;
      return result;
    } catch {
      return { pendingIncoming: new Set(), approved: new Set(), loadTime: now };
    }
  }, []);

  // Optimized profile fetching with smart batching
  const fetchProfiles = useCallback(async (
    pageNum: number, 
    filters: any = {}, 
    isLoadMore: boolean = false
  ) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // Get current user gender for filtering
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      let currentUserGender = null;
      
      if (currentUser?.id && !oppositeGender.current) {
        const { data: currentUserProfile } = await supabase
          .from('user_profiles')
          .select('gender')
          .eq('user_id', currentUser.id)
          .single();
        currentUserGender = currentUserProfile?.gender;
        oppositeGender.current = currentUserGender?.toLowerCase() === 'male' ? 'female' : 'male';
      }

      // Build optimized query
      const start = pageNum * pageSize;
      const end = start + pageSize - 1;

      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          first_name,
          date_of_birth,
          height_cm,
          weight_kg,
          city,
          country,
          gender,
          profile_picture_url,
          is_public
        `)
        .order('created_at', { ascending: false })
        .range(start, end);

      // Apply essential filters only
      if (currentUser?.id) {
        query = query.neq('user_id', currentUser.id);
      }
      
      if (oppositeGender.current) {
        query = query.eq('gender', oppositeGender.current);
        // Additional rule: male users should not see unapproved female profiles
        if (oppositeGender.current === 'female') {
          query = query.eq('admin_approved', true);
        }
      }

      // Only show public profiles on home feed
      query = query.eq('is_public', true);

      // Apply location filters if provided
      if (filters.selectedCountry) {
        query = query.eq('country', filters.selectedCountry);
      }
      if (filters.selectedCity) {
        query = query.eq('city', filters.selectedCity);
      }

      const { data: profilesData, error: queryError } = await query;

      if (queryError) {
        setError(queryError.message);
        return;
      }

      if (!profilesData) {
        setHasMore(false);
        return;
      }

      // Load interest status once per session
      const interests = await loadInterestStatus();

      // Process profiles efficiently
      const processedProfiles = profilesData.map((profile: any) => {
        // Calculate age efficiently
        const birthYear = new Date(profile.date_of_birth).getFullYear();
        const age = new Date().getFullYear() - birthYear;

        // Apply age filter client-side
        if (filters.ageRange && (age < filters.ageRange[0] || age > filters.ageRange[1])) {
          return null;
        }

        const isFemale = profile.gender?.toLowerCase() === 'female';
        const imageUri = profile.profile_picture_url;

        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.first_name || 'Member',
          age,
          height: profile.height_cm ? `${profile.height_cm}cm` : undefined,
          weight: profile.weight_kg ? `${profile.weight_kg}kg` : undefined,
          country: profile.country || undefined,
          city: profile.city || undefined,
          image: imageUri ? { uri: imageUri } : (isFemale ? images.femaleSilhouette : images.maleSilhouette),
          unlocked: interests.approved.has(profile.user_id) || interests.pendingIncoming.has(profile.user_id)
        };
      }).filter(Boolean) as ProfileItem[];

      // Update state
      if (isLoadMore) {
        setProfiles(prev => [...prev, ...processedProfiles]);
        setPage(pageNum);
      } else {
        setProfiles(processedProfiles);
        setPage(0);
      }

      // Update hasMore flag
      setHasMore(processedProfiles.length === pageSize);

      // Smart prefetching for next page
      if (enablePrefetch && !prefetchedPages.current.has(pageNum + 1)) {
        prefetchedPages.current.add(pageNum + 1);
        setTimeout(() => {
          fetchProfiles(pageNum + 1, filters, false).catch(() => {});
        }, 1000);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [pageSize, enablePrefetch, loadInterestStatus]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchProfiles(page + 1, {}, true);
    }
  }, [fetchProfiles, page, loadingMore, hasMore]);

  // Refresh function
  const refresh = useCallback(async (filters: any = {}) => {
    prefetchedPages.current.clear();
    interestCache.current = null; // Clear interest cache
    setPage(0);
    setHasMore(true);
    await fetchProfiles(0, filters, false);
  }, [fetchProfiles]);

  // Memoized values for performance
  const memoizedProfiles = useMemo(() => profiles, [profiles]);
  
  return {
    profiles: memoizedProfiles,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    cacheStats: imageCache.getStats()
  };
};
