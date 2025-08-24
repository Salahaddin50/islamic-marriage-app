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

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('profile_picture_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.profile_picture_url) {
          setProfilePicture({ uri: profile.profile_picture_url });
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  return profilePicture;
}
