import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { COLORS, SIZES, FONTS, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import PersonalDetailsService, { PersonalDetails, UpdatePersonalDetailsData } from '../src/services/personalDetails.service';
import { getResponsiveFontSize, getResponsiveSpacing } from '../utils/responsive';

// Personal Details Screen
const PersonalDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile data
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null);
  
  // About Me
  const [aboutMe, setAboutMe] = useState('');
  
  // Physical Details
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [skinTone, setSkinTone] = useState('');
  const [bodyType, setBodyType] = useState('');
  
  // Lifestyle & Work
  const [education, setEducation] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [occupation, setOccupation] = useState('');
  const [income, setIncome] = useState('');
  const [housingType, setHousingType] = useState('');
  const [livingCondition, setLivingCondition] = useState('');
  const [socialCondition, setSocialCondition] = useState(''); // For males
  const [workStatus, setWorkStatus] = useState(''); // For females
  
  // Religious Commitment
  const [religiousLevel, setReligiousLevel] = useState('');
  const [prayerFrequency, setPrayerFrequency] = useState('');
  const [quranReading, setQuranReading] = useState('');
  const [coveringLevel, setCoveringLevel] = useState(''); // For females
  const [beardPractice, setBeardPractice] = useState(''); // For males
  
  // Marriage Intentions
  const [seekingWifeNumber, setSeekingWifeNumber] = useState(''); // For males
  const [acceptedWifePositions, setAcceptedWifePositions] = useState<string[]>([]); // For females
  const [polygamyPreference, setPolygamyPreference] = useState('');

  // Options arrays (matching profile setup)
  const eyeColorOptions = ['Brown', 'Black', 'Blue', 'Green', 'Hazel', 'Gray', 'Other'];
  const hairColorOptions = ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Other'];
  const skinToneOptions = ['Very Fair', 'Fair', 'Medium', 'Olive', 'Brown', 'Dark'];
  const bodyTypeOptions = ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size', 'Muscular'];
  
  const educationOptions = ['High School', 'Some College', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'Doctorate', 'Trade School', 'Other'];
  const languageOptions = [
    { label: 'Arabic', value: 'Arabic' },
    { label: 'English', value: 'English' },
    { label: 'Turkish', value: 'Turkish' },
    { label: 'Russian', value: 'Russian' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'French', value: 'French' },
    { label: 'Urdu', value: 'Urdu' }
  ];
  const housingOptions = ['Own House', 'Rent Apartment', 'Family Home', 'Shared Accommodation', 'Other'];
  
  const livingConditionOptions = {
    male: [
      { label: 'Living with Parents', value: 'living_with_parents' },
      { label: 'Living Alone', value: 'living_alone' },
      { label: 'Living with Children', value: 'living_with_children' }
    ],
    female: [
      { label: 'Living with Parents', value: 'living_with_parents' },
      { label: 'Living Alone', value: 'living_alone' },
      { label: 'Living with Children', value: 'living_with_children' }
    ]
  };
  
  const socialConditionOptions = [
    { label: 'Sufficient', value: 'sufficient' },
    { label: 'Rich', value: 'rich' },
    { label: 'Very Rich', value: 'very_rich' }
  ];
  
  const workStatusOptions = [
    { label: 'Working', value: 'working' },
    { label: 'Not Working', value: 'not_working' }
  ];
  
  const coveringLevelOptions = [
    { label: 'Will Cover', value: 'will_cover' },
    { label: 'Hijab', value: 'hijab' },
    { label: 'Niqab', value: 'niqab' }
  ];
  
  const religiousLevelOptions = ['Very Religious', 'Religious', 'Moderately Religious', 'Somewhat Religious', 'Not Very Religious'];
  const prayerFrequencyOptions = ['5 Times Daily', 'Regularly', 'Sometimes', 'Rarely', 'Never'];
  const quranReadingOptions = ['Memorized Significant Portions', 'Read Fluently', 'Read with Help', 'Learning to Read', 'Cannot Read Arabic'];

  // Load personal details on component mount
  useEffect(() => {
    loadPersonalDetails();
  }, []);

  const loadPersonalDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const details = await PersonalDetailsService.getCurrentUserPersonalDetails();
      
      if (details) {
        setPersonalDetails(details);
        
        // Populate form fields with existing data
        setAboutMe(details.about_me || '');
        setHeight(details.height_cm?.toString() || '');
        setWeight(details.weight_kg?.toString() || '');
        setEyeColor(details.eye_color || '');
        setHairColor(details.hair_color || '');
        setSkinTone(details.skin_tone || '');
        setBodyType(details.body_type || '');
        
        setEducation(details.education_level || '');
        setLanguages(details.languages_spoken || []);
        setOccupation(details.occupation || '');
        setIncome(details.monthly_income || '');
        setHousingType(details.housing_type || '');
        setLivingCondition(details.living_condition || '');
        setSocialCondition(details.social_condition || '');
        setWorkStatus(details.work_status || '');
        
        setReligiousLevel(details.religious_level || '');
        setPrayerFrequency(details.prayer_frequency || '');
        setQuranReading(details.quran_reading_level || '');
        setCoveringLevel(details.covering_level || '');
        setBeardPractice(details.beard_practice || '');
        
        setSeekingWifeNumber(details.seeking_wife_number || '');
        setAcceptedWifePositions(details.accepted_wife_positions || []);
        setPolygamyPreference(details.polygamy_preference || '');
      }
    } catch (error) {
      console.error('Failed to load personal details:', error);
      setError('Failed to load personal details');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    // Basic validation - can be enhanced
    if (!personalDetails) {
      Alert.alert('Error', 'No profile data found');
      return false;
    }
    
    return true;
  };

  const savePersonalDetails = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Prepare update data
      const updateData: UpdatePersonalDetailsData = {
        // About Me
        about_me: aboutMe.trim(),
        
        // Physical Details
        height_cm: height ? parseInt(height) : undefined,
        weight_kg: weight ? parseInt(weight) : undefined,
        eye_color: eyeColor || undefined,
        hair_color: hairColor || undefined,
        skin_tone: skinTone || undefined,
        body_type: bodyType || undefined,
        
        // Lifestyle & Work
        education_level: education || undefined,
        languages_spoken: languages.length > 0 ? languages : undefined,
        occupation: occupation || undefined,
        monthly_income: income || undefined,
        housing_type: housingType || undefined,
        living_condition: livingCondition || undefined,
        social_condition: socialCondition || undefined,
        work_status: workStatus || undefined,
        
        // Religious Commitment
        religious_level: religiousLevel || undefined,
        prayer_frequency: prayerFrequency || undefined,
        quran_reading_level: quranReading || undefined,
        covering_level: coveringLevel || undefined,
        beard_practice: beardPractice || undefined,
        
        // Marriage Intentions
        seeking_wife_number: seekingWifeNumber || undefined,
        accepted_wife_positions: acceptedWifePositions.length > 0 ? acceptedWifePositions : undefined,
        polygamy_preference: polygamyPreference || undefined,
      };
      
      // Update personal details in database
      await PersonalDetailsService.updatePersonalDetails(updateData);
      
      Alert.alert(
        'Success', 
        'Personal details updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      console.error('Save personal details error:', error);
      setError('Failed to update personal details');
      Alert.alert('Error', 'Failed to update personal details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function for dropdown selector
  const renderDropdownSelector = (
    title: string,
    options: string[] | { label: string; value: string }[],
    selectedValue: string | undefined,
    onSelect: (value: string) => void,
    required = false
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title} {required && '*'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        {options.map((option) => {
          const isObject = typeof option === 'object';
          const optionValue = isObject ? option.value : option;
          const optionLabel = isObject ? option.label : option;
          
          return (
            <TouchableOpacity
              key={optionValue}
              style={[
                styles.optionChip,
                selectedValue === optionValue && styles.optionChipSelected
              ]}
              onPress={() => onSelect(optionValue)}
            >
              <Text style={[
                styles.optionChipText,
                selectedValue === optionValue && styles.optionChipTextSelected
              ]}>
                {optionLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Helper function for multi-select (for languages and female polygamy preferences)
  const renderMultiSelect = (
    title: string,
    options: { label: string; value: string }[],
    selectedValues: string[],
    onToggle: (value: string) => void,
    horizontal = false
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title}</Text>
      <Text style={styles.multiSelectNote}>You can select multiple options</Text>
      {horizontal ? (
        <View style={styles.horizontalMultiSelect}>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionChip,
                  isSelected && styles.optionChipSelected
                ]}
                onPress={() => onToggle(option.value)}
              >
                <Text style={[
                  styles.optionChipText,
                  isSelected && styles.optionChipTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.multiSelectOption,
                isSelected && styles.multiSelectOptionSelected
              ]}
              onPress={() => onToggle(option.value)}
            >
              <Text style={[
                styles.multiSelectOptionText,
                isSelected && styles.multiSelectOptionTextSelected
              ]}>
                {option.label}
              </Text>
              {isSelected && (
                <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
          );
        })
      )}
      {selectedValues.length > 0 && (
        <Text style={styles.selectedCount}>
          {selectedValues.length} selected
        </Text>
      )}
    </View>
  );

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading personal details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header title="Personal Details" />
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
          {/* About Me Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.sectionSubtitle}>Tell others about yourself</Text>
            
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Share a bit about yourself, your interests, and what you're looking for..."
                value={aboutMe}
                onChangeText={setAboutMe}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Physical Details Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Physical Details</Text>
            <Text style={styles.sectionSubtitle}>Tell us about your physical characteristics</Text>
            
            <View style={styles.formRow}>
              <View style={styles.halfInput}>
                <Input
                  id="height"
                  placeholder="Height (cm)"
                  value={height}
                  onInputChanged={(id, value) => setHeight(value)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  id="weight"
                  placeholder="Weight (kg)"
                  value={weight}
                  onInputChanged={(id, value) => setWeight(value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {renderDropdownSelector('Eye Color', eyeColorOptions, eyeColor, setEyeColor)}
            {renderDropdownSelector('Hair Color', hairColorOptions, hairColor, setHairColor)}
            {renderDropdownSelector('Skin Tone', skinToneOptions, skinTone, setSkinTone)}
            {renderDropdownSelector('Body Type', bodyTypeOptions, bodyType, setBodyType, true)}
          </View>

          {/* Lifestyle & Work Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Lifestyle & Work</Text>
            <Text style={styles.sectionSubtitle}>Tell us about your life and career</Text>

            {renderDropdownSelector('Education Level', educationOptions, education, setEducation, true)}

            {renderMultiSelect(
              'Languages Spoken', 
              languageOptions, 
              languages, 
              (selectedLanguage) => {
                const updatedLanguages = languages.includes(selectedLanguage)
                  ? languages.filter(lang => lang !== selectedLanguage)
                  : [...languages, selectedLanguage];
                setLanguages(updatedLanguages);
              },
              true
            )}

            {/* Gender-specific fields */}
            {personalDetails?.gender === 'male' && (
              <>
                <Input
                  id="occupation"
                  placeholder="Occupation/Work *"
                  value={occupation}
                  onInputChanged={(id, value) => setOccupation(value)}
                />
                <Input
                  id="income"
                  placeholder="Monthly Income (Optional)"
                  value={income}
                  onInputChanged={(id, value) => setIncome(value)}
                />
                {renderDropdownSelector('Social Condition', socialConditionOptions, socialCondition, setSocialCondition, true)}
              </>
            )}

            {personalDetails?.gender === 'female' && (
              <>
                {renderDropdownSelector('Work Status', workStatusOptions, workStatus, setWorkStatus, true)}
                {workStatus === 'working' && (
                  <Input
                    id="occupation"
                    placeholder="Occupation (Optional)"
                    value={occupation}
                    onInputChanged={(id, value) => setOccupation(value)}
                  />
                )}
              </>
            )}

            {renderDropdownSelector('Housing Type', housingOptions, housingType, setHousingType, true)}
            {renderDropdownSelector('Living Condition', 
              personalDetails?.gender === 'male' ? livingConditionOptions.male : livingConditionOptions.female, 
              livingCondition, setLivingCondition, true
            )}
          </View>

          {/* Religious Commitment Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Religious Commitment</Text>
            <Text style={styles.sectionSubtitle}>Share your Islamic practices and beliefs</Text>

            {renderDropdownSelector('Religious Level', religiousLevelOptions, religiousLevel, setReligiousLevel, true)}
            {renderDropdownSelector('Prayer Frequency', prayerFrequencyOptions, prayerFrequency, setPrayerFrequency, true)}
            {renderDropdownSelector('Quran Reading Level', quranReadingOptions, quranReading, setQuranReading, true)}

            {personalDetails?.gender === 'female' && (
              renderDropdownSelector('Covering Level', coveringLevelOptions, coveringLevel, setCoveringLevel, true)
            )}

            {personalDetails?.gender === 'male' && (
              renderDropdownSelector('Beard Practice', ['Full Beard', 'Trimmed Beard', 'Mustache Only', 'Clean Shaven'], beardPractice, setBeardPractice)
            )}
          </View>

          {/* Marriage Intentions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Marriage Intentions</Text>
            <Text style={styles.sectionSubtitle}>
              {personalDetails?.gender === 'male' 
                ? 'Which wife number are you looking for?' 
                : 'Which positions would you accept in a polygamous marriage?'
              }
            </Text>

            {personalDetails?.gender === 'male' ? (
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
                        seekingWifeNumber === value && styles.polygamyOptionSelected
                      ]}
                      onPress={() => setSeekingWifeNumber(value)}
                    >
                      <View style={styles.optionContent}>
                        <Text style={[
                          styles.optionLabel,
                          seekingWifeNumber === value && styles.optionLabelSelected
                        ]}>
                          {option}
                        </Text>
                        <Text style={[
                          styles.optionDescription,
                          seekingWifeNumber === value && styles.optionDescriptionSelected
                        ]}>
                          Currently have {index + 1} wife{index > 0 ? 's' : ''}
                        </Text>
                      </View>
                      {seekingWifeNumber === value && (
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
                  const isSelected = acceptedWifePositions.includes(value);
                  
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.polygamyOption,
                        isSelected && styles.polygamyOptionSelected
                      ]}
                      onPress={() => {
                        const updated = isSelected 
                          ? acceptedWifePositions.filter(v => v !== value)
                          : [...acceptedWifePositions, value];
                        setAcceptedWifePositions(updated);
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
          </View>

          {/* Bottom spacing for button */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
      
      {/* Update Button */}
      <View style={styles.bottomContainer}>
        <Button
          title={isSaving ? "Updating..." : "Update Personal Details"}
          filled
          style={styles.updateButton}
          onPress={savePersonalDetails}
          disabled={isSaving}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  textAreaContainer: {
    marginBottom: getResponsiveSpacing(20),
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.greyscale500,
    backgroundColor: COLORS.greyscale500,
    borderRadius: 12,
    padding: getResponsiveSpacing(16),
    minHeight: 120,
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.black,
    textAlignVertical: 'top',
  },
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white
  },
  scrollContainer: {
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.gray,
  },
  errorContainer: {
    backgroundColor: COLORS.red + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    fontFamily: 'regular',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: getResponsiveSpacing(32),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(22),
    fontFamily: 'bold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(8),
  },
  sectionSubtitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    marginBottom: getResponsiveSpacing(20),
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSpacing(16),
  },
  halfInput: {
    width: (SIZES.width - 48) / 2,
  },
  selectorContainer: {
    marginBottom: getResponsiveSpacing(20),
  },
  selectorTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(12),
  },
  optionsScroll: {
    marginBottom: getResponsiveSpacing(8),
  },
  optionChip: {
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray4,
    backgroundColor: COLORS.white,
    marginRight: getResponsiveSpacing(8),
    marginBottom: getResponsiveSpacing(8),
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
  },
  optionChipTextSelected: {
    color: COLORS.white,
    fontFamily: 'medium',
  },
  multiSelectNote: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'regular',
    color: COLORS.gray,
    marginBottom: getResponsiveSpacing(12),
  },
  horizontalMultiSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing(8),
    marginBottom: getResponsiveSpacing(8),
  },
  selectedCount: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'medium',
    color: COLORS.primary,
    marginTop: getResponsiveSpacing(8),
  },
  multiSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getResponsiveSpacing(16),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray4,
    backgroundColor: COLORS.white,
    marginBottom: getResponsiveSpacing(8),
  },
  multiSelectOptionSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  multiSelectOptionText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.black,
  },
  multiSelectOptionTextSelected: {
    color: COLORS.primary,
    fontFamily: 'medium',
  },
  polygamySection: {
    marginTop: getResponsiveSpacing(16),
  },
  polygamyTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'semibold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(8),
  },
  polygamyNote: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
    marginBottom: getResponsiveSpacing(16),
    lineHeight: 20,
  },
  polygamyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getResponsiveSpacing(16),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray4,
    backgroundColor: COLORS.white,
    marginBottom: getResponsiveSpacing(12),
  },
  polygamyOptionSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semibold',
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
    marginLeft: getResponsiveSpacing(12),
  },
  bottomSpacing: {
    height: getResponsiveSpacing(100),
  },
  bottomContainer: {
    position: "absolute",
    bottom: 32,
    right: 16,
    left: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    width: SIZES.width - 32,
    alignItems: "center"
  },
  updateButton: {
    width: SIZES.width - 32,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
});

export default PersonalDetailsScreen;
