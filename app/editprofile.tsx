import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { COLORS, SIZES, FONTS, icons, images } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { Feather } from "@expo/vector-icons";


import Input from '../components/Input';
import { getFormatedDate } from "react-native-modern-datepicker";
import DatePickerModal from '../components/DatePickerModal';
import Button from '../components/Button';
import SearchableDropdown from '../components/SearchableDropdown';
import { Image } from 'expo-image';
import { useNavigation, router } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import ProfileService, { UserProfile, UpdateProfileData } from '../src/services/profile.service';
import { phoneCodesData } from '../data/phoneCodes';
import SimpleAvatar from '../components/SimpleAvatar';
import { supabase } from '../src/config/supabase';
import { getCountriesAsDropdownItems, getCitiesForCountry } from '../data/countries';
import type { GenderType } from '../src/types/database.types';
import { useTranslation } from 'react-i18next';

// Cache for profile data
let cachedUserProfile: UserProfile | null = null;
let userProfileLoadTime = 0;
const USER_PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Edit Profile Screen
const EditProfile = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { t } = useTranslation();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile data
  const [profileImage, setProfileImage] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [occupation, setOccupation] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedGender, setSelectedGender] = useState<GenderType | ''>('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [availableCities, setAvailableCities] = useState<{label: string; value: string}[]>([]);
  
  // UI states
  const [openDatePicker, setOpenDatePicker] = useState(false);

  const genderOptions = [
    { label: t('profile_setup.male'), value: 'male' },
    { label: t('profile_setup.female'), value: 'female' },
  ];

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first unless force refresh
      if (!forceRefresh && cachedUserProfile && (Date.now() - userProfileLoadTime) < USER_PROFILE_CACHE_TTL) {
        const userProfile = cachedUserProfile;
        populateProfileFields(userProfile);
        setIsLoading(false);
        return;
      }
      
      const userProfile = await ProfileService.getCurrentUserProfile();
      
      if (userProfile) {
        // Cache the data
        cachedUserProfile = userProfile;
        userProfileLoadTime = Date.now();
        
        populateProfileFields(userProfile);
      }
    } catch (error) {
      setError(t('edit_profile.load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to populate form fields
  const populateProfileFields = (userProfile: UserProfile) => {
    setFirstName(userProfile.first_name || '');
    setLastName(userProfile.last_name || '');
    setPhoneCode(userProfile.phone_code || '');
    setMobileNumber(userProfile.mobile_number || '');
    setOccupation(userProfile.occupation || '');
    setAboutMe(userProfile.about_me || '');
    setSelectedGender(userProfile.gender || '');
    setSelectedCountry(userProfile.country || '');
    setSelectedCity(userProfile.city || '');
    
    // Format date for display
    if (userProfile.date_of_birth) {
      const date = new Date(userProfile.date_of_birth);
      setDateOfBirth(date.toLocaleDateString('en-GB'));
    }
    
    // Load cities for selected country
    if (userProfile.country) {
      const cities = getCitiesForCountry(userProfile.country);
      setAvailableCities(cities);
    }
  };

  const handleCountryChange = (country: { label: string; value: string }) => {
    setSelectedCountry(country.value);
    
    // Update available cities
    const cities = getCitiesForCountry(country.value);
    setAvailableCities(cities);
    
    // Clear city selection when country changes
    setSelectedCity('');
  };

  const handleDateChange = (date: string) => {
    setDateOfBirth(date);
    setOpenDatePicker(false);
  };

  // Removed pickImage function as it's no longer needed

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      Alert.alert(t('common.error'), t('edit_profile.first_name_required'));
      return false;
    }
    
    if (!selectedGender) {
      Alert.alert(t('common.error'), t('edit_profile.gender_required'));
      return false;
    }
    
    if (!dateOfBirth) {
      Alert.alert(t('common.error'), t('edit_profile.dob_required'));
      return false;
    }
    
    if (mobileNumber && !phoneCode) {
      Alert.alert(t('common.error'), t('edit_profile.phone_code_required'));
      return false;
    }
    
    return true;
  };

  const saveProfile = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Prepare update data
      const updateData: UpdateProfileData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_code: phoneCode,
        mobile_number: mobileNumber.trim(),
        occupation: occupation.trim(),
        about_me: aboutMe.trim(),
        gender: selectedGender as GenderType,
        country: selectedCountry,
        city: selectedCity,
      };
      
      // Convert date format for database
      if (dateOfBirth) {
        const [day, month, year] = dateOfBirth.split('/');
        updateData.date_of_birth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Update profile in database
      await ProfileService.updateCurrentUserProfile(updateData);
      
      // Upload profile image if changed
      if (profileImage?.uri) {
        try {
          await ProfileService.updateProfilePicture(profileImage.uri);
          // Trigger refresh for profile picture cache
        } catch (imageError) {
          // Don't fail the entire update for image upload
        }
      }
      
      // Clear profile cache to force refresh on next load
      cachedUserProfile = null;
      
      Alert.alert(
        t('common.success'), 
        t('edit_profile.update_success'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      setError(t('edit_profile.update_error'));
      Alert.alert(t('common.error'), t('edit_profile.update_error_retry'));
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('edit_profile.loading')}</Text>
            </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header 
          title={t('edit_profile.title')} 
          fallbackRoute="/(tabs)/profile"
        />
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Picture */}
          <View style={{ alignItems: "center", marginVertical: 12 }}>
            <View style={styles.avatarContainer}>
              <SimpleAvatar 
                size={120}
                displayName={firstName || t('edit_profile.user_placeholder')}
                forceRefresh={refreshTrigger}
              />
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* First Name */}
            <Input
              id="firstName"
              placeholder={t('edit_profile.first_name_placeholder')}
              value={firstName}
              onInputChanged={(id, value) => setFirstName(value)}
              icon={icons.user}
            />

            {/* Last Name */}
            <Input
              id="lastName"
              placeholder={t('edit_profile.last_name_placeholder')}
              value={lastName}
              onInputChanged={(id, value) => setLastName(value)}
              icon={icons.user}
            />

            {/* Phone Code */}
            <SearchableDropdown
              data={phoneCodesData}
              onSelect={(item) => setPhoneCode(item.value)}
              placeholder={t('edit_profile.select_phone_code')}
              selectedValue={phoneCode}
              searchPlaceholder={t('edit_profile.search_country_code')}
              icon={icons.telephone}
            />

            {/* Mobile Number */}
            <Input
              id="mobileNumber"
              placeholder={t('edit_profile.mobile_placeholder')}
              value={mobileNumber}
              onInputChanged={(id, value) => setMobileNumber(value)}
              icon={icons.call}
              keyboardType="phone-pad"
            />

            {/* Date of Birth */}
              <TouchableOpacity
              style={styles.datePickerInput}
              onPress={() => setOpenDatePicker(true)}
            >
              <View style={styles.dateInputContainer}>
                <Text style={[
                  styles.dateInputText,
                  !dateOfBirth && styles.dateInputPlaceholder
                ]}>
                  {dateOfBirth || t('edit_profile.dob_placeholder')}
                </Text>
                <View style={styles.calendarIcon}>
                  <Text style={styles.calendarEmoji}>📅</Text>
                </View>
                </View>
              </TouchableOpacity>

            {/* Gender */}
            <SearchableDropdown
              data={genderOptions}
              onSelect={(item) => setSelectedGender(item.value as GenderType)}
              placeholder={t('edit_profile.gender_placeholder')}
              selectedValue={selectedGender}
              searchPlaceholder={t('edit_profile.search_gender')}
            />

            {/* Country */}
            <SearchableDropdown
              data={getCountriesAsDropdownItems()}
              onSelect={handleCountryChange}
              placeholder={t('edit_profile.select_country')}
              selectedValue={selectedCountry}
              searchPlaceholder={t('edit_profile.search_country')}
              icon={icons.location}
            />

            {/* City */}
            <SearchableDropdown
              data={availableCities}
              onSelect={(item) => setSelectedCity(item.value)}
              placeholder={selectedCountry ? t('edit_profile.select_city') : t('edit_profile.select_country_first')}
              selectedValue={selectedCity}
              disabled={!selectedCountry}
              searchPlaceholder={t('edit_profile.search_city')}
              icon={icons.location}
            />

            {/* Occupation */}
            <Input
              id="occupation"
              placeholder={t('edit_profile.occupation_placeholder')}
              value={occupation}
              onInputChanged={(id, value) => setOccupation(value)}
              icon={icons.bag}
            />

            {/* About Me */}
            <View style={styles.textAreaContainer}>
              <Text style={styles.textAreaLabel}>{t('edit_profile.about_me_label')}</Text>
              <TextInput
                style={styles.textArea}
                placeholder={t('edit_profile.about_placeholder')}
                value={aboutMe}
                onChangeText={setAboutMe}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
        
        {/* Date Picker Modal */}
        <DatePickerModal
          open={openDatePicker}
          startDate={getFormatedDate(new Date(), "YYYY/MM/DD")}
          selectedDate={dateOfBirth}
          onClose={() => setOpenDatePicker(false)}
          onChangeStartDate={handleDateChange}
        />
      </View>
      
      {/* Update Button */}
      <View style={styles.bottomContainer}>
        <Button
          title={isSaving ? t('edit_profile.updating') : t('edit_profile.update_button')}
          filled
          style={styles.continueButton}
          onPress={saveProfile}
          disabled={isSaving}
        />
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  textAreaContainer: {
    marginBottom: 16,
  },
  textAreaLabel: {
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.black,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.greyscale500,
    backgroundColor: COLORS.greyscale500,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.black,
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
  avatarContainer: {
    marginVertical: 12,
    alignItems: "center",
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  avatar: {
    height: 130,
    width: 130,
    borderRadius: 65,
  },
  loadingAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.grayscale200,
  },
  // Removed pickImage styles
  formContainer: {
    marginBottom: 100, // Space for button
  },
  datePickerInput: {
    marginBottom: 16,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.greyscale500,
    backgroundColor: COLORS.greyscale500,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    height: 52,
  },
  dateInputText: {
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.black,
    flex: 1,
  },
  dateInputPlaceholder: {
    color: COLORS.grayTie,
  },
  calendarIcon: {
    marginLeft: 8,
  },
  calendarEmoji: {
    fontSize: 20,
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
  continueButton: {
    width: SIZES.width - 32,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
});

export default EditProfile;