// ============================================================================
// TEST AUTH PAGE - HUME ISLAMIC DATING APP
// ============================================================================
// Simple page to test authentication without database dependencies
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { supabase } from '../src/config/supabase';
import { COLORS } from '../constants';
import { getResponsiveFontSize, getResponsiveSpacing } from '../utils/responsive';

const TestAuth: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.protocol}//${window.location.host}/test-auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert('Success', 'Google OAuth initiated successfully!');
    } catch (error: any) {
      console.error('Google auth error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      Alert.alert('Success', 'Logged out successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🧪 Auth Test Page</Text>
      
      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.subtitle}>✅ Logged In</Text>
          <Text style={styles.userText}>Email: {user.email}</Text>
          <Text style={styles.userText}>ID: {user.id}</Text>
          <Text style={styles.userText}>Provider: {user.app_metadata?.provider}</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.authSection}>
          <Text style={styles.subtitle}>Not logged in</Text>
          
          <TouchableOpacity 
            style={[styles.googleButton, isLoading && styles.disabledButton]} 
            onPress={handleGoogleAuth}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Connecting...' : 'Test Google OAuth'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.navigation}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('login' as never)}
        >
          <Text style={styles.navText}>← Back to Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          ℹ️ This page tests Google OAuth without database dependencies.
          Use this to verify OAuth setup before configuring the database.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: getResponsiveSpacing(24),
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(32),
  },
  subtitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'semiBold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(16),
  },
  userInfo: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: getResponsiveSpacing(20),
    marginBottom: getResponsiveSpacing(32),
  },
  userText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(8),
  },
  authSection: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(32),
  },
  googleButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: getResponsiveSpacing(16),
    paddingHorizontal: getResponsiveSpacing(32),
    marginTop: getResponsiveSpacing(16),
  },
  logoutButton: {
    backgroundColor: COLORS.red,
    borderRadius: 12,
    paddingVertical: getResponsiveSpacing(12),
    paddingHorizontal: getResponsiveSpacing(24),
    marginTop: getResponsiveSpacing(16),
    alignSelf: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semiBold',
    color: COLORS.white,
    textAlign: 'center',
  },
  navigation: {
    marginBottom: getResponsiveSpacing(32),
  },
  navButton: {
    alignSelf: 'flex-start',
  },
  navText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.primary,
  },
  note: {
    backgroundColor: COLORS.gray2,
    borderRadius: 12,
    padding: getResponsiveSpacing(16),
  },
  noteText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(20),
  },
});

export default TestAuth;
