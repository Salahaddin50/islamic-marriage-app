/**
 * React Query configuration for optimized caching and data management
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache profiles for 2 minutes (fresh data)
      staleTime: 2 * 60 * 1000, // 2 minutes
      // Keep in cache for 10 minutes (background data)
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      // Don't refetch on window focus for mobile app
      refetchOnWindowFocus: false,
      // Retry failed requests with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query keys for consistent caching
export const QueryKeys = {
  // Profile queries
  profiles: (filters?: any) => ['profiles', filters] as const,
  profilesInfinite: (filters?: any) => ['profiles', 'infinite', filters] as const,
  
  // Interest queries
  interests: ['interests'] as const,
  interestsForUser: (userId: string) => ['interests', 'user', userId] as const,
  
  // Media queries
  media: (userId: string) => ['media', userId] as const,
  profilePicture: (userId: string) => ['profilePicture', userId] as const,
} as const;
