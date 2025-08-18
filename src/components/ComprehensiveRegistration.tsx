// ============================================================================
// COMPREHENSIVE REGISTRATION FLOW - HUME ISLAMIC DATING APP
// ============================================================================
// Complete multi-step registration with all necessary dating profile information
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { COLORS, SIZES, icons } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { supabase } from '../config/supabase';
import type { GenderType } from '../types/database.types';

// ================================
// VALIDATION SCHEMAS
// ================================

const physicalDetailsSchema = z.object({
  height: z.number().min(120, 'Height must be at least 120cm').max(250, 'Height must be less than 250cm'),
  weight: z.number().min(30, 'Weight must be at least 30kg').max(200, 'Weight must be less than 200kg'),
  eyeColor: z.string().min(1, 'Eye color is required'),
  hairColor: z.string().min(1, 'Hair color is required'),
  skinColor: z.string().min(1, 'Skin color is required'),
  bodyType: z.string().min(1, 'Body type is required'),
});

const lifestyleSchema = z.object({
  education: z.string().min(1, 'Education level is required'),
  occupation: z.string().min(1, 'Occupation is required'),
  income: z.string().optional(),
  housingType: z.string().min(1, 'Housing type is required'),
  livingCondition: z.string().min(1, 'Living condition is required'),
});

const religiousSchema = z.object({
  religiousLevel: z.string().min(1, 'Religious level is required'),
  prayerFrequency: z.string().min(1, 'Prayer frequency is required'),
  quranReading: z.string().min(1, 'Quran reading level is required'),
  hijabPractice: z.string().optional(), // Only for females
  beardPractice: z.string().optional(), // Only for males
});

const polygamySchema = z.object({
  seekingWifeNumber: z.string().optional(), // For males - single selection
  acceptedWifePositions: z.array(z.string()).optional(), // For females - multi selection
});

type PhysicalDetails = z.infer<typeof physicalDetailsSchema>;
type LifestyleDetails = z.infer<typeof lifestyleSchema>;
type ReligiousDetails = z.infer<typeof religiousSchema>;
type PolygamyDetails = z.infer<typeof polygamySchema>;

// ================================
// COMPREHENSIVE REGISTRATION COMPONENT
// ================================

interface ComprehensiveRegistrationProps {
  gender: GenderType;
  basicInfo: {
    firstName: string;
    lastName?: string;
    email: string;
    dateOfBirth: string;
    country: string;
    city: string;
  };
  onComplete: (profileData: any) => void;
  onBack: () => void;
}

