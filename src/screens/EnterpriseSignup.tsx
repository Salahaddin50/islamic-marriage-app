// ============================================================================
// ENTERPRISE SIGNUP SCREEN - HUME ISLAMIC DATING APP
// ============================================================================
// Multi-step registration with Islamic marriage preferences, Google OAuth, and enterprise authentication
// ============================================================================

import React, { useState, useCallback } from 'react';
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
import IslamicPreferencesForm from '../components/IslamicPreferencesForm';
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '../../utils/responsive';
import RegistrationService, { RegistrationData, PreferencesData, QuestionnaireData } from '../services/registration.service';
import type { GenderType } from '../types/database.types';

// ================================
// VALIDATION SCHEMAS
// ================================

const basicInfoSchema = z.object({
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

type BasicInfoForm = z.infer<typeof basicInfoSchema>;

// ================================
// INTERFACES
// ================================

interface SignupStepProps {
  onNext: () => void;
  onBack?: () => void;
}

enum SignupStep {
  BASIC_INFO = 1,
  ISLAMIC_PREFERENCES = 2,
  VERIFICATION = 3,
}

// ================================
// MAIN COMPONENT
// ================================

const EnterpriseSignup: React.FC = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState<SignupStep>(SignupStep.BASIC_INFO);
  const [basicInfo, setBasicInfo] = useState<BasicInfoForm | null>(null);
  const [islamicPreferences, setIslamicPreferences] = useState<PreferencesData>({
    minAge: 18,
    maxAge: 35,
    acceptInternational: true,
    preferHafiz: false,
    preferIslamicEducation: false,
    preferHajjPerformed: false,
    acceptDivorced: true,
    acceptWidowed: true,
    acceptWithChildren: true,
    acceptPolygamousMarriage: 'maybe',
    preferredMaritalStatus: ['never_married']
  });
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({});
  const [isLoading, setIsLoading] = useState(false);

  // Form handling
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      gender: 'male',
      country: '',
      city: '',
      sect: 'sunni',
      maritalStatus: 'never_married',
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  const watchedGender = watch('gender');

  // ================================
  // GOOGLE OAUTH HANDLER
  // ================================

  const handleGoogleSignup = useCallback(async () => {
    try {
      Alert.alert('Google Signup', 'Google OAuth integration will be implemented here.');
      // TODO: Implement Google OAuth flow
      // const result = await GoogleSignIn.signIn();
      // const credential = GoogleAuthProvider.credential(result.idToken);
      // await authService.loginWithOAuth({
      //   provider: 'google',
      //   token: result.idToken,
      // });
    } catch (error: any) {
      Alert.alert('Google Signup Failed', error.message);
    }
  }, []);

  // ================================
  // STEP HANDLERS
  // ================================

  const handleBasicInfoSubmit = (data: BasicInfoForm) => {
    setBasicInfo(data);
    setCurrentStep(SignupStep.ISLAMIC_PREFERENCES);
  };

  const handleIslamicPreferencesSubmit = () => {
    setCurrentStep(SignupStep.VERIFICATION);
    performRegistration();
  };

  const performRegistration = async () => {
    if (!basicInfo) return;

    setIsLoading(true);

    try {
      // Prepare registration data
      const registrationData: RegistrationData = {
        email: basicInfo.email,
        password: basicInfo.password,
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
        gender: basicInfo.gender as GenderType,
        dateOfBirth: basicInfo.dateOfBirth,
        country: basicInfo.country,
        city: basicInfo.city,
        sect: basicInfo.sect as any,
        maritalStatus: basicInfo.maritalStatus as any,
        hajjPerformed: false,
        umrahPerformed: false,
        hasChildren: false,
        childrenLivingWithUser: false,
        willingToRelocate: false,
        prayerFrequency: 'five_times_daily',
        currentWivesCount: 0
      };

      // Validate registration data
      const validation = RegistrationService.validateRegistrationData(registrationData);
      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        setCurrentStep(SignupStep.BASIC_INFO);
        return;
      }

      // Register user with complete Islamic marriage profile
      const result = await RegistrationService.registerIslamicMarriageUser(
        registrationData,
        islamicPreferences,
        questionnaire
      );

      if (result.success) {
        Alert.alert(
          'Registration Successful!',
          'Your Islamic marriage profile has been created. Please check your email for verification.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('(tabs)' as never)
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.error || 'Please try again.');
        setCurrentStep(SignupStep.BASIC_INFO);
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'An unexpected error occurred.');
      setCurrentStep(SignupStep.BASIC_INFO);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > SignupStep.BASIC_INFO) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  // ================================
  // STEP COMPONENTS
  // ================================

  const BasicInfoStep: React.FC<SignupStepProps> = ({ onNext }) => (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      style={styles.stepContainer}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <Image source={images.logo2} resizeMode='contain' style={styles.logo} />
      </View>
      
      <Text style={styles.title}>Create Your Account</Text>
      <Text style={styles.subtitle}>Join the Islamic community for meaningful connections</Text>

      <View style={styles.formContainer}>

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            id="firstName"
            placeholder="First Name *"
            onInputChanged={(id, text) => onChange(text)}
            errorText={errors.firstName?.message}
            icon={icons.user}
          />
        )}
      />

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            id="lastName"
            placeholder="Last Name"
            onInputChanged={(id, text) => onChange(text)}
            errorText={errors.lastName?.message}
            icon={icons.user}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
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
        name="dateOfBirth"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            id="dateOfBirth"
            placeholder="Date of Birth (YYYY-MM-DD) *"
            onInputChanged={(id, text) => onChange(text)}
            errorText={errors.dateOfBirth?.message}
            icon={icons.calendar}
          />
        )}
      />

      <Controller
        control={control}
        name="country"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            id="country"
            placeholder="Country *"
            onInputChanged={(id, text) => onChange(text)}
            errorText={errors.country?.message}
            icon={icons.location}
          />
        )}
      />

      <Controller
        control={control}
        name="city"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            id="city"
            placeholder="City *"
            onInputChanged={(id, text) => onChange(text)}
            errorText={errors.city?.message}
            icon={icons.location}
          />
        )}
      />

      <View style={styles.genderSelector}>
        <Text style={styles.genderTitle}>Gender *</Text>
        <View style={styles.genderButtons}>
          <TouchableOpacity
            style={[styles.genderButton, watchedGender === 'male' && styles.genderButtonSelected]}
            onPress={() => setValue('gender', 'male')}
          >
            <Text style={[styles.genderButtonText, watchedGender === 'male' && styles.genderButtonTextSelected]}>
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, watchedGender === 'female' && styles.genderButtonSelected]}
            onPress={() => setValue('gender', 'female')}
          >
            <Text style={[styles.genderButtonText, watchedGender === 'female' && styles.genderButtonTextSelected]}>
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.genderSelector}>
        <Text style={styles.genderTitle}>Islamic Sect *</Text>
        <View style={styles.genderButtons}>
          <TouchableOpacity
            style={[styles.genderButton, watch('sect') === 'sunni' && styles.genderButtonSelected]}
            onPress={() => setValue('sect', 'sunni')}
          >
            <Text style={[styles.genderButtonText, watch('sect') === 'sunni' && styles.genderButtonTextSelected]}>
              Sunni
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, watch('sect') === 'shia' && styles.genderButtonSelected]}
            onPress={() => setValue('sect', 'shia')}
          >
            <Text style={[styles.genderButtonText, watch('sect') === 'shia' && styles.genderButtonTextSelected]}>
              Shia
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, watch('sect') === 'other' && styles.genderButtonSelected]}
            onPress={() => setValue('sect', 'other')}
          >
            <Text style={[styles.genderButtonText, watch('sect') === 'other' && styles.genderButtonTextSelected]}>
              Other
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.genderSelector}>
        <Text style={styles.genderTitle}>Marital Status *</Text>
        <View style={styles.genderButtons}>
          <TouchableOpacity
            style={[styles.genderButton, watch('maritalStatus') === 'never_married' && styles.genderButtonSelected]}
            onPress={() => setValue('maritalStatus', 'never_married')}
          >
            <Text style={[styles.genderButtonText, watch('maritalStatus') === 'never_married' && styles.genderButtonTextSelected]}>
              Never Married
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, watch('maritalStatus') === 'divorced' && styles.genderButtonSelected]}
            onPress={() => setValue('maritalStatus', 'divorced')}
          >
            <Text style={[styles.genderButtonText, watch('maritalStatus') === 'divorced' && styles.genderButtonTextSelected]}>
              Divorced
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, watch('maritalStatus') === 'widowed' && styles.genderButtonSelected]}
            onPress={() => setValue('maritalStatus', 'widowed')}
          >
            <Text style={[styles.genderButtonText, watch('maritalStatus') === 'widowed' && styles.genderButtonTextSelected]}>
              Widowed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
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
        render={({ field: { onChange, onBlur, value } }) => (
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
          render={({ field: { onChange, value } }) => (
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => onChange(!value)}
            >
              <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                {value && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I accept the <Text style={styles.linkText}>Terms and Conditions</Text> *
              </Text>
            </TouchableOpacity>
          )}
        />
        {errors.acceptTerms && <Text style={styles.errorText}>{errors.acceptTerms.message}</Text>}

        <Controller
          control={control}
          name="acceptPrivacy"
          render={({ field: { onChange, value } }) => (
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => onChange(!value)}
            >
              <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                {value && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I accept the <Text style={styles.linkText}>Privacy Policy</Text> *
              </Text>
            </TouchableOpacity>
          )}
        />
        {errors.acceptPrivacy && <Text style={styles.errorText}>{errors.acceptPrivacy.message}</Text>}
      </View>

      <Button
        title="Continue"
        filled
        onPress={handleSubmit(onNext)}
        style={styles.button}
      />

      <OrSeparator text="or continue with" />
      
      <View style={styles.socialContainer}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignup}
        >
          <Image 
            source={icons.google} 
            style={styles.googleIcon}
            resizeMode="contain"
          />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
      </View>
    </ScrollView>
  );

  const IslamicPreferencesStep: React.FC<SignupStepProps> = ({ onNext }) => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Islamic Preferences</Text>
      <Text style={styles.stepSubtitle}>
        Help us find your perfect match based on Islamic values and marriage intentions
      </Text>
      
      <IslamicPreferencesForm
        userGender={basicInfo?.gender as GenderType}
        initialData={islamicPreferences}
        onSubmit={(data) => {
          setIslamicPreferences(data);
          onNext();
        }}
        onCancel={() => setCurrentStep(SignupStep.BASIC_INFO)}
      />
    </View>
  );

  const VerificationStep: React.FC = () => (
    <View style={styles.verificationContainer}>
      <Image source={images.logo2} resizeMode='contain' style={styles.logo} />
      <Text style={styles.verificationTitle}>Account Created Successfully!</Text>
      <Text style={styles.verificationText}>
        Please check your email for a verification link to activate your account.
      </Text>
              <Button
          title="Continue to App"
          filled
          onPress={() => navigation.navigate('(tabs)' as never)}
          style={styles.button}
          disabled={isLoading}
        />
    </View>
  );

  // ================================
  // STEP PROGRESS INDICATOR
  // ================================

  const StepProgress: React.FC = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.progressStep}>
          <View style={[
            styles.progressCircle,
            currentStep >= step && styles.progressCircleActive
          ]}>
            <Text style={[
              styles.progressNumber,
              currentStep >= step && styles.progressNumberActive
            ]}>
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View style={[
              styles.progressLine,
              currentStep > step && styles.progressLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  // ================================
  // RENDER
  // ================================

  const renderCurrentStep = () => {
    switch (currentStep) {
      case SignupStep.BASIC_INFO:
        return <BasicInfoStep onNext={handleBasicInfoSubmit} />;
      case SignupStep.ISLAMIC_PREFERENCES:
        return <IslamicPreferencesStep onNext={handleIslamicPreferencesSubmit} onBack={handleBack} />;
      case SignupStep.VERIFICATION:
        return <VerificationStep />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.area}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Header 
          title="" 
          onPress={handleBack}
        />
        
        <StepProgress />
        
        {renderCurrentStep()}
        
        <View style={styles.bottomContainer}>
          <Text style={styles.bottomText}>
            Already have an account?{' '}
            <TouchableOpacity onPress={() => navigation.navigate('login' as never)}>
              <Text style={styles.loginText}>Log In</Text>
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
  area: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  stepContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(100),
  },
  formContainer: {
    width: '100%',
    maxWidth: isMobileWeb() ? '100%' : 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: getResponsiveSpacing(20),
  },
  logo: {
    width: 80,
    height: 80,
    tintColor: COLORS.primary,
  },
  title: {
    fontSize: getResponsiveFontSize(26),
    fontFamily: 'semiBold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(8),
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(24),
    paddingHorizontal: getResponsiveSpacing(20),
  },
  stepTitle: {
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'semiBold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(8),
  },
  stepSubtitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(16),
  },
  genderSelector: {
    marginVertical: getResponsiveSpacing(16),
  },
  genderTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(12),
  },
  genderButtons: {
    flexDirection: 'row',
    gap: getResponsiveSpacing(12),
  },
  genderButton: {
    flex: 1,
    backgroundColor: COLORS.gray6,
    paddingVertical: getResponsiveSpacing(12),
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.gray6,
  },
  genderButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.black,
    textAlign: 'center',
  },
  genderButtonTextSelected: {
    color: COLORS.white,
  },
  checkboxContainer: {
    marginVertical: getResponsiveSpacing(16),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(12),
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray,
    marginRight: getResponsiveSpacing(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'bold',
  },
  checkboxText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.black,
    flex: 1,
  },
  linkText: {
    color: COLORS.primary,
    fontFamily: 'medium',
  },
  errorText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'regular',
    color: COLORS.red,
    marginTop: 4,
  },
  button: {
    marginVertical: getResponsiveSpacing(20),
    borderRadius: 30,
  },
  socialContainer: {
    alignItems: 'center',
    marginVertical: getResponsiveSpacing(20),
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray6,
    borderRadius: 30,
    paddingVertical: getResponsiveSpacing(14),
    paddingHorizontal: getResponsiveSpacing(20),
    height: isMobileWeb() ? 48 : 52,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  googleIcon: {
    width: isMobileWeb() ? 20 : 24,
    height: isMobileWeb() ? 20 : 24,
    marginRight: getResponsiveSpacing(12),
  },
  googleButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.black,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(40),
    paddingVertical: getResponsiveSpacing(20),
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleActive: {
    backgroundColor: COLORS.primary,
  },
  progressNumber: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'semiBold',
    color: COLORS.gray,
  },
  progressNumberActive: {
    color: COLORS.white,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.gray6,
    marginHorizontal: getResponsiveSpacing(8),
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(40),
  },
  verificationTitle: {
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'semiBold',
    color: COLORS.black,
    textAlign: 'center',
    marginTop: getResponsiveSpacing(20),
    marginBottom: getResponsiveSpacing(12),
  },
  verificationText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(30),
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
  },
  loginText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'medium',
    color: COLORS.primary,
  },
});

export default EnterpriseSignup;
