// ============================================================================
// SIMPLE SIGNUP SCREEN - HUME ISLAMIC DATING APP  
// ============================================================================
// Simplified email/password signup with multi-step registration flow
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { COLORS, SIZES, icons, images } from '../../constants';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SocialButton from '../../components/SocialButton';
import OrSeparator from '../../components/OrSeparator';
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '../../utils/responsive';
import RegistrationService from '../services/registration.service';
import { supabase } from '../config/supabase';

// ================================
// VALIDATION SCHEMA
// ================================

const signupSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

// ================================
// INTERFACES
// ================================

interface Props {
  onGoogleSignup?: () => void;
  onSignupSuccess?: (email: string) => void;
}

// ================================
// SIMPLE SIGNUP COMPONENT
// ================================

const SimpleSignup: React.FC<Props> = ({ onGoogleSignup, onSignupSuccess }) => {
  const navigation = useNavigation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Handle post-signup navigation (similar to auth callback)
  const handlePostSignupNavigation = async () => {
    try {
      console.log('Starting post-signup navigation...');
      
      // Get the current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        sessionError: sessionError?.message 
      });
      
      if (sessionError || !session) {
        console.error('Session error after signup:', sessionError);
        router.push('/login');
        return;
      }

      // Check if user profile exists and is completed
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      console.log('Profile check:', { hasProfile: !!existingProfile, profileError: profileError?.message, profileErrorCode: profileError?.code });

      // If profile doesn't exist (PGRST116 = no rows returned), navigate to setup
      if (!existingProfile) {
        console.log('Profile missing or incomplete, navigating to profile setup...');
        // Force navigation to profile setup
        router.push('/profile-setup');
        return;
      }
      
      // If profile exists, go to main app
      console.log('Profile completed, navigating to main app...');
      router.push('/(tabs)');

    } catch (error: any) {
      console.error('Post-signup navigation error:', error);
      // Fallback to profile setup on error
      console.log('Fallback: navigating to profile setup...');
      router.push('/profile-setup');
    }
  };

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    }
  });

  // Handle form submission with smart signup/login logic
  const handleSignup = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      // First, try to create a new account
      const { user, session } = await RegistrationService.createAccount(data.email, data.password);
      
      console.log('Signup result:', { user: !!user, session: !!session });
      
      if (user) {
        // Check if email confirmation is required
        if (!session) {
          // No active session (email confirmation required) -> send to login
          router.push('/login');
          return;
        }

        // New user created successfully -> go directly to profile-setup
        onSignupSuccess?.(data.email);
        await handlePostSignupNavigation();
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // If user already exists, try to log them in instead
      console.log('Checking error message:', error.message);
      const errorMsg = error.message.toLowerCase();
      const isUserExists = errorMsg.includes('already registered') || 
                          errorMsg.includes('user already') ||
                          errorMsg.includes('already been registered') ||
                          errorMsg.includes('email already') ||
                          (errorMsg.includes('user') && errorMsg.includes('registered'));
      
      if (isUserExists) {
        console.log('User already exists, attempting login...');
        await handleExistingUserLogin(data.email, data.password);
        return;
      }
      
      // Handle other error cases
      let errorMessage = 'Something went wrong during signup. Please try again.';
      
      if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many signup attempts. Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login for existing users who tried to signup
  const handleExistingUserLogin = async (email: string, password: string) => {
    try {
      console.log('Attempting to login existing user...');
      
      // Try to log in the existing user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login attempt result:', { 
        user: !!data?.user, 
        session: !!data?.session, 
        error: error?.message 
      });

      if (error) {
        console.log('Login failed:', error.message);
        // Login failed - likely wrong password
        Alert.alert('Login Required','This email is already registered. Please enter the correct password or reset your password.',[
          { text: 'Try Again' },
          { text: 'Reset Password', onPress: () => router.push('/forgotpasswordemail') }
        ]);
        return;
      }

      if (data.user && data.session) {
        console.log('Login successful! Checking profile and navigating...');
        onSignupSuccess?.(email);
        await handlePostSignupNavigation();
      } else {
        console.log('Login response missing user or session');
        throw new Error('Login response incomplete');
      }

    } catch (loginError: any) {
      console.error('Auto-login error:', loginError);
      Alert.alert('Login Required','This email is already registered. Please go to the login page and sign in with your password.',[
        { text: 'OK' },
        { text: 'Go to Login', onPress: () => router.push('/login') }
      ]);
    }
  };

  // Handle Google authentication
  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      console.log("Starting Google Sign-up for Islamic Dating");
      
      // Start Google OAuth with Supabase (auto-signup on first time)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // The redirect will handle the rest of the flow
      console.log('Google OAuth initiated successfully');
      onGoogleSignup?.();
      
    } catch (error: any) {
      console.error('Google auth error:', error);
      Alert.alert(
        'Google Sign-up Failed', 
        error.message || 'Unable to connect to Google. Please try again or use email/password signup.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <Header showBackButton={true} />
        
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image source={images.logo2} resizeMode='contain' style={styles.logo} />
          </View>
          
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>
            Join the Islamic community for meaningful connections
          </Text>

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  id="email"
                  placeholder="Email Address *"
                  onInputChanged={(id, text) => onChange(text)}
                  errorText={errors.email?.message}
                  icon={icons.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  id="password"
                  placeholder="Password *"
                  onInputChanged={(id, text) => onChange(text)}
                  errorText={errors.password?.message}
                  icon={icons.padlock}
                  secureTextEntry
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  id="confirmPassword"
                  placeholder="Confirm Password *"
                  onInputChanged={(id, text) => onChange(text)}
                  errorText={errors.confirmPassword?.message}
                  icon={icons.padlock}
                  secureTextEntry
                />
              )}
            />

            <View style={styles.checkboxContainer}>
              <Controller
                control={control}
                name="acceptTerms"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => onChange(!value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: value }}
                  >
                    <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                      {value && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxText}>
                      I agree to the Terms of Service and Privacy Policy *
                    </Text>
                  </TouchableOpacity>
                )}
              />
              {errors.acceptTerms && (
                <Text style={styles.errorText}>{errors.acceptTerms.message}</Text>
              )}
            </View>

            <Button
              title={isLoading ? "Creating Account..." : "Create Account"}
              onPress={handleSubmit(handleSignup)}
              style={styles.signupButton}
              disabled={isLoading}
            />

            <View style={styles.socialContainer}>
              <OrSeparator />
              <TouchableOpacity 
                style={styles.googleButton} 
                onPress={handleGoogleAuth}
                disabled={isLoading}
              >
                <Image
                  source={icons.google}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>

            {/* Removed inline login link; using fixed bottom container instead */}
          </View>
        </ScrollView>
      {/* Bottom fixed Sign In link (matching Login screen) */}
      <View style={styles.bottomContainer}>
        <Text style={styles.bottomText}>
          Already have an account?{' '}
          <TouchableOpacity onPress={() => navigation.navigate('login')}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </Text>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ================================
