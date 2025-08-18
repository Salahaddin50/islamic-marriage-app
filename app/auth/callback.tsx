// ============================================================================
// OAUTH CALLBACK HANDLER - HUME ISLAMIC DATING APP
// ============================================================================
// Handles OAuth redirects from Google/social providers
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';
import { supabase } from '../../src/config/supabase';
import RegistrationService from '../../src/services/registration.service';
import { COLORS } from '../../constants';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';

const AuthCallback: React.FC = () => {
  const navigation = useNavigation();
  const [status, setStatus] = useState('Processing authentication...');

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

      setStatus('Authentication successful! Setting up your profile...');

      // Check if user profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      // If error is because table doesn't exist, treat as new user
      if (profileError && (profileError.code === 'PGRST116' || profileError.message.includes('406'))) {
        console.log('Database tables not set up yet, treating as new user');
      }

      if (existingProfile) {
        // Existing user - redirect to main app
        setStatus('Welcome back! Redirecting...');
        setTimeout(() => {
          navigation.navigate('(tabs)' as never);
        }, 1500);
      } else {
        // New user - redirect to profile setup
        setStatus('Welcome! Let\'s set up your Islamic marriage profile...');
        setTimeout(() => {
          navigation.navigate('profile-setup' as never);
        }, 2000);
      }

    } catch (error: any) {
      console.error('Auth callback error:', error);
      setStatus(`Authentication failed: ${error.message}`);
      
      // Redirect to login after error
      setTimeout(() => {
        navigation.navigate('login' as never);
      }, 3000);
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
      <Text style={styles.title}>Completing Sign In</Text>
      <Text style={styles.status}>{status}</Text>
      
      <View style={styles.islamicNote}>
        <Text style={styles.islamicText}>
          🕌 Welcome to the Islamic community for meaningful connections
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(24),
  },
  spinner: {
    marginBottom: getResponsiveSpacing(24),
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(16),
  },
  status: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(22),
    marginBottom: getResponsiveSpacing(32),
  },
  islamicNote: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: getResponsiveSpacing(16),
    marginTop: getResponsiveSpacing(32),
  },
  islamicText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'medium',
    color: COLORS.primary,
    textAlign: 'center',
  },
});

export default AuthCallback;
