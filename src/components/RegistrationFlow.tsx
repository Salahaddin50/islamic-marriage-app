import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from 'expo-router';

import { COLORS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import IslamicPreferencesForm from './IslamicPreferencesForm';

import { useRegister } from '../api/hooks';
import { 
  RegistrationData, 
  PreferencesData, 
  QuestionnaireData 
} from '../services/registration.service';
import {
  GenderType,
  MaritalStatusType,
  SectType,
  MadhabType,
  PrayerFrequencyType,
  PolygamyPreferenceType,
  WifeNumberType,
  SeekingWifeNumberType
} from '../types/database.types';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';

// Validation schemas for each step
const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  dateOfBirth: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 18 && age <= 80;
  }, 'Age must be between 18 and 80'),
  gender: z.enum(['male', 'female'] as const),
  phone: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const locationInfoSchema = z.object({
  country: z.string().min(2, 'Country is required'),
  stateProvince: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  postalCode: z.string().optional(),
  willingToRelocate: z.boolean().default(false)
});

const islamicInfoSchema = z.object({
  sect: z.enum(['sunni', 'shia', 'other'] as const),
  madhab: z.enum(['hanafi', 'maliki', 'shafii', 'hanbali', 'jafari', 'other'] as const).optional(),
  prayerFrequency: z.enum(['five_times_daily', 'regularly', 'sometimes', 'rarely', 'prefer_not_to_say'] as const),
  quranMemorizationLevel: z.string().optional(),
  islamicEducationLevel: z.string().optional(),
  hajjPerformed: z.boolean().default(false),
  umrahPerformed: z.boolean().default(false),
  hijabStyle: z.string().optional(),
  beardStyle: z.string().optional(),
});

const marriageInfoSchema = z.object({
  maritalStatus: z.enum(['never_married', 'divorced', 'widowed'] as const),
  hasChildren: z.boolean().default(false),
  numberOfChildren: z.number().min(0).optional(),
  childrenLivingWithUser: z.boolean().default(false),
  wantsChildren: z.boolean().optional(),
  acceptPolygamy: z.enum(['accept', 'maybe', 'no', 'not_applicable'] as const).optional(),
  willingWifeNumber: z.array(z.enum(['first', 'second', 'third', 'fourth'] as const)).optional(),
  seekingWifeNumber: z.enum(['first', 'second', 'third', 'fourth', 'any'] as const).optional(),
  currentWivesCount: z.number().min(0).max(4).default(0),
});

const physicalInfoSchema = z.object({
  heightCm: z.number().min(120).max(250).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  eyeColor: z.string().optional(),
  hairColor: z.string().optional(),
  skinTone: z.string().optional(),
  bodyType: z.string().optional(),
});

const professionalInfoSchema = z.object({
  educationLevel: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  occupation: z.string().optional(),
  occupationCategory: z.string().optional(),
  annualIncomeRange: z.string().optional(),
  employmentStatus: z.string().optional(),
});

const familyInfoSchema = z.object({
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  numberOfSiblings: z.number().min(0).optional(),
  familyReligiousLevel: z.string().optional(),
  familyFinancialStatus: z.string().optional(),
});

const personalDetailsSchema = z.object({
  bio: z.string().max(500).optional(),
  hobbies: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  lookingFor: z.string().max(300).optional(),
});

// Combined form types
type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
type LocationInfoForm = z.infer<typeof locationInfoSchema>;
type IslamicInfoForm = z.infer<typeof islamicInfoSchema>;
type MarriageInfoForm = z.infer<typeof marriageInfoSchema>;
type PhysicalInfoForm = z.infer<typeof physicalInfoSchema>;
type ProfessionalInfoForm = z.infer<typeof professionalInfoSchema>;
type FamilyInfoForm = z.infer<typeof familyInfoSchema>;
type PersonalDetailsForm = z.infer<typeof personalDetailsSchema>;

// Registration steps
enum RegistrationStep {
  PERSONAL_INFO = 1,
  LOCATION_INFO = 2,
  ISLAMIC_INFO = 3,
  MARRIAGE_INFO = 4,
  PHYSICAL_INFO = 5,
  PROFESSIONAL_INFO = 6,
  FAMILY_INFO = 7,
  PERSONAL_DETAILS = 8,
  PREFERENCES = 9,
  QUESTIONNAIRE = 10,
  VERIFICATION = 11,
}