// STYLES
// ================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: getResponsiveSpacing(60),
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: getResponsiveSpacing(10),
    marginBottom: getResponsiveSpacing(16),
  },
  logo: {
    width: getResponsiveSpacing(120),
    height: getResponsiveSpacing(120),
  },
  title: {
    fontSize: getResponsiveFontSize(28),
    fontFamily: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(4),
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(16),
    paddingHorizontal: getResponsiveSpacing(32),
    lineHeight: getResponsiveFontSize(22),
  },
  formContainer: {
    paddingHorizontal: getResponsiveSpacing(24),
  },
  checkboxContainer: {
    marginBottom: getResponsiveSpacing(12),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSpacing(4),
  },
  checkbox: {
    width: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    borderWidth: 2,
    borderColor: COLORS.gray,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSpacing(12),
    marginTop: getResponsiveSpacing(2),
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.black,
    lineHeight: getResponsiveFontSize(20),
  },
  errorText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'regular',
    color: COLORS.red,
    marginTop: getResponsiveSpacing(4),
    marginLeft: getResponsiveSpacing(32),
  },
  signupButton: {
    marginBottom: getResponsiveSpacing(12),
  },
  socialContainer: {
    marginBottom: getResponsiveSpacing(12),
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 12,
    paddingVertical: getResponsiveSpacing(16),
    paddingHorizontal: getResponsiveSpacing(20),
    marginTop: getResponsiveSpacing(4),
  },
  googleIcon: {
    width: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    marginRight: getResponsiveSpacing(12),
  },
  googleButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.black,
  },
  bottomContainer: {
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(20),
    borderTopWidth: 1,
    borderTopColor: COLORS.gray7,
    backgroundColor: COLORS.white,
  },
  bottomText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.black,
    textAlign: 'center',
  },
  signInText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'semiBold',
    color: COLORS.primary,
  },
  loginLinkText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
  },
  loginLinkButton: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'semiBold',
    color: COLORS.primary,
  },
});

export default SimpleSignup;
