// ============================================================================
// AUTHENTICATION GUARD INDEX - HUME ISLAMIC DATING APP
// ============================================================================
// Checks authentication state and routes users appropriately
// ============================================================================

import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import { router } from 'expo-router';
import { useAuthState } from '../src/contexts/AuthContext';

const Index = () => {
  const { isLoading, isAuthenticated, user, userProfile } = useAuthState();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to be determined

    if (isAuthenticated && user) {
      // User is signed in
      if (userProfile) {
        // Has complete profile - go to main app
        router.replace('/(tabs)');
      } else {
        // Needs to complete profile
        router.replace('/profile-setup');
      }
    } else {
      // User not signed in - go to welcome flow
      router.replace('/welcome');
    }
  }, [isLoading, isAuthenticated, user, userProfile]);

  // Show loading screen while determining auth state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.area}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // This component should redirect, so we shouldn't normally see this
  return (
    <SafeAreaView style={styles.area}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    </SafeAreaView>
  );
};

// Responsive Styles
const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Index;