import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { COLORS, SIZES, FONTS, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigation } from 'expo-router';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import PersonalDetailsService, { PersonalDetails, UpdatePersonalDetailsData } from '../src/services/personalDetails.service';
import { getResponsiveFontSize, getResponsiveSpacing } from '../utils/responsive';
import { useTranslation } from 'react-i18next';

// Cache for personal details to prevent reloading
let cachedPersonalDetails: PersonalDetails | null = null;
let personalDetailsLoadTime = 0;
const PERSONAL_DETAILS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Personal Details Screen
const PersonalDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { t } = useTranslation();
  
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
  const hairColorOptions = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Red', 'Gray', 'White', 'Other'];
  const skinToneOptions = ['Very Fair', 'Fair', 'Medium', 'Olive', 'Brown', 'Dark'];
  const bodyTypeOptionsAll = {
    male: ['Slim', 'Average', 'Athletic', 'Heavy Set', 'Muscular'],
    female: ['Slim', 'Average', 'Athletic', 'Curvy', 'Plus Size']
  } as const;
  
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
  const prayerFrequencyOptions = ['All 5 Daily Prayers', '5 Times Daily', 'Regularly', 'Sometimes', 'Rarely', 'Never'];
  const quranReadingOptions = ['Memorized Significant Portions', 'Read Fluently', 'Read with Help', 'Learning to Read', 'Cannot Read Arabic'];

  // Load personal details on component mount
  useEffect(() => {
    loadPersonalDetails();
  }, []);

  // Ensure latest values if gender or profile changed elsewhere (e.g., Edit Profile)
  useFocusEffect(
    React.useCallback(() => {
      loadPersonalDetails(true);
    }, [])
  );

  const loadPersonalDetails = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first unless force refresh
      if (!forceRefresh && cachedPersonalDetails && (Date.now() - personalDetailsLoadTime) < PERSONAL_DETAILS_CACHE_TTL) {
        const details = cachedPersonalDetails;
        setPersonalDetails(details);
        populateFormFields(details);
        setIsLoading(false);
        return;
      }
      
      const details = await PersonalDetailsService.getCurrentUserPersonalDetails();
      
      if (details) {
        // Cache the data
        cachedPersonalDetails = details;
        personalDetailsLoadTime = Date.now();
        
        setPersonalDetails(details);
        populateFormFields(details);
      }
    } catch (error) {
      setError(t('personal_details.load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to populate form fields
  const populateFormFields = (details: PersonalDetails) => {
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
  };

  const validateForm = (): boolean => {
    // Basic validation - can be enhanced
    if (!personalDetails) {
      Alert.alert(t('common.error'), t('personal_details.no_profile_data'));
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
      
      // Clear cache to force refresh on next load
      cachedPersonalDetails = null;
      
      Alert.alert(
        t('common.success'), 
        t('personal_details.update_success'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      setError(t('personal_details.update_error'));
      Alert.alert(t('common.error'), t('personal_details.update_error_retry'));
    } finally {
      setIsSaving(false);
    }
  };

  // Normalize and map chip option label/value to i18n key suffix
  const normalizeToKey = (raw: string): string => {
    const s = raw.toString().trim().toLowerCase();
    const synonyms: Record<string, string> = {
      'light brown': 'light_brown',
      'dark brown': 'dark_brown',
      'very fair': 'very_fair',
      'very dark': 'very_dark',
      'all 5 daily prayers': 'all_5',
      '5 times daily': 'all_5',
      'regularly': 'most',
      'sometimes': 'some',
      'rarely': 'occasionally',
      'memorized significant portions': 'memorized',
      'read fluently': 'fluent',
      'read with help': 'with_help',
      'learning to read': 'learning',
      'cannot read arabic': 'cannot_read',
      'living with parents': 'with_parents',
      'living alone': 'alone',
      'living with children': 'with_children',
      'living_with_parents': 'with_parents',
      'living_alone': 'alone',
      'living_with_children': 'with_children',
      'shared accommodation': 'shared',
      'own house': 'own_house',
      'own apartment': 'own_apartment',
      'rent apartment': 'rent_apartment',
      'rent house': 'rent_house',
      'mustache only': 'mustache',
      'clean shaven': 'clean',
      'very religious': 'very_religious',
      'moderately religious': 'moderate',
      'somewhat religious': 'somewhat',
      'not very religious': 'not_very_religious',
      'plus size': 'plus_size',
      'heavy set': 'heavy_set',
      "bachelor's degree": 'bachelor',
      "masters degree": 'master',
      "master's degree": 'master',
      'associate degree': 'associate_degree'
    };
    if (synonyms[s]) return synonyms[s];
    return s.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  };

  const resolveOptionLabel = (
    translationCategoryKey: string | undefined,
    option: string | { label: string; value: string }
  ): string => {
    const isObject = typeof option === 'object';
    const original = isObject ? option.label : option;
    if (!translationCategoryKey) return original;
    // Prefer value when present, otherwise derive from label
    const rawKeySource = isObject ? option.value : original;
    const key = normalizeToKey(rawKeySource);
    const i18nKey = `${translationCategoryKey}.${key}`;
    const translated = t(i18nKey);
    // If no translation found, fall back to original
    if (translated === i18nKey) return original;
    return translated;
  };

  // Helper function for dropdown selector
  const renderDropdownSelector = (
    title: string,
    options: string[] | { label: string; value: string }[],
    selectedValue: string | undefined,
    onSelect: (value: string) => void,
    required = false,
    translationCategoryKey?: string
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title} {required && '*'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        {options.map((option) => {
          const isObject = typeof option === 'object';
          const optionValue = isObject ? (option as any).value : option;
          const optionLabel = resolveOptionLabel(translationCategoryKey, option as any);
          const normSel = (selectedValue || '').toString().trim().toLowerCase();
          const isSelected = normSel.length > 0 && (
            normSel === optionValue.toString().trim().toLowerCase() ||
            normSel === (isObject ? (option as any).label : option).toString().trim().toLowerCase()
          );
          return (
            <TouchableOpacity
              key={optionValue}
              style={[
                styles.optionChip,
                isSelected && styles.optionChipSelected
              ]}
              onPress={() => onSelect(optionValue as string)}
            >
              <Text style={[
                styles.optionChipText,
                isSelected && styles.optionChipTextSelected
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
    horizontal = false,
    translationCategoryKey?: string
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title}</Text>
      <Text style={styles.multiSelectNote}>{t('profile_setup.languages_note')}</Text>
      {horizontal ? (
        <View style={styles.horizontalMultiSelect}>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const display = resolveOptionLabel(translationCategoryKey, option);
            
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
                  {display}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          const display = resolveOptionLabel(translationCategoryKey, option);
          
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
                {display}
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
          <Text style={styles.loadingText}>{t('personal_details.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header title={t('personal_details.title')} />
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
          {/* About Me Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('personal_details.about_me')}</Text>
            <Text style={styles.sectionSubtitle}>{t('personal_details.about_subtitle')}</Text>
            
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder={t('personal_details.about_placeholder')}
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
            <Text style={styles.sectionTitle}>{t('personal_details.physical_title')}</Text>
            <Text style={styles.sectionSubtitle}>{t('personal_details.physical_subtitle')}</Text>
            
            <View style={styles.formRow}>
              <View style={styles.halfInput}>
                <Input
                  id="height"
                  placeholder={t('personal_details.height_placeholder')}
                  value={height}
                  onInputChanged={(id, value) => setHeight(value)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  id="weight"
                  placeholder={t('personal_details.weight_placeholder')}
                  value={weight}
                  onInputChanged={(id, value) => setWeight(value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {renderDropdownSelector(t('profile_setup.eye_color'), eyeColorOptions, eyeColor, setEyeColor, false, 'profile_setup.options.eye_color')}
            {renderDropdownSelector(t('profile_setup.hair_color'), hairColorOptions, hairColor, setHairColor, false, 'profile_setup.options.hair_color')}
            {renderDropdownSelector(t('profile_setup.skin_color'), skinToneOptions, skinTone, setSkinTone, false, 'profile_setup.options.skin_color')}
            {renderDropdownSelector(
              t('profile_setup.body_type'),
              (personalDetails?.gender === 'female' ? bodyTypeOptionsAll.female : bodyTypeOptionsAll.male),
              bodyType,
              setBodyType,
              true,
              'profile_setup.options.body_type'
            )}
          </View>

          {/* Lifestyle & Work Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('personal_details.lifestyle_title')}</Text>
            <Text style={styles.sectionSubtitle}>{t('personal_details.lifestyle_subtitle')}</Text>

            {renderDropdownSelector(t('profile_setup.education_level'), educationOptions, education, setEducation, true, 'profile_setup.options.education')}

            {renderMultiSelect(
              t('profile_setup.languages_spoken'), 
              languageOptions, 
              languages, 
              (selectedLanguage) => {
                const updatedLanguages = languages.includes(selectedLanguage)
                  ? languages.filter(lang => lang !== selectedLanguage)
                  : [...languages, selectedLanguage];
                setLanguages(updatedLanguages);
              },
              true,
              'profile_setup.options.languages'
            )}

            {/* Gender-specific fields */}
            {personalDetails?.gender === 'male' && (
              <>
                <Input
                  id="occupation"
                  placeholder={t('personal_details.occupation_placeholder')}
                  value={occupation}
                  onInputChanged={(id, value) => setOccupation(value)}
                />
                <Input
                  id="income"
                  placeholder={t('personal_details.income_placeholder')}
                  value={income}
                  onInputChanged={(id, value) => setIncome(value)}
                />
                {renderDropdownSelector(t('profile_setup.social_condition'), socialConditionOptions, socialCondition, setSocialCondition, true, 'profile_setup.options.social_condition')}
              </>
            )}

            {personalDetails?.gender === 'female' && (
              <>
                {renderDropdownSelector(t('profile_setup.work_status'), workStatusOptions, workStatus, setWorkStatus, true, 'profile_setup.options.work_status')}
                {workStatus === 'working' && (
                  <Input
                    id="occupation"
                    placeholder={t('personal_details.occupation_optional')}
                    value={occupation}
                    onInputChanged={(id, value) => setOccupation(value)}
                  />
                )}
              </>
            )}

            {renderDropdownSelector(t('profile_setup.housing_type'), housingOptions, housingType, setHousingType, true, 'profile_setup.options.housing')}
            {renderDropdownSelector(t('profile_setup.living_condition'), 
              personalDetails?.gender === 'male' ? livingConditionOptions.male : livingConditionOptions.female, 
              livingCondition, setLivingCondition, true, 'profile_setup.options.living'
            )}
          </View>

          {/* Religious Commitment Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('profile_setup.religious_title')}</Text>
            <Text style={styles.sectionSubtitle}>{t('profile_setup.religious_subtitle')}</Text>

            {renderDropdownSelector(t('profile_setup.religious_level'), religiousLevelOptions, religiousLevel, setReligiousLevel, true, 'profile_setup.options.religious_level')}
            {renderDropdownSelector(t('profile_setup.prayer_frequency'), prayerFrequencyOptions, prayerFrequency, setPrayerFrequency, true, 'profile_setup.options.prayer_frequency')}
            {renderDropdownSelector(t('profile_setup.quran_level'), quranReadingOptions, quranReading, setQuranReading, true, 'profile_setup.options.quran')}

            {personalDetails?.gender === 'female' && (
              renderDropdownSelector(t('profile_setup.covering_level'), coveringLevelOptions, coveringLevel, setCoveringLevel, true, 'profile_setup.options.covering')
            )}

            {personalDetails?.gender === 'male' && (
              renderDropdownSelector(t('profile_setup.beard_practice'), ['Full Beard', 'Trimmed Beard', 'Mustache Only', 'Clean Shaven'], beardPractice, setBeardPractice, false, 'profile_setup.options.beard')
            )}
          </View>

          {/* Marriage Intentions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('profile_setup.polygamy_title')}</Text>
            <Text style={styles.sectionSubtitle}>
              {personalDetails?.gender === 'male' 
                ? t('profile_setup.polygamy_subtitle_male') 
                : t('profile_setup.polygamy_subtitle_female')
              }
            </Text>

            {personalDetails?.gender === 'male' ? (
              <View style={styles.polygamySection}>
                <Text style={styles.polygamyTitle}>{t('profile_setup.looking_for_which_wife')}</Text>
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
                          {index === 0 ? t('profile_setup.second_wife') : index === 1 ? t('profile_setup.third_wife') : t('profile_setup.fourth_wife')}
                        </Text>
                        <Text style={[
                          styles.optionDescription,
                          seekingWifeNumber === value && styles.optionDescriptionSelected
                        ]}>
                          {t('profile_setup.currently_have', { count: index + 1, plural: index > 0 ? 's' : '' })}
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
                <Text style={styles.polygamyTitle}>{t('profile_setup.positions_accept')}</Text>
                <Text style={styles.polygamyNote}>
                  {t('profile_setup.positions_note')}
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
                          {index === 0 ? t('profile_setup.second_wife') : index === 1 ? t('profile_setup.third_wife') : t('profile_setup.fourth_wife')}
                        </Text>
                        <Text style={[
                          styles.optionDescription,
                          isSelected && styles.optionDescriptionSelected
                        ]}>
                          {t('profile_setup.accept_being', { position: (index === 0 ? t('profile_setup.second_wife') : index === 1 ? t('profile_setup.third_wife') : t('profile_setup.fourth_wife')).toLowerCase() })}
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
          title={isSaving ? t('personal_details.updating') : t('personal_details.update_button')}
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
