import { useState, useEffect } from 'react';
import { supabase } from '@/src/config/supabase';
import { images } from '@/constants';

interface ProfilePictureResult {
  imageSource: any;
  isLoading: boolean;
  hasCustomImage: boolean;
}

// Simple global cache with pending promises to prevent duplicate fetches
let globalCache: { [userId: string]: { url: string | null; timestamp: number } } = {};
let pendingFetches: { [userId: string]: Promise<string | null> } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useProfilePictureSimple(forceRefresh?: number): ProfilePictureResult {
  const [imageSource, setImageSource] = useState<any>(() => {
    // Try to initialize with cached value immediately if available
    return images.user1;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCustomImage, setHasCustomImage] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const now = Date.now();
        const cached = globalCache[user.id];
        
        // Use cache if valid and not forcing refresh
        if (cached && !forceRefresh && (now - cached.timestamp) < CACHE_DURATION) {
          if (cached.url) {
            setImageSource({ uri: cached.url });
            setHasCustomImage(true);
          } else {
            setImageSource(images.user1);
            setHasCustomImage(false);
          }
          setIsLoading(false);
          return;
        }

        // Check if there's already a pending fetch for this user
        if (pendingFetches[user.id] && !forceRefresh) {
          const profilePictureUrl = await pendingFetches[user.id];
          // Update cache from the pending fetch result
          globalCache[user.id] = {
            url: profilePictureUrl,
            timestamp: now
          };
          
          // Set image source
          if (profilePictureUrl) {
            setImageSource({ uri: profilePictureUrl });
            setHasCustomImage(true);
          } else {
            setImageSource(images.user1);
            setHasCustomImage(false);
          }
          setIsLoading(false);
          return;
        }

        // Create a new fetch promise to prevent duplicate requests
        const fetchPromise = (async (): Promise<string | null> => {
          let profilePictureUrl: string | null = null;

          // Single query to get profile picture from media_references
          const { data: mediaRef } = await supabase
            .from('media_references')
            .select('do_spaces_cdn_url, do_spaces_url, external_url')
            .eq('user_id', user.id)
            .eq('media_type', 'photo')
            .eq('is_profile_picture', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (mediaRef) {
            profilePictureUrl = mediaRef.do_spaces_cdn_url || mediaRef.do_spaces_url || mediaRef.external_url;
          }

          // Fallback to user_profiles only if no media reference found
          if (!profilePictureUrl) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('profile_picture_url')
              .eq('user_id', user.id)
              .maybeSingle();
            
            profilePictureUrl = profile?.profile_picture_url || null;
          }

          return profilePictureUrl;
        })();

        // Store the pending fetch
        pendingFetches[user.id] = fetchPromise;

        const profilePictureUrl = await fetchPromise;

        // Clean up the pending fetch
        delete pendingFetches[user.id];

        // Update cache
        globalCache[user.id] = {
          url: profilePictureUrl,
          timestamp: now
        };

        // Set image source
        if (profilePictureUrl) {
          setImageSource({ uri: profilePictureUrl });
          setHasCustomImage(true);
        } else {
          setImageSource(images.user1);
          setHasCustomImage(false);
        }

      } catch (error) {
        console.log('Error fetching profile picture:', error);
        setImageSource(images.user1);
        setHasCustomImage(false);
        
        // Clean up any pending fetch on error
        const { data: { user } } = await supabase.auth.getUser();
        if (user && pendingFetches[user.id]) {
          delete pendingFetches[user.id];
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfilePicture();
  }, [forceRefresh]);

  return {
    imageSource,
    isLoading,
    hasCustomImage
  };
}

// Get cached profile picture synchronously if available
export const getCachedProfilePicture = (userId: string) => {
  const cached = globalCache[userId];
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.url ? { uri: cached.url } : images.user1;
  }
  return null;
};

// Clear cache for a specific user or all users
export const clearProfilePictureCache = (userId?: string) => {
  if (userId) {
    delete globalCache[userId];
    delete pendingFetches[userId];
  } else {
    globalCache = {};
    pendingFetches = {};
  }
};
