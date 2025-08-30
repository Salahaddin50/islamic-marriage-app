import { useState, useEffect } from 'react';
import { supabase } from '@/src/config/supabase';
import { images } from '@/constants';
import { Platform } from 'react-native';

interface ProfilePictureResult {
  imageSource: any;
  isLoading: boolean;
  hasCustomImage: boolean;
}

// Simple global cache with pending promises to prevent duplicate fetches
let globalCache: { [userId: string]: { url: string | null; timestamp: number } } = {};
let pendingFetches: { [userId: string]: Promise<string | null> } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useProfilePictureSimple(forceRefresh?: number, userIdOverride?: string): ProfilePictureResult {
  // Initialize from cache synchronously if userId is provided
  const initialFromCache = userIdOverride ? getCachedProfilePicture(userIdOverride) : null;
  const [imageSource, setImageSource] = useState<any>(initialFromCache ?? images.user1);
  const [isLoading, setIsLoading] = useState<boolean>(!Boolean(initialFromCache));
  const [hasCustomImage, setHasCustomImage] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        // Determine which userId to use
        let effectiveUserId: string | null = userIdOverride || null;
        if (!effectiveUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          effectiveUserId = user?.id ?? null;
        }

        if (!effectiveUserId) {
          setIsLoading(false);
          return;
        }

        const now = Date.now();
        const cached = globalCache[effectiveUserId];
        
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
        if (pendingFetches[effectiveUserId] && !forceRefresh) {
          const profilePictureUrl = await pendingFetches[effectiveUserId];
          // Update cache from the pending fetch result
          globalCache[effectiveUserId] = {
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
            .eq('user_id', effectiveUserId)
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
              .select('profile_picture_url, gender')
              .eq('user_id', effectiveUserId)
              .maybeSingle();
            
            profilePictureUrl = profile?.profile_picture_url || null;

            // If still none, choose gender-based silhouette
            if (!profilePictureUrl) {
              const isFemale = (profile?.gender || '').toLowerCase() === 'female';
              if (Platform.OS === 'web') {
                profilePictureUrl = isFemale
                  ? 'https://islamic-marriage-photos-2025.lon1.cdn.digitaloceanspaces.com/silhouette/female_silhouette.jpg'
                  : 'https://islamic-marriage-photos-2025.lon1.cdn.digitaloceanspaces.com/silhouette/male_silhouette.png';
              } else {
                // For native, keep using local bundled assets via images
                // We'll return null to signal using images fallback in caller below
                profilePictureUrl = null;
              }
            }
          }

          return profilePictureUrl;
        })();

        // Store the pending fetch
        pendingFetches[effectiveUserId] = fetchPromise;

        const profilePictureUrl = await fetchPromise;

        // Clean up the pending fetch
        delete pendingFetches[effectiveUserId];

        // Update cache
        globalCache[effectiveUserId] = {
          url: profilePictureUrl,
          timestamp: now
        };

        // Set image source
        if (profilePictureUrl) {
          setImageSource({ uri: profilePictureUrl });
          setHasCustomImage(true);
        } else {
          // Use local gender-neutral default if no URL (native platforms)
          setImageSource(images.user1);
          setHasCustomImage(false);
        }

      } catch (error) {
        console.log('Error fetching profile picture:', error);
        setImageSource(images.user1);
        setHasCustomImage(false);
        
        // Clean up any pending fetch on error
        const { data: { user } } = await supabase.auth.getUser();
        const effectiveUserId = userIdOverride || user?.id;
        if (effectiveUserId && pendingFetches[effectiveUserId]) {
          delete pendingFetches[effectiveUserId];
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfilePicture();
  }, [forceRefresh, userIdOverride]);

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