const ComprehensiveRegistration: React.FC<ComprehensiveRegistrationProps> = ({ 
  gender, 
  basicInfo, 
  onComplete,
  onBack 
}) => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [physicalDetails, setPhysicalDetails] = useState<Partial<PhysicalDetails>>({});
  const [lifestyleDetails, setLifestyleDetails] = useState<Partial<LifestyleDetails>>({});
  const [religiousDetails, setReligiousDetails] = useState<Partial<ReligiousDetails>>({});
  const [polygamyDetails, setPolygamyDetails] = useState<Partial<PolygamyDetails>>({});

  // Form hooks for each step
  const physicalForm = useForm<PhysicalDetails>({
    resolver: zodResolver(physicalDetailsSchema),
    defaultValues: physicalDetails,
  });

  const lifestyleForm = useForm<LifestyleDetails>({
    resolver: zodResolver(lifestyleSchema),
    defaultValues: lifestyleDetails,
  });

  const religiousForm = useForm<ReligiousDetails>({
    resolver: zodResolver(religiousSchema),
    defaultValues: religiousDetails,
  });

  // Options for dropdowns
  const eyeColorOptions = [
    'Brown', 'Black', 'Hazel', 'Green', 'Blue', 'Gray', 'Amber'
  ];

  const hairColorOptions = [
    'Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Red', 'Gray', 'White'
  ];

  const skinColorOptions = [
    'Very Fair', 'Fair', 'Medium', 'Olive', 'Brown', 'Dark Brown', 'Very Dark'
  ];

  const bodyTypeOptions = [
    'Slim', 'Average', 'Athletic', 'Curvy', 'Heavy Set', 'Plus Size'
  ];

  const educationOptions = [
    'High School', 'Some College', 'Bachelor\'s Degree', 'Master\'s Degree', 
    'PhD/Doctorate', 'Islamic Studies', 'Professional Certification', 'Other'
  ];

  const housingOptions = [
    'Rent Apartment', 'Rent House', 'Own Apartment', 'Own House', 
    'Family Home', 'Shared Accommodation', 'Other'
  ];

  const livingConditionOptions = [
    'Independent', 'With Family', 'With Roommates', 'With Parents', 'Other'
  ];

  const religiousLevelOptions = [
    'Very Religious', 'Religious', 'Moderately Religious', 'Somewhat Religious', 'Learning'
  ];

  const prayerFrequencyOptions = [
    'All 5 Daily Prayers', 'Most Prayers', 'Some Prayers', 'Friday Only', 'Occasionally', 'Learning to Pray'
  ];

  const quranReadingOptions = [
    'Memorized Significant Portions', 'Read Fluently', 'Read with Help', 'Learning to Read', 'Cannot Read Arabic'
  ];

  // Step handlers
  const handlePhysicalDetailsNext = (data: PhysicalDetails) => {
    setPhysicalDetails(data);
    setCurrentStep(2);
  };

  const handleLifestyleNext = (data: LifestyleDetails) => {
    setLifestyleDetails(data);
    setCurrentStep(3);
  };

  const handleReligiousNext = (data: ReligiousDetails) => {
    setReligiousDetails(data);
    setCurrentStep(4);
  };

  const handlePolygamyComplete = async () => {
    setIsLoading(true);
    try {
      const completeProfile = {
        basicInfo,
        physicalDetails,
        lifestyleDetails,
        religiousDetails,
        polygamyDetails,
        gender,
      };

      await onComplete(completeProfile);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to complete registration. Please try again.');
      console.error('Registration completion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of 4</Text>
    </View>
  );

  const renderDropdownSelector = (
    title: string,
    options: string[],
    selectedValue: string | undefined,
    onSelect: (value: string) => void,
    required = false
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title} {required && '*'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionChip,
              selectedValue === option && styles.optionChipSelected
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[
              styles.optionChipText,
              selectedValue === option && styles.optionChipTextSelected
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Step 1: Physical Details
  const renderPhysicalDetailsStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Physical Details</Text>
      <Text style={styles.stepSubtitle}>Help others know what you look like</Text>

      <View style={styles.formContainer}>
        <View style={styles.rowContainer}>
          <View style={styles.halfWidth}>
            <Controller
              control={physicalForm.control}
              name="height"
              render={({ field: { onChange, value } }) => (
                <Input
                  id="height"
                  placeholder="Height (cm) *"
                  onInputChanged={(id, text) => onChange(parseInt(text) || 0)}
                  errorText={physicalForm.formState.errors.height?.message}
                  keyboardType="numeric"
                />
              )}
            />
          </View>
          <View style={styles.halfWidth}>
            <Controller
              control={physicalForm.control}
              name="weight"
              render={({ field: { onChange, value } }) => (
                <Input
                  id="weight"
                  placeholder="Weight (kg) *"
                  onInputChanged={(id, text) => onChange(parseInt(text) || 0)}
                  errorText={physicalForm.formState.errors.weight?.message}
                  keyboardType="numeric"
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={physicalForm.control}
          name="eyeColor"
          render={({ field: { onChange, value } }) => 
            renderDropdownSelector('Eye Color', eyeColorOptions, value, onChange, true)
          }
        />

        <Controller
          control={physicalForm.control}
          name="hairColor"
          render={({ field: { onChange, value } }) => 
            renderDropdownSelector('Hair Color', hairColorOptions, value, onChange, true)
          }
        />

        <Controller
          control={physicalForm.control}
          name="skinColor"
          render={({ field: { onChange, value } }) => 
            renderDropdownSelector('Skin Color', skinColorOptions, value, onChange, true)
          }
        />

        <Controller
          control={physicalForm.control}
          name="bodyType"
          render={({ field: { onChange, value } }) => 
            renderDropdownSelector('Body Type', bodyTypeOptions, value, onChange, true)
          }
        />

        <Button
          title="Continue"
          onPress={physicalForm.handleSubmit(handlePhysicalDetailsNext)}
          style={styles.continueButton}
        />
      </View>
    </ScrollView>
  );

  // Step 2: Lifestyle & Work
  const renderLifestyleStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Lifestyle & Work</Text>
      <Text style={styles.stepSubtitle}>Tell us about your life and career</Text>

      <View style={styles.formContainer}>
        <Controller
          control={lifestyleForm.control}
          name="education"
          render={({ field: { onChange, value } }) => 
            renderDropdownSelector('Education Level', educationOptions, value, onChange, true)
          }
        />

        <Controller
          control={lifestyleForm.control}
          name="occupation"
          render={({ field: { onChange, value } }) => (
            <Input
              id="occupation"
              placeholder="Occupation/Work *"
              onInputChanged={(id, text) => onChange(text)}
              errorText={lifestyleForm.formState.errors.occupation?.message}
            />
          )}
        />

        {gender === 'male' && (
          <Controller
            control={lifestyleForm.control}
            name="income"
            render={({ field: { onChange, value } }) => (
              <Input
                id="income"
                placeholder="Monthly Income (Optional)"
                onInputChanged={(id, text) => onChange(text)}
              />
            )}
          />
        )}

        <Controller
          control={lifestyleForm.control}
          name="housingType"
          render={({ field: { onChange, value } }) => 
            renderDropdownSelector('Housing Type', housingOptions, value, onChange, true)
          }
        />

        <Controller
          control={lifestyleForm.control}
          name="livingCondition"
          render={({ field: { onChange, value } }) => 
            renderDropdownSelector('Living Condition', livingConditionOptions, value, onChange, true)
          }
        />

        <Button
          title="Continue"
          onPress={lifestyleForm.handleSubmit(handleLifestyleNext)}
          style={styles.continueButton}
        />
      </View>
    </ScrollView>
  );

  // Step 3: Religious Commitment
  const renderReligiousStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Religious Commitment</Text>
      <Text style={styles.stepSubtitle}>Share your Islamic practices and beliefs</Text>

      <View style={styles.formContainer}>
        <Controller
          control={religiousForm.control}
          name="religiousLevel"
          render={({ field: { onChange, value } }) => 
            renderDropdownSelector('Religious Level', religiousLevelOptions, value, onChange, true)
          }
        />

        <Controller
          control={religiousForm.control}
          name="prayerFrequency"
          render={({ field: { onChange, value } }) => 
            renderDropdownSelector('Prayer Frequency', prayerFrequencyOptions, value, onChange, true)
          }
        />

        <Controller
          control={religiousForm.control}
          name="quranReading"
          render={({ field: { onChange, value } }) => 
            renderDropdownSelector('Quran Reading Level', quranReadingOptions, value, onChange, true)
          }
        />

        {gender === 'female' && (
          <Controller
            control={religiousForm.control}
            name="hijabPractice"
            render={({ field: { onChange, value } }) => 
              renderDropdownSelector('Hijab Practice', ['Always', 'Usually', 'Sometimes', 'Special Occasions', 'No'], value, onChange)
            }
          />
        )}

        {gender === 'male' && (
          <Controller
            control={religiousForm.control}
            name="beardPractice"
            render={({ field: { onChange, value } }) => 
              renderDropdownSelector('Beard Practice', ['Full Beard', 'Trimmed Beard', 'Mustache Only', 'Clean Shaven'], value, onChange)
            }
          />
        )}

        <Button
          title="Continue"
          onPress={religiousForm.handleSubmit(handleReligiousNext)}
          style={styles.continueButton}
        />
      </View>
    </ScrollView>
  );

  // Step 4: Marriage Intentions (Polygamy)
  const renderPolygamyStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Marriage Intentions</Text>
      <Text style={styles.stepSubtitle}>
        {gender === 'male' 
          ? 'Which wife number are you looking for?' 
          : 'Which positions would you accept in a polygamous marriage?'
        }
      </Text>

      <View style={styles.formContainer}>
        {gender === 'male' ? (
          // Male: Single selection for wife number
          <View style={styles.polygamySection}>
            <Text style={styles.polygamyTitle}>Looking for which wife? *</Text>
            <Text style={styles.polygamyNote}>
              If you select 2nd wife, it means you currently have 1 wife.
              If you select 3rd wife, it means you currently have 2 wives, etc.
            </Text>
            
            {['2nd Wife', '3rd Wife', '4th Wife'].map((option, index) => {
              const value = `${index + 2}`;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.polygamyOption,
                    polygamyDetails.seekingWifeNumber === value && styles.polygamyOptionSelected
                  ]}
                  onPress={() => setPolygamyDetails({ ...polygamyDetails, seekingWifeNumber: value })}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      polygamyDetails.seekingWifeNumber === value && styles.optionLabelSelected
                    ]}>
                      {option}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      polygamyDetails.seekingWifeNumber === value && styles.optionDescriptionSelected
                    ]}>
                      Currently have {index + 1} wife{index > 0 ? 's' : ''}
                    </Text>
                  </View>
                  {polygamyDetails.seekingWifeNumber === value && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          // Female: Multi-selection for wife positions
          <View style={styles.polygamySection}>
            <Text style={styles.polygamyTitle}>Which positions would you accept? *</Text>
            <Text style={styles.polygamyNote}>
              You can select multiple positions that you would be comfortable with.
            </Text>
            
            {['2nd Wife', '3rd Wife', '4th Wife'].map((option, index) => {
              const value = `${index + 2}`;
              const isSelected = polygamyDetails.acceptedWifePositions?.includes(value) || false;
              
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.polygamyOption,
                    isSelected && styles.polygamyOptionSelected
                  ]}
                  onPress={() => {
                    const current = polygamyDetails.acceptedWifePositions || [];
                    const updated = isSelected 
                      ? current.filter(v => v !== value)
                      : [...current, value];
                    setPolygamyDetails({ ...polygamyDetails, acceptedWifePositions: updated });
                  }}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected
                    ]}>
                      {option}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      isSelected && styles.optionDescriptionSelected
                    ]}>
                      Accept being the {option.toLowerCase()}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Button
          title={isLoading ? "Completing Registration..." : "Complete Registration"}
          onPress={handlePolygamyComplete}
          style={styles.continueButton}
          disabled={isLoading || (
            gender === 'male' ? !polygamyDetails.seekingWifeNumber : 
            !polygamyDetails.acceptedWifePositions?.length
          )}
        />
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {renderProgressBar()}

      {currentStep === 1 && renderPhysicalDetailsStep()}
      {currentStep === 2 && renderLifestyleStep()}
      {currentStep === 3 && renderReligiousStep()}
      {currentStep === 4 && renderPolygamyStep()}
    </View>
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
  progressContainer: {
    paddingHorizontal: getResponsiveSpacing(24),
    paddingVertical: getResponsiveSpacing(16),
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.gray2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'medium',
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: getResponsiveSpacing(8),
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(24),
  },
  stepSubtitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(32),
    paddingHorizontal: getResponsiveSpacing(24),
    lineHeight: getResponsiveFontSize(22),
  },
  formContainer: {
    paddingHorizontal: getResponsiveSpacing(24),
    paddingBottom: getResponsiveSpacing(32),
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveSpacing(12),
  },
  halfWidth: {
    flex: 1,
  },
  selectorContainer: {
    marginBottom: getResponsiveSpacing(24),
  },
  selectorTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(12),
  },
  optionsScroll: {
    flexGrow: 0,
  },
  optionChip: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(8),
    marginRight: getResponsiveSpacing(8),
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'medium',
    color: COLORS.primary,
  },
  optionChipTextSelected: {
    color: COLORS.white,
  },
  polygamySection: {
    marginBottom: getResponsiveSpacing(24),
  },
  polygamyTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(8),
  },
  polygamyNote: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
    marginBottom: getResponsiveSpacing(20),
    lineHeight: getResponsiveFontSize(20),
  },
  polygamyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray2,
    borderRadius: 12,
    padding: getResponsiveSpacing(16),
    marginBottom: getResponsiveSpacing(12),
  },
  polygamyOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(4),
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
  },
  optionDescriptionSelected: {
    color: COLORS.primary,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  continueButton: {
    marginTop: getResponsiveSpacing(24),
  },
});

export default ComprehensiveRegistration;
