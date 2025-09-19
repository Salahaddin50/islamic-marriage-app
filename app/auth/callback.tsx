// ============================================================================
// OAUTH CALLBACK HANDLER - HUME ISLAMIC DATING APP
// ============================================================================
// Handles OAuth redirects from Google/social providers
// ============================================================================

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/config/supabase';
import { COLORS } from '../../constants';

const AuthCallback: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session) {
        throw new Error('No authentication session found');
      }

      // Check if user profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      // If error is because table doesn't exist, treat as new user
      if (profileError && (profileError.code === 'PGRST116' || profileError.message.includes('406'))) {
        console.log('Database tables not set up yet, treating as new user');
      }

      // Always go to main app - profile completeness handled by modal only
      try {
        if (Platform.OS === 'web') {
          localStorage.setItem('hume_reset_filters_on_login', '1');
        } else {
          await SecureStore.setItemAsync('hume_reset_filters_on_login', '1');
        }
      } catch {}
      router.replace('/(tabs)/home');

    } catch (error: any) {
      console.error('Auth callback error:', error);
      
      // Redirect to login immediately on error
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      {/* Empty view - redirects immediately without showing loading */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});

export default AuthCallback;
