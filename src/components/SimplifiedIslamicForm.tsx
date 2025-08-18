// ============================================================================
// SIMPLIFIED ISLAMIC PREFERENCES FORM - HUME DATING APP
// ============================================================================
// Simplified form for Islamic marriage preferences based on gender
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '../../utils/responsive';
import type { GenderType, MaritalStatusType } from '../types/database.types';

// ================================
// INTERFACE DEFINITIONS
// ================================

interface SimplifiedPreferences {
  // Basic info (collected in next steps)
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  gender?: GenderType;
  
  // For females: marital status + polygamy acceptance
  maritalStatus?: MaritalStatusType;
  acceptPolygamy?: boolean;
  wifePositionsAccepted?: ('second' | 'third' | 'fourth')[];
  
  // For males: polygamy intentions
  seekingWifeNumber?: ('second' | 'third' | 'fourth')[];
  currentWives?: number;
  maxWives?: number;
}

interface SimplifiedIslamicFormProps {
  gender: GenderType;
  onPreferencesChange: (preferences: Partial<SimplifiedPreferences>) => void;
  initialPreferences?: Partial<SimplifiedPreferences>;
  onSubmit?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

// ================================
// SIMPLIFIED ISLAMIC FORM COMPONENT
// ================================

const SimplifiedIslamicForm: React.FC<SimplifiedIslamicFormProps> = ({
  gender,
  onPreferencesChange,
  initialPreferences = {},
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [preferences, setPreferences] = useState<SimplifiedPreferences>({
    gender,
    ...initialPreferences
  });

  const updatePreference = (key: keyof SimplifiedPreferences, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    onPreferencesChange(updated);
  };

  const handleMultiSelect = (key: keyof SimplifiedPreferences, value: string) => {
    const currentValues = (preferences[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    updatePreference(key, newValues);
  };

  const validateAndSubmit = () => {
    const validationErrors: string[] = [];

    if (gender === 'female') {
      if (!preferences.maritalStatus) {
        validationErrors.push('Please select your marital status');
      }
      if (preferences.acceptPolygamy && (!preferences.wifePositionsAccepted || preferences.wifePositionsAccepted.length === 0)) {
        validationErrors.push('Please select which wife positions you would accept');
      }
    } else if (gender === 'male') {
      if (!preferences.seekingWifeNumber || preferences.seekingWifeNumber.length === 0) {
        validationErrors.push('Please select which wife number you are seeking');
      }
      if (preferences.currentWives === undefined) {
        validationErrors.push('Please specify your current number of wives');
      }
    }

    if (validationErrors.length > 0) {
      Alert.alert('Incomplete Information', validationErrors.join('\n'));
      return;
    }

    onSubmit?.();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Islamic Marriage Preferences</Text>
        <Text style={styles.subtitle}>
          {gender === 'female' 
            ? 'Tell us about your marital status and polygamy preferences'
            : 'Tell us about your polygamy intentions'
          }
        </Text>
      </View>

      {/* FEMALE SPECIFIC SECTIONS */}
      {gender === 'female' && (
        <>
          {/* Marital Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Marital Status *</Text>
            <View style={styles.optionsContainer}>
              {[
                { value: 'never_married', label: 'Never Married', description: 'This would be my first marriage' },
                { value: 'divorced', label: 'Divorced', description: 'Previously married, now divorced' },
                { value: 'widowed', label: 'Widowed', description: 'Previously married, spouse deceased' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    preferences.maritalStatus === option.value && styles.optionButtonSelected
                  ]}
                  onPress={() => updatePreference('maritalStatus', option.value)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      preferences.maritalStatus === option.value && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      preferences.maritalStatus === option.value && styles.optionDescriptionSelected
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  {preferences.maritalStatus === option.value && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Polygamy Acceptance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Polygamy Preference</Text>
            <TouchableOpacity
              style={[styles.toggleButton, preferences.acceptPolygamy && styles.toggleButtonActive]}
              onPress={() => updatePreference('acceptPolygamy', !preferences.acceptPolygamy)}
            >
              <Text style={[
                styles.toggleText,
                preferences.acceptPolygamy && styles.toggleTextActive
              ]}>
                {preferences.acceptPolygamy ? 'Accept polygamous marriage' : 'Prefer monogamous marriage only'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Wife Positions (if accepting polygamy) */}
          {preferences.acceptPolygamy && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wife Positions Accepted *</Text>
              <Text style={styles.sectionSubtitle}>Select which positions you would accept</Text>
              <View style={styles.optionsContainer}>
                {[
                  { value: 'second', label: '2nd Wife', description: 'Accept being the second wife' },
                  { value: 'third', label: '3rd Wife', description: 'Accept being the third wife' },
                  { value: 'fourth', label: '4th Wife', description: 'Accept being the fourth wife' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      preferences.wifePositionsAccepted?.includes(option.value as any) && styles.optionButtonSelected
                    ]}
                    onPress={() => handleMultiSelect('wifePositionsAccepted', option.value)}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[
                        styles.optionLabel,
                        preferences.wifePositionsAccepted?.includes(option.value as any) && styles.optionLabelSelected
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        preferences.wifePositionsAccepted?.includes(option.value as any) && styles.optionDescriptionSelected
                      ]}>
                        {option.description}
                      </Text>
                    </View>
                    {preferences.wifePositionsAccepted?.includes(option.value as any) && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {/* MALE SPECIFIC SECTIONS */}
      {gender === 'male' && (
        <>
          {/* Current Wives */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Number of Wives *</Text>
            <View style={styles.numberSelector}>
              {[0, 1, 2, 3].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.numberButton,
                    preferences.currentWives === num && styles.numberButtonSelected
                  ]}
                  onPress={() => updatePreference('currentWives', num)}
                >
                  <Text style={[
                    styles.numberButtonText,
                    preferences.currentWives === num && styles.numberButtonTextSelected
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Seeking Wife Number */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking For *</Text>
            <Text style={styles.sectionSubtitle}>Which wife number are you seeking?</Text>
            <View style={styles.optionsContainer}>
              {[
                { value: 'second', label: '2nd Wife', description: 'Looking for a second wife' },
                { value: 'third', label: '3rd Wife', description: 'Looking for a third wife' },
                { value: 'fourth', label: '4th Wife', description: 'Looking for a fourth wife' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    preferences.seekingWifeNumber?.includes(option.value as any) && styles.optionButtonSelected
                  ]}
                  onPress={() => handleMultiSelect('seekingWifeNumber', option.value)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      preferences.seekingWifeNumber?.includes(option.value as any) && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      preferences.seekingWifeNumber?.includes(option.value as any) && styles.optionDescriptionSelected
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  {preferences.seekingWifeNumber?.includes(option.value as any) && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title={isLoading ? "Saving..." : "Continue"}
          onPress={validateAndSubmit}
          style={styles.submitButton}
          disabled={isLoading}
        />
        
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  header: {
    padding: getResponsiveSpacing(24),
    alignItems: 'center',
  },
  title: {
    fontSize: getResponsiveFontSize(24),
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
    lineHeight: getResponsiveFontSize(22),
  },
  section: {
    paddingHorizontal: getResponsiveSpacing(24),
    marginBottom: getResponsiveSpacing(32),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(8),
  },
  sectionSubtitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
    marginBottom: getResponsiveSpacing(16),
  },
  optionsContainer: {
    gap: getResponsiveSpacing(12),
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray2,
    borderRadius: 12,
    padding: getResponsiveSpacing(16),
  },
  optionButtonSelected: {
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
  toggleButton: {
    backgroundColor: COLORS.gray2,
    borderRadius: 12,
    padding: getResponsiveSpacing(16),
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.black,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  numberSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: getResponsiveSpacing(16),
  },
  numberButton: {
    width: getResponsiveSpacing(60),
    height: getResponsiveSpacing(60),
    borderRadius: 30,
    backgroundColor: COLORS.gray2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray2,
  },
  numberButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  numberButtonText: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'bold',
    color: COLORS.black,
  },
  numberButtonTextSelected: {
    color: COLORS.white,
  },
  actionButtons: {
    padding: getResponsiveSpacing(24),
    paddingBottom: getResponsiveSpacing(40),
  },
  submitButton: {
    marginBottom: getResponsiveSpacing(16),
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(12),
  },
  cancelButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.gray,
  },
});

export default SimplifiedIslamicForm;