interface RegistrationFlowProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({
  onComplete,
  onCancel
}) => {
  const navigation = useNavigation();
  const registerMutation = useRegister();

  // Step state
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(RegistrationStep.PERSONAL_INFO);

  // Form data state
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoForm | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfoForm | null>(null);
  const [islamicInfo, setIslamicInfo] = useState<IslamicInfoForm | null>(null);
  const [marriageInfo, setMarriageInfo] = useState<MarriageInfoForm | null>(null);
  const [physicalInfo, setPhysicalInfo] = useState<PhysicalInfoForm | null>(null);
  const [professionalInfo, setProfessionalInfo] = useState<ProfessionalInfoForm | null>(null);
  const [familyInfo, setFamilyInfo] = useState<FamilyInfoForm | null>(null);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetailsForm | null>(null);
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);

  // Form hooks for each step
  const personalInfoForm = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      gender: 'male',
      password: '',
      confirmPassword: ''
    }
  });

  const locationInfoForm = useForm<LocationInfoForm>({
    resolver: zodResolver(locationInfoSchema),
    defaultValues: { willingToRelocate: false }
  });

  const islamicInfoForm = useForm<IslamicInfoForm>({
    resolver: zodResolver(islamicInfoSchema),
    defaultValues: {
      sect: 'sunni',
      prayerFrequency: 'five_times_daily',
      hajjPerformed: false,
      umrahPerformed: false
    }
  });

  const marriageInfoForm = useForm<MarriageInfoForm>({
    resolver: zodResolver(marriageInfoSchema),
    defaultValues: {
      maritalStatus: 'never_married',
      hasChildren: false,
      childrenLivingWithUser: false,
      currentWivesCount: 0
    }
  });

  const physicalInfoForm = useForm<PhysicalInfoForm>({
    resolver: zodResolver(physicalInfoSchema)
  });

  const professionalInfoForm = useForm<ProfessionalInfoForm>({
    resolver: zodResolver(professionalInfoSchema)
  });

  const familyInfoForm = useForm<FamilyInfoForm>({
    resolver: zodResolver(familyInfoSchema)
  });

  const personalDetailsForm = useForm<PersonalDetailsForm>({
    resolver: zodResolver(personalDetailsSchema)
  });

  // Step navigation
  const nextStep = () => {
    if (currentStep < RegistrationStep.VERIFICATION) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > RegistrationStep.PERSONAL_INFO) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step completion handlers
  const handlePersonalInfoSubmit = (data: PersonalInfoForm) => {
    setPersonalInfo(data);
    nextStep();
  };

  const handleLocationInfoSubmit = (data: LocationInfoForm) => {
    setLocationInfo(data);
    nextStep();
  };

  const handleIslamicInfoSubmit = (data: IslamicInfoForm) => {
    setIslamicInfo(data);
    nextStep();
  };

  const handleMarriageInfoSubmit = (data: MarriageInfoForm) => {
    setMarriageInfo(data);
    nextStep();
  };

  const handlePhysicalInfoSubmit = (data: PhysicalInfoForm) => {
    setPhysicalInfo(data);
    nextStep();
  };

  const handleProfessionalInfoSubmit = (data: ProfessionalInfoForm) => {
    setProfessionalInfo(data);
    nextStep();
  };

  const handleFamilyInfoSubmit = (data: FamilyInfoForm) => {
    setFamilyInfo(data);
    nextStep();
  };

  const handlePersonalDetailsSubmit = (data: PersonalDetailsForm) => {
    setPersonalDetails(data);
    nextStep();
  };

  const handlePreferencesSubmit = (data: PreferencesData) => {
    setPreferences(data);
    nextStep();
  };

  const handleQuestionnaireSubmit = (data: QuestionnaireData) => {
    setQuestionnaire(data);
    performRegistration();
  };

  // Final registration
  const performRegistration = async () => {
    if (!personalInfo || !locationInfo || !islamicInfo || !marriageInfo) {
      Alert.alert('Error', 'Please complete all required steps.');
      return;
    }

    try {
      const registrationData: RegistrationData = {
        // Personal info
        email: personalInfo.email,
        password: personalInfo.password,
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        gender: personalInfo.gender as GenderType,
        dateOfBirth: personalInfo.dateOfBirth,
        phone: personalInfo.phone,

        // Location info
        country: locationInfo.country,
        stateProvince: locationInfo.stateProvince,
        city: locationInfo.city,
        postalCode: locationInfo.postalCode,
        willingToRelocate: locationInfo.willingToRelocate,

        // Islamic info
        sect: islamicInfo.sect as SectType,
        madhab: islamicInfo.madhab as MadhabType,
        prayerFrequency: islamicInfo.prayerFrequency,
        quranMemorizationLevel: islamicInfo.quranMemorizationLevel,
        islamicEducationLevel: islamicInfo.islamicEducationLevel,
        hajjPerformed: islamicInfo.hajjPerformed,
        umrahPerformed: islamicInfo.umrahPerformed,
        hijabStyle: islamicInfo.hijabStyle,
        beardStyle: islamicInfo.beardStyle,

        // Marriage info
        maritalStatus: marriageInfo.maritalStatus as MaritalStatusType,
        hasChildren: marriageInfo.hasChildren,
        numberOfChildren: marriageInfo.numberOfChildren,
        childrenLivingWithUser: marriageInfo.childrenLivingWithUser,
        wantsChildren: marriageInfo.wantsChildren,
        acceptPolygamy: marriageInfo.acceptPolygamy as PolygamyPreferenceType,
        willingWifeNumber: marriageInfo.willingWifeNumber as WifeNumberType[],
        seekingWifeNumber: marriageInfo.seekingWifeNumber as SeekingWifeNumberType,
        currentWivesCount: marriageInfo.currentWivesCount,

        // Physical info
        heightCm: physicalInfo?.heightCm,
        weightKg: physicalInfo?.weightKg,
        eyeColor: physicalInfo?.eyeColor,
        hairColor: physicalInfo?.hairColor,
        skinTone: physicalInfo?.skinTone,
        bodyType: physicalInfo?.bodyType,

        // Professional info
        educationLevel: professionalInfo?.educationLevel,
        fieldOfStudy: professionalInfo?.fieldOfStudy,
        occupation: professionalInfo?.occupation,
        occupationCategory: professionalInfo?.occupationCategory,
        annualIncomeRange: professionalInfo?.annualIncomeRange,
        employmentStatus: professionalInfo?.employmentStatus,

        // Family info
        fatherOccupation: familyInfo?.fatherOccupation,
        motherOccupation: familyInfo?.motherOccupation,
        numberOfSiblings: familyInfo?.numberOfSiblings,
        familyReligiousLevel: familyInfo?.familyReligiousLevel,
        familyFinancialStatus: familyInfo?.familyFinancialStatus,

        // Personal details
        bio: personalDetails?.bio,
        hobbies: personalDetails?.hobbies,
        languagesSpoken: personalDetails?.languagesSpoken,
        lookingFor: personalDetails?.lookingFor,
      };

      await registerMutation.mutateAsync({
        registrationData,
        preferencesData: preferences || {} as PreferencesData,
        questionnaireData: questionnaire || {}
      });

      setCurrentStep(RegistrationStep.VERIFICATION);
      
      Alert.alert(
        'Registration Successful!',
        'Your Islamic marriage profile has been created.',
        [
          {
            text: 'Continue',
            onPress: () => {
              onComplete?.();
              navigation.navigate('(tabs)' as never);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', 'Please try again.');
    }
  };

  // Progress calculation
  const progress = (currentStep / RegistrationStep.VERIFICATION) * 100;

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case RegistrationStep.PERSONAL_INFO:
        return (
          <PersonalInfoStep
            form={personalInfoForm}
            onSubmit={handlePersonalInfoSubmit}
            onCancel={onCancel}
          />
        );
      case RegistrationStep.LOCATION_INFO:
        return (
          <LocationInfoStep
            form={locationInfoForm}
            onSubmit={handleLocationInfoSubmit}
            onBack={prevStep}
          />
        );
      case RegistrationStep.ISLAMIC_INFO:
        return (
          <IslamicInfoStep
            form={islamicInfoForm}
            onSubmit={handleIslamicInfoSubmit}
            onBack={prevStep}
          />
        );
      case RegistrationStep.MARRIAGE_INFO:
        return (
          <MarriageInfoStep
            form={marriageInfoForm}
            gender={personalInfo?.gender}
            onSubmit={handleMarriageInfoSubmit}
            onBack={prevStep}
          />
        );
      case RegistrationStep.PHYSICAL_INFO:
        return (
          <PhysicalInfoStep
            form={physicalInfoForm}
            onSubmit={handlePhysicalInfoSubmit}
            onBack={prevStep}
            onSkip={nextStep}
          />
        );
      case RegistrationStep.PROFESSIONAL_INFO:
        return (
          <ProfessionalInfoStep
            form={professionalInfoForm}
            onSubmit={handleProfessionalInfoSubmit}
            onBack={prevStep}
            onSkip={nextStep}
          />
        );
      case RegistrationStep.FAMILY_INFO:
        return (
          <FamilyInfoStep
            form={familyInfoForm}
            onSubmit={handleFamilyInfoSubmit}
            onBack={prevStep}
            onSkip={nextStep}
          />
        );
      case RegistrationStep.PERSONAL_DETAILS:
        return (
          <PersonalDetailsStep
            form={personalDetailsForm}
            onSubmit={handlePersonalDetailsSubmit}
            onBack={prevStep}
            onSkip={nextStep}
          />
        );
      case RegistrationStep.PREFERENCES:
        return (
          <PreferencesStep
            gender={personalInfo?.gender as GenderType}
            onSubmit={handlePreferencesSubmit}
            onBack={prevStep}
          />
        );
      case RegistrationStep.QUESTIONNAIRE:
        return (
          <QuestionnaireStep
            gender={personalInfo?.gender as GenderType}
            onSubmit={handleQuestionnaireSubmit}
            onBack={prevStep}
          />
        );
      case RegistrationStep.VERIFICATION:
        return (
          <VerificationStep
            onContinue={() => {
              onComplete?.();
              navigation.navigate('(tabs)' as never);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Step {currentStep} of {RegistrationStep.VERIFICATION}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Current Step */}
      {renderCurrentStep()}
    </KeyboardAvoidingView>
  );
};

// Step Components would be defined here...
// Due to length, I'll create separate component files for each step

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  progressContainer: {
    padding: getResponsiveSpacing(20),
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray7,
  },
  progressText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(10),
    color: COLORS.black,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.gray6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
});

export default RegistrationFlow;
