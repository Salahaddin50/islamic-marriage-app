// ============================================================================
// ISLAMIC MARRIAGE PREFERENCES FORM - HUME DATING APP
// ============================================================================
// Comprehensive form component for Islamic marriage preferences
// Supports plural marriage, religious practices, and cultural preferences
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '../utils/responsive';
import type { 
  GenderType,
  MaritalStatusType,
  SectType,
  MadhabType,
  PolygamyPreferenceType,
  WifeNumberType,
  SeekingWifeNumberType,
  HijabType,
  BeardType,
  PrayerFrequencyType,
  CreatePartnerPreferences,
  CreateIslamicQuestionnaire
} from '../types/database.types';

// ================================
// INTERFACE DEFINITIONS
// ================================

interface IslamicPreferencesFormProps {
  gender: Gender;
  onPreferencesChange: (preferences: Partial<IslamicPreferences>) => void;
  initialPreferences?: Partial<IslamicPreferences>;
  onSubmit?: () => void;
  isLoading?: boolean;
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: string;
}

interface OptionSelectorProps {
  title: string;
  options: { value: string; label: string; description?: string }[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  multiSelect?: boolean;
  selectedValues?: string[];
}

interface ToggleSwitchProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

// ================================
// HELPER COMPONENTS
// ================================

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <Ionicons name={icon as any} size={24} color={COLORS.primary} />
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  </View>
);

