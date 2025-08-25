import { useState, useEffect } from 'react';
import { supabase } from '@/src/config/supabase';
import { images } from '@/constants';
import { Platform } from 'react-native';
// Simple storage implementation using localStorage for web
const storage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      const value = localStorage.getItem(key);
      console.log('📦 Storage GET:', { key, value });
      return value;
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      console.log('📦 Storage SET:', { key, value });
      localStorage.setItem(key, value);
    }
  },
  multiRemove: async (keys: string[]) => {
    if (Platform.OS === 'web') {
      console.log('📦 Storage REMOVE:', keys);
      keys.forEach(key => localStorage.removeItem(key));
    }
  }
};

// Cache keys
const PROFILE_PICTURE_CACHE_KEY = 'profile_picture_cache';
const PROFILE_PICTURE_TIMESTAMP_KEY = 'profile_picture_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Clear cache function
export const clearProfilePictureCache = async () => {
  try {
    await storage.multiRemove([PROFILE_PICTURE_CACHE_KEY, PROFILE_PICTURE_TIMESTAMP_KEY]);
  } catch (error) {
    console.log('Error clearing profile picture cache:', error);
  }
};

export function useProfilePicture(forceRefresh?: number) {
  // Start with the default image from constants
  const [profilePicture, setProfilePicture] = useState<any>(images.user1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCustomImage, setHasCustomImage] = useState<boolean>(false);
  
  // Debug the default image
  useEffect(() => {
    console.log('Default profile picture type:', typeof images.user1);
    if (typeof images.user1 === 'number') {
      console.log('Default image is a require() reference number');
    } else if (typeof images.user1 === 'object') {
      console.log('Default image is an object:', JSON.stringify(images.user1));
    }
    
    // Fix for web platform to ensure default image is properly loaded
    if (Platform.OS === 'web') {
      // For web, we need to ensure the image path is properly resolved
      import('@/constants/webImageFix').then(module => {
        // Use the fixWebImageSource function to handle the default image
        const fixedImageSource = module.fixWebImageSource(images.user1);
        console.log('Web fixed image source:', fixedImageSource);
        setProfilePicture(fixedImageSource);
      }).catch(err => {
        console.log('Failed to load web image fix:', err);
      });
    }
  }, []);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      setIsLoading(true);
      try {
        // Check cache first
        const cachedTimestamp = await storage.getItem(PROFILE_PICTURE_TIMESTAMP_KEY);
        const now = Date.now();
        
        if (cachedTimestamp && !forceRefresh) {
          const timestamp = parseInt(cachedTimestamp, 10);
          if (now - timestamp < CACHE_DURATION) {
            // Cache is still valid
            const cachedPicture = await storage.getItem(PROFILE_PICTURE_CACHE_KEY);
            if (cachedPicture) {
              const pictureData = JSON.parse(cachedPicture);
              setProfilePicture(pictureData);
              setHasCustomImage(true);
              setIsLoading(false);
              return;
            }
          }
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        let profilePictureUrl = null;
        
        // Method 1: Check media_references table for profile pictures
        try {
          console.log('Checking media_references for profile picture...');
          const { data: mediaRef, error: mediaError } = await supabase
            .from('media_references')
            .select('external_url, do_spaces_url, do_spaces_cdn_url')
            .eq('user_id', user.id)
            .eq('media_type', 'photo')
            .eq('is_profile_picture', true)
            .maybeSingle();

          if (mediaError) {
            console.log('Error fetching from media_references:', mediaError);
          } else if (mediaRef) {
            console.log('Found profile picture in media_references:', mediaRef);
            // Use the best available URL (CDN preferred, then direct URL)
            profilePictureUrl = mediaRef.do_spaces_cdn_url || mediaRef.do_spaces_url || mediaRef.external_url;
          }
        } catch (mediaError) {
          console.log('Exception checking media_references:', mediaError);
        }

        // Method 2: If not found in media_references, check user_profiles table
        if (!profilePictureUrl) {
          try {
            console.log('Checking user_profiles for profile picture...');
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('profile_picture_url')
              .eq('user_id', user.id)
              .maybeSingle();

            if (profileError) {
              console.log('Error fetching from user_profiles:', profileError);
            } else if (profile?.profile_picture_url) {
              console.log('Found profile picture in user_profiles:', profile.profile_picture_url);
              profilePictureUrl = profile.profile_picture_url;
            }
          } catch (profileError) {
            console.log('Exception checking user_profiles:', profileError);
          }
        }

        // Set the profile picture if found
        if (profilePictureUrl) {
          console.log('Setting profile picture URL:', profilePictureUrl);
          
          // Make sure the URL is properly formatted and valid
          try {
            const formattedUrl = profilePictureUrl.trim();
            
            // Test if the URL is valid
            if (formattedUrl.startsWith('http://') || formattedUrl.startsWith('https://')) {
              console.log('Valid URL format detected:', formattedUrl);
              
              // Set the profile picture with the properly formatted URL
              if (Platform.OS === 'web') {
                // For web, use the fixWebImageSource helper
                import('@/constants/webImageFix').then(module => {
                  const fixedImageSource = module.fixWebImageSource({ uri: formattedUrl });
                  console.log('Web fixed profile image source:', fixedImageSource);
                  setProfilePicture(fixedImageSource);
                  setHasCustomImage(true);
                  // Cache the profile picture
                  storage.setItem(PROFILE_PICTURE_CACHE_KEY, JSON.stringify(fixedImageSource));
                  storage.setItem(PROFILE_PICTURE_TIMESTAMP_KEY, Date.now().toString());
                }).catch(err => {
                  console.log('Failed to load web image fix for profile:', err);
                  // Fallback to direct URI
                  const directUri = { uri: formattedUrl };
                  setProfilePicture(directUri);
                  setHasCustomImage(true);
                  // Cache the profile picture
                  storage.setItem(PROFILE_PICTURE_CACHE_KEY, JSON.stringify(directUri));
                  storage.setItem(PROFILE_PICTURE_TIMESTAMP_KEY, Date.now().toString());
                });
              } else {
                // For native platforms, use the URI directly
                const nativeUri = { uri: formattedUrl };
                setProfilePicture(nativeUri);
                setHasCustomImage(true);
                // Cache the profile picture
                storage.setItem(PROFILE_PICTURE_CACHE_KEY, JSON.stringify(nativeUri));
                storage.setItem(PROFILE_PICTURE_TIMESTAMP_KEY, Date.now().toString());
              }
            } else {
              console.log('Invalid URL format, using default image:', formattedUrl);
            }
          } catch (error) {
            console.error('Error processing profile picture URL:', error);
          }
        } else {
          console.log('No profile picture found, using default');
        }
      } catch (e) {
        console.log('Error in useProfilePicture:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfilePicture();
  }, [forceRefresh]); // Re-run when forceRefresh changes

  return { 
    profilePicture, 
    isLoading,
    hasCustomImage
  };
}
