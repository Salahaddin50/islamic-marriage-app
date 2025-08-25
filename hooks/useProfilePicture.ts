import { useState, useEffect } from 'react';
import { supabase } from '@/src/config/supabase';
import { images } from '@/constants';
import { Platform } from 'react-native';

export function useProfilePicture(forceRefresh?: number) {
  // Default avatar data URI for guaranteed display
  const defaultAvatarDataURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAFgUlEQVR4nO2dW4hVVRjHf2fGcZwZL5QxlVYUEWEPYmZmZEQU1EMJPfRglBYVlBZFUfRQD0FRQpBRDz1UL1FBSRFRUQhFZRdCzG6WlmZpWpmXGS+j08Pax5nOzNn77L3X2mvvPesHHzjMWd/6r/Wftc/a67vWAYPBYDAYDAaDwWAwGAwGg8FgMBgMBoOhFWqDNqAG5gKLgYuAOcB0YBIwARgPtAFHgR5gP7AL+BXYDnwP7K+7xTXQBtwFvA/0AqrKowf4EFgJtNfR+Ly4EngLOE71QrRy9AEbgKvqFUQWTAJeAQYIL0RrxwCwDphcl2gipA14jHCVU7VjA3BG+JCi4wHgEPUVo/k4BDwYPKrIuAXoJ1tBKKAfeChwbNFwLrCTbAVpPnYC8wPGFwVtwOfUV4zK8QUwLliEEfAi9RejcrwULMLAnE/2vag0xwBwYaggQ3Il2Y+g0h5dwOUhAg3JRtILsgm4G7gBuBZYDrwO/JXyuY2BYg3GVNILshpoa7HtNOA14ETK51+vOdagPEE6MXqAC1Jsfy7wR4ptlmuMNSjnkO5o6jdgSoZ9zCFdZXZrizeYIJ+RXJBBYFnG/TxJusp5UlPMQZlJukq5PcO+pgF/ptjPIeCsDPuKgjdJLsjWjPtaTLrK2ZJxX1GwmOSCDAEXZ9jXBNJ1EJRjYYZ9RUEb8AfJBdmQYX/3ka5y7s2wr2h4hOSCDAIzU+5rPOkqpwe9vbXMmQR0klyUZ1Lub2XK/SnHIzoDzpqHSS7IUdL1tiaRvnJ6gYn6ws2e8SSvrhRwf4r9PU+6yrlPZ7B5sYLkghwAJibsawZwOOX+ZugLNx/agf0kF+aVhH09T7rKeU5jrLnyGMkF6QcmxexnJnAk5X4OA2fqDDZP2oE/SS7OmzH7WUW6ynlDZ6B58wjJBRkApsZsfw7pK+cQcLbGOHOnA9hHcoHeitn+VdJVzmoNMUbDwyQXRNH4JbXYdh7pK6cLmKUxzmhoB/aQXKQPWmx7A+kq5y1dQcbGMtIJMgRc1mK7+aSvnIPAeRrjjIp2YDfJhfqsxXZrSFc5b+sKMkaWkk6QQeDSpm3OJ33ldKKvc5kL7cAu0lXKuqZtXiNd5azTE2KcLCGdIEPAJcAC0ldOJ3C+phjjRIqyg3SVsrFpmy9JVznv6AkxXpaQTpAh4GJgIekrpxOYrSnGaJGi7CBdpWxu2uZr0lXOek0xxs0S0gkyBFxE+srpAs7RFGP0SFF+I12lfNe0zXekq5wNmmKMniWkE2QImE/6yukCztUUYxZIUX4lXaU0P/X4PekqZ6OmGDPhVmAVsAWZxdmIFGgV8k6jFYtJJ8gQMI/0ldMNTNcUYyZMRN7RqQzHPuCOmG3fJV3lbNIUY3DuoLVTqhyDwNyYbTeSvnI2a4oxKO3AVzQKspPWb+UWka5yuoEZmmIMxu20dkgBvwCTY7bdRLrK+VhTjMGQovQgg0ytwt9K6zeAi0hXOT3ATE0xBmEZrZ1RwG/AlJhtPyFd5XyiKcYgSFEOIINMrcLfhgxUtWIx6SqnB7hAU4zaWU5rRxTwOzLvKo5PSVc5n2qKUTtSlEPIIFOr8LfT+g3gEtJVTi9woaYYtbKC1k4oYA8yXhXHZ6SrnM80xagVKcphZJCpVfg7aP0GcCnpKqcXuEhTjNpYSWsHFLAXmBqz7eekq5zPNcWoDSnKEWSQqVX4O2n9BnAZ6SqnD5ijKUYtrKK18QrYB0yL2fYL0lXOF5pi1IIU5SgyyNQq/F3Ek7Zy+oC5mmLUwmpaG66A/cD0mG23kK5yvtQUo3LOovUDLQXsJ/5ZxjbSVU4/cLGmGLVwJvJMI6nxB4AZMZ/9inSV85WmGLVxBvJMI6nxB4kXZDvpKucbTTEaDAbD/5p/AYCPeuoZrIybAAAAAElFTkSuQmCC';

  // Start with the default image from constants
  const [profilePicture, setProfilePicture] = useState<any>(
    Platform.OS === 'web' 
      ? { uri: defaultAvatarDataURI } 
      : images.user1
  );
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
      // For web, we directly use the data URI for guaranteed display
      console.log('Using data URI for default profile picture');
      setProfilePicture({ uri: defaultAvatarDataURI });
    }
  }, []);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      setIsLoading(true);
      try {
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
                }).catch(err => {
                  console.log('Failed to load web image fix for profile:', err);
                  // Fallback to direct URI
                  setProfilePicture({ uri: formattedUrl });
                  setHasCustomImage(true);
                });
              } else {
                // For native platforms, use the URI directly
                setProfilePicture({ uri: formattedUrl });
                setHasCustomImage(true);
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