const OptionSelector: React.FC<OptionSelectorProps> = ({ 
  title, 
  options, 
  selectedValue, 
  onSelect, 
  multiSelect = false, 
  selectedValues = [] 
}) => {
  return (
    <View style={styles.optionSelector}>
      <Text style={styles.optionTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = multiSelect 
            ? selectedValues.includes(option.value)
            : selectedValue === option.value;
          
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[
                styles.optionText, 
                isSelected && styles.optionTextSelected
              ]}>
                {option.label}
              </Text>
              {option.description && (
                <Text style={styles.optionDescription}>{option.description}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ title, subtitle, value, onToggle }) => (
  <TouchableOpacity style={styles.toggleContainer} onPress={() => onToggle(!value)}>
    <View style={styles.toggleLeft}>
      <Text style={styles.toggleTitle}>{title}</Text>
      {subtitle && <Text style={styles.toggleSubtitle}>{subtitle}</Text>}
    </View>
    <View style={[styles.toggleSwitch, value && styles.toggleSwitchActive]}>
      <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
    </View>
  </TouchableOpacity>
);

// ================================
// MAIN COMPONENT
// ================================

const IslamicPreferencesForm: React.FC<IslamicPreferencesFormProps> = ({
  gender,
  onPreferencesChange,
  initialPreferences = {},
  onSubmit,
  isLoading = false,
}) => {
  const [preferences, setPreferences] = useState<Partial<IslamicPreferences>>({
    // Set default values
    marriageIntention: 'monogamous',
    religionLevel: 'practicing',
    prayerFrequency: 'five_times',
    quranReading: true,
    islamicEducation: false,
    halaalDiet: true,
    smoking: false,
    wantsChildren: true,
    hasChildren: false,
    acceptsPolygamy: false,
    familyLivingArrangement: 'flexible',
    languagesSpoken: ['english'],
    currentCountry: '',
    ...initialPreferences,
  });

  const updatePreference = <K extends keyof IslamicPreferences>(
    key: K,
    value: IslamicPreferences[K]
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    onPreferencesChange(updated);
  };

  const handleMultiSelect = (key: keyof IslamicPreferences, value: string) => {
    const currentValues = (preferences[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    updatePreference(key, newValues as any);
  };

  // Marriage intention options
  const marriageIntentionOptions = [
    { 
      value: 'monogamous', 
      label: 'Monogamous Marriage', 
      description: 'Seeking one spouse only' 
    },
    ...(gender === 'male' ? [
      { 
        value: 'polygamous', 
        label: 'Polygamous Marriage', 
        description: 'Open to multiple wives (up to 4)' 
      }
    ] : [
      { 
        value: 'accepting_polygamy', 
        label: 'Accept Polygamy', 
        description: 'Willing to be part of polygamous marriage' 
      }
    ]),
  ];

  // Marriage type options for women
  const marriageTypeOptions: { value: MarriageType; label: string; description: string }[] = [
    { value: 'first', label: 'First Wife', description: 'Become the first wife' },
    { value: 'second', label: 'Second Wife', description: 'Willing to be second wife' },
    { value: 'third', label: 'Third Wife', description: 'Willing to be third wife' },
    { value: 'fourth', label: 'Fourth Wife', description: 'Willing to be fourth wife' },
  ];

  // Religion level options
  const religionLevelOptions = [
    { value: 'practicing', label: 'Practicing', description: 'Follow Islamic practices regularly' },
    { value: 'moderate', label: 'Moderate', description: 'Practice Islam moderately' },
    { value: 'cultural', label: 'Cultural', description: 'Cultural connection to Islam' },
    { value: 'learning', label: 'Learning', description: 'Learning about Islam' },
  ];

  // Madhab school options
  const madhahOptions = [
    { value: 'hanafi', label: 'Hanafi' },
    { value: 'maliki', label: 'Maliki' },
    { value: 'shafii', label: 'Shafi\'i' },
    { value: 'hanbali', label: 'Hanbali' },
    { value: 'jafari', label: 'Ja\'fari (Shia)' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  // Prayer frequency options
  const prayerFrequencyOptions = [
    { value: 'five_times', label: '5 Times Daily', description: 'All obligatory prayers' },
    { value: 'sometimes', label: 'Sometimes', description: 'Pray when possible' },
    { value: 'friday_only', label: 'Fridays Only', description: 'Jumu\'ah prayers' },
    { value: 'rarely', label: 'Rarely', description: 'Occasionally pray' },
    { value: 'learning', label: 'Learning', description: 'Learning to pray' },
  ];

  // Hijab preference options (for both genders)
  const hijabPreferenceOptions = [
    { value: 'always', label: 'Always', description: gender === 'male' ? 'Prefer partner always wears hijab' : 'I always wear hijab' },
    { value: 'sometimes', label: 'Sometimes', description: gender === 'male' ? 'Sometimes hijab is fine' : 'I sometimes wear hijab' },
    { value: 'special_occasions', label: 'Special Occasions', description: 'During prayers and special events' },
    { value: 'personal_choice', label: 'Personal Choice', description: 'Respect individual choice' },
    { value: 'no_preference', label: 'No Preference', description: 'No specific preference' },
  ];

  // Living arrangement options
  const livingArrangementOptions = [
    { value: 'separate_homes', label: 'Separate Homes', description: 'Each wife has separate house' },
    { value: 'same_home_separate_quarters', label: 'Separate Quarters', description: 'Same house, separate living spaces' },
    { value: 'shared_home', label: 'Shared Home', description: 'Shared living spaces' },
    { value: 'flexible', label: 'Flexible', description: 'Open to different arrangements' },
  ];

  const handleSubmit = () => {
    // Validate required fields
    if (!preferences.marriageIntention || !preferences.religionLevel) {
      Alert.alert('Incomplete Information', 'Please fill in all required fields.');
      return;
    }

    // Validate marriage type for women accepting polygamy
    if (gender === 'female' && 
        preferences.marriageIntention === 'accepting_polygamy' && 
        (!preferences.seekingMarriageType || preferences.seekingMarriageType.length === 0)) {
      Alert.alert('Marriage Type Required', 'Please select which marriage positions you would accept.');
      return;
    }

    // Validate max wives for men seeking polygamy
    if (gender === 'male' && 
        preferences.marriageIntention === 'polygamous' && 
        !preferences.maxWives) {
      Alert.alert('Max Wives Required', 'Please specify the maximum number of wives you desire.');
      return;
    }

    onSubmit?.();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Marriage Intentions Section */}
      <SectionHeader 
        title="Marriage Intentions" 
        subtitle="What type of marriage are you seeking?"
        icon="heart"
      />
      
      <OptionSelector
        title="Marriage Preference *"
        options={marriageIntentionOptions}
        selectedValue={preferences.marriageIntention}
        onSelect={(value) => updatePreference('marriageIntention', value as MarriageIntention)}
      />

      {/* For women accepting polygamy */}
      {gender === 'female' && preferences.marriageIntention === 'accepting_polygamy' && (
        <OptionSelector
          title="Marriage Position *"
          options={marriageTypeOptions}
          selectedValues={preferences.seekingMarriageType || []}
          onSelect={(value) => handleMultiSelect('seekingMarriageType', value)}
          multiSelect
        />
      )}

      {/* For men seeking polygamy */}
      {gender === 'male' && preferences.marriageIntention === 'polygamous' && (
        <>
          <View style={styles.numberSelector}>
            <Text style={styles.optionTitle}>Current Number of Wives</Text>
            <View style={styles.numberButtons}>
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

          <View style={styles.numberSelector}>
            <Text style={styles.optionTitle}>Maximum Number of Wives *</Text>
            <View style={styles.numberButtons}>
              {[1, 2, 3, 4].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.numberButton,
                    preferences.maxWives === num && styles.numberButtonSelected
                  ]}
                  onPress={() => updatePreference('maxWives', num)}
                >
                  <Text style={[
                    styles.numberButtonText,
                    preferences.maxWives === num && styles.numberButtonTextSelected
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <OptionSelector
            title="Preferred Living Arrangement"
            options={livingArrangementOptions}
            selectedValue={preferences.familyLivingArrangement}
            onSelect={(value) => updatePreference('familyLivingArrangement', value as any)}
          />
        </>
      )}

      {/* Religious Practice Section */}
      <SectionHeader 
        title="Religious Practice" 
        subtitle="Share your level of Islamic practice"
        icon="moon"
      />
      
      <OptionSelector
        title="Religion Level *"
        options={religionLevelOptions}
        selectedValue={preferences.religionLevel}
        onSelect={(value) => updatePreference('religionLevel', value as ReligionLevel)}
      />

      <OptionSelector
        title="Madhab School"
        options={madhahOptions}
        selectedValue={preferences.madhahSchool}
        onSelect={(value) => updatePreference('madhahSchool', value as MadhahSchool)}
      />

      <OptionSelector
        title="Prayer Frequency"
        options={prayerFrequencyOptions}
        selectedValue={preferences.prayerFrequency}
        onSelect={(value) => updatePreference('prayerFrequency', value as PrayerFrequency)}
      />

      <ToggleSwitch
        title="Quran Reading"
        subtitle="Do you read the Quran regularly?"
        value={preferences.quranReading || false}
        onToggle={(value) => updatePreference('quranReading', value)}
      />

      <ToggleSwitch
        title="Islamic Education"
        subtitle="Have you studied Islamic sciences?"
        value={preferences.islamicEducation || false}
        onToggle={(value) => updatePreference('islamicEducation', value)}
      />

      {/* Lifestyle Section */}
      <SectionHeader 
        title="Lifestyle Preferences" 
        subtitle="Your personal lifestyle choices"
        icon="home"
      />

      <OptionSelector
        title={gender === 'male' ? "Hijab Preference for Partner" : "Hijab Practice"}
        options={hijabPreferenceOptions}
        selectedValue={preferences.hijabPreference}
        onSelect={(value) => updatePreference('hijabPreference', value as HijabPreference)}
      />

      <ToggleSwitch
        title="Halaal Diet"
        subtitle="Do you follow a halaal diet?"
        value={preferences.halaalDiet || false}
        onToggle={(value) => updatePreference('halaalDiet', value)}
      />

      <ToggleSwitch
        title="Smoking"
        subtitle="Do you smoke?"
        value={preferences.smoking || false}
        onToggle={(value) => updatePreference('smoking', value)}
      />

      <ToggleSwitch
        title="Want Children"
        subtitle="Do you want to have children?"
        value={preferences.wantsChildren || false}
        onToggle={(value) => updatePreference('wantsChildren', value)}
      />

      <ToggleSwitch
        title="Have Children"
        subtitle="Do you currently have children?"
        value={preferences.hasChildren || false}
        onToggle={(value) => updatePreference('hasChildren', value)}
      />

      {preferences.hasChildren && (
        <View style={styles.numberSelector}>
          <Text style={styles.optionTitle}>Number of Children</Text>
          <View style={styles.numberButtons}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.numberButton,
                  preferences.numberOfChildren === num && styles.numberButtonSelected
                ]}
                onPress={() => updatePreference('numberOfChildren', num)}
              >
                <Text style={[
                  styles.numberButtonText,
                  preferences.numberOfChildren === num && styles.numberButtonTextSelected
                ]}>
                  {num}{num === 6 ? '+' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Submit Button */}
      {onSubmit && (
        <View style={styles.submitContainer}>
          <Button
            title="Continue"
            filled
            onPress={handleSubmit}
            isLoading={isLoading}
            style={styles.submitButton}
          />
        </View>
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: getResponsiveSpacing(24),
    marginBottom: getResponsiveSpacing(16),
    paddingHorizontal: getResponsiveSpacing(16),
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionHeaderText: {
    marginLeft: getResponsiveSpacing(12),
    flex: 1,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'semiBold',
    color: COLORS.black,
  },
  sectionSubtitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
    marginTop: 2,
  },
  optionSelector: {
    marginBottom: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(16),
  },
  optionTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(12),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -getResponsiveSpacing(4),
  },
  optionButton: {
    backgroundColor: COLORS.gray6,
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(12),
    borderRadius: 25,
    margin: getResponsiveSpacing(4),
    borderWidth: 1,
    borderColor: COLORS.gray6,
    minWidth: isMobileWeb() ? 120 : 140,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'medium',
    color: COLORS.black,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: COLORS.white,
  },
  optionDescription: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray7,
  },
  toggleLeft: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.black,
  },
  toggleSubtitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray6,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  numberSelector: {
    marginBottom: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(16),
  },
  numberButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -getResponsiveSpacing(4),
  },
  numberButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gray6,
    justifyContent: 'center',
    alignItems: 'center',
    margin: getResponsiveSpacing(4),
    borderWidth: 1,
    borderColor: COLORS.gray6,
  },
  numberButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  numberButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.black,
  },
  numberButtonTextSelected: {
    color: COLORS.white,
  },
  submitContainer: {
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(24),
  },
  submitButton: {
    borderRadius: 30,
  },
});

export default IslamicPreferencesForm;
