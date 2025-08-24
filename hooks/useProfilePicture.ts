import { useState, useEffect } from 'react';
import { supabase } from '@/src/config/supabase';
import { images } from '@/constants';

export function useProfilePicture() {
  const [profilePicture, setProfilePicture] = useState<any>(images.user1);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // First check if the user_profiles table exists
        const { error: tableCheckError } = await supabase
          .from('user_profiles')
          .select('count(*)', { count: 'exact', head: true });

        // If the table doesn't exist or there's an error, just return the default avatar
        if (tableCheckError) {
          console.log('Error checking user_profiles table:', tableCheckError);
          return;
        }

        // Try to get the profile picture URL
        try {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('profile_picture_url')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profileError) {
            console.log('Error fetching profile:', profileError);
            return;
          }

          if (profile?.profile_picture_url) {
            setProfilePicture({ uri: profile.profile_picture_url });
          }
        } catch (profileError) {
          console.log('Error in profile fetch:', profileError);
        }
      } catch (e) {
        console.log('Error in useProfilePicture:', e);
      }
    })();
  }, []);

  return profilePicture;
}
