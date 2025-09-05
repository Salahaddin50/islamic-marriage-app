/**
 * Enhanced React Query hook with materialized view optimization
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { OptimizedProfilesService, OptimizedProfileFilters } from '../services/optimized-profiles.service';
import { InterestsService } from '../services/interests';
import { QueryKeys } from '../config/queryClient';
import { supabase } from '../config/supabase';
import { useProfilesInfinite } from './useProfilesQuery'; // Fallback

interface UseOptimizedProfilesOptions {
  filters?: OptimizedProfileFilters;
  enableOptimizedView?: boolean;
  fallbackToRegular?: boolean;
}

/**
 * Hook that uses optimized materialized view for better performance
 */
export function useOptimizedProfiles({
  filters = {},
  enableOptimizedView = true,
  fallbackToRegular = true
}: UseOptimizedProfilesOptions = {}) {
  
  // Check if optimized view is available
  const { data: viewStatus } = useQuery({
    queryKey: ['optimized-view-status'],
    queryFn: OptimizedProfilesService.checkViewStatus,
    staleTime: 5 * 60 * 1000, // Check every 5 minutes
    retry: 1
  });

  const shouldUseOptimizedView = enableOptimizedView && viewStatus?.exists;

  // Get current user gender for filtering
  const { data: currentUserGender } = useQuery({
    queryKey: ['current-user-gender'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return null;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('gender')
        .eq('user_id', user.id)
        .single();
      
      return profile?.gender || null;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  // Optimized query using materialized view
  const optimizedQuery = useInfiniteQuery({
    queryKey: ['optimized-profiles', filters, currentUserGender],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await OptimizedProfilesService.fetchOptimizedProfiles(
        pageParam, 
        filters, 
        currentUserGender
      );

      // Enhance with interest data
      const interests = await InterestsService.loadAllInterestsForUser();
      
      const enhancedProfiles = result.profiles.map(profile => ({
        ...profile,
        unlocked: interests.approved.has(profile.user_id) || 
                  interests.pendingIncoming.has(profile.user_id)
      }));

      return {
        profiles: enhancedProfiles,
        nextPage: result.hasMore ? pageParam + 1 : undefined,
        hasMore: result.hasMore,
        total: result.total
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: shouldUseOptimizedView && !!currentUserGender,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fallback to regular query
  const fallbackQuery = useProfilesInfinite(filters);

  // Return the appropriate query based on availability
  if (shouldUseOptimizedView) {
    return {
      ...optimizedQuery,
      isUsingOptimizedView: true,
      viewStatus,
    };
  } else if (fallbackToRegular) {
    return {
      ...fallbackQuery,
      isUsingOptimizedView: false,
      viewStatus,
    };
  } else {
    // Return disabled query if no fallback
    return {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Optimized view not available and fallback disabled'),
      fetchNextPage: () => Promise.resolve({}),
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: () => Promise.resolve({}),
      isRefetching: false,
      isUsingOptimizedView: false,
      viewStatus,
    };
  }
}

/**
 * Hook for profile analytics and counts
 */
export function useProfileAnalytics(
  filters: OptimizedProfileFilters = {}
) {
  const { data: currentUserGender } = useQuery({
    queryKey: ['current-user-gender'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return null;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('gender')
        .eq('user_id', user.id)
        .single();
      
      return profile?.gender || null;
    },
    staleTime: 10 * 60 * 1000,
  });

  return useQuery({
    queryKey: ['profile-analytics', filters, currentUserGender],
    queryFn: () => OptimizedProfilesService.getProfileCounts(filters, currentUserGender),
    enabled: !!currentUserGender,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to refresh materialized view on demand
 */
export function useRefreshOptimizedView() {
  return useQuery({
    queryKey: ['refresh-optimized-view'],
    queryFn: OptimizedProfilesService.refreshMaterializedView,
    enabled: false, // Only run when manually triggered
  });
}

/**
 * Combined hook that provides all optimized profile functionality
 */
export function useOptimizedProfilesComplete(
  filters: OptimizedProfileFilters = {}
) {
  const profilesQuery = useOptimizedProfiles({ filters });
  const analyticsQuery = useProfileAnalytics(filters);
  const refreshMutation = useRefreshOptimizedView();

  return {
    // Profile data
    profiles: profilesQuery.data?.pages.flatMap(page => page.profiles) ?? [],
    isLoading: profilesQuery.isLoading,
    isError: profilesQuery.isError,
    error: profilesQuery.error,
    fetchNextPage: profilesQuery.fetchNextPage,
    hasNextPage: profilesQuery.hasNextPage,
    isFetchingNextPage: profilesQuery.isFetchingNextPage,
    refetch: profilesQuery.refetch,
    isRefetching: profilesQuery.isRefetching,
    
    // Analytics data
    analytics: analyticsQuery.data,
    analyticsLoading: analyticsQuery.isLoading,
    
    // Optimization info
    isUsingOptimizedView: profilesQuery.isUsingOptimizedView,
    viewStatus: profilesQuery.viewStatus,
    
    // Manual refresh
    refreshView: refreshMutation.refetch,
    isRefreshingView: refreshMutation.isFetching,
  };
}
