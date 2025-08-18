// ============================================================================
// SIMPLE SIGNUP SCREEN - HUME ISLAMIC DATING APP  
// ============================================================================
// Simplified email/password signup with multi-step registration flow
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
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
  const [isLoading, setIsLoading] = useState(false);

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

  // Handle form submission
  const handleSignup = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      // Create account with Supabase Auth
      const { user } = await RegistrationService.createAccount(data.email, data.password);
      
      if (user) {
        Alert.alert(
          'Account Created!', 
          'Your account has been created successfully. Please complete your profile.',
          [
            {
              text: 'Continue',
              onPress: () => {
                onSignupSuccess?.(data.email);
                // Navigate to profile completion
                navigation.navigate('profile-setup');
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert(
        'Signup Failed',
        error.message || 'Something went wrong during signup. Please try again.'
      );
    } finally {
      setIsLoading(false);
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

            <View style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('login')}>
                <Text style={styles.loginLinkButton}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    paddingBottom: getResponsiveSpacing(32),
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: getResponsiveSpacing(20),
    marginBottom: getResponsiveSpacing(32),
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
    marginBottom: getResponsiveSpacing(8),
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(32),
    paddingHorizontal: getResponsiveSpacing(32),
    lineHeight: getResponsiveFontSize(22),
  },
  formContainer: {
    paddingHorizontal: getResponsiveSpacing(24),
  },
  checkboxContainer: {
    marginBottom: getResponsiveSpacing(24),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSpacing(8),
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
    marginBottom: getResponsiveSpacing(24),
  },
  socialContainer: {
    marginBottom: getResponsiveSpacing(24),
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
    marginTop: getResponsiveSpacing(16),
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
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveSpacing(16),
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
