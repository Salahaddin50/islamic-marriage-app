import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { COLORS, SIZES, FONTS, icons, images } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";

import { launchImagePicker } from '../utils/ImagePickerHelper';
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
import { getCountriesAsDropdownItems, getCitiesForCountry } from '../data/countries';
import type { GenderType } from '../src/types/database.types';

// Edit Profile Screen
const EditProfile = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileImage, setProfileImage] = useState<any>(null);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [occupation, setOccupation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedGender, setSelectedGender] = useState<GenderType | ''>('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [availableCities, setAvailableCities] = useState<{label: string; value: string}[]>([]);
  
  // UI states
  const [openDatePicker, setOpenDatePicker] = useState(false);

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userProfile = await ProfileService.getCurrentUserProfile();
      
      if (userProfile) {
        setProfile(userProfile);
        // Populate form fields with existing data
        setFirstName(userProfile.first_name || '');
        setLastName(userProfile.last_name || '');
        setPhoneCode(userProfile.phone_code || '');
        setMobileNumber(userProfile.mobile_number || '');
        setOccupation(userProfile.occupation || '');
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
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
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

  const pickImage = async () => {
    try {
      const tempUri = await launchImagePicker();
      
      if (!tempUri) return;
      
      setProfileImage({ uri: tempUri });
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }
    
    if (!selectedGender) {
      Alert.alert('Validation Error', 'Gender is required');
      return false;
    }
    
    if (!dateOfBirth) {
      Alert.alert('Validation Error', 'Date of birth is required');
      return false;
    }
    
    if (mobileNumber && !phoneCode) {
      Alert.alert('Validation Error', 'Phone code is required when mobile number is provided');
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
        } catch (imageError) {
          console.error('Profile image upload failed:', imageError);
          // Don't fail the entire update for image upload
        }
      }
      
      Alert.alert(
        'Success', 
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      console.error('Save profile error:', error);
      setError('Failed to update profile');
      Alert.alert('Error', 'Failed to update profile. Please try again.');
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
          <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header 
          title="Edit Profile" 
          onBackPress={() => router.push('/(tabs)/profile')}
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
              <Image
                source={profileImage || (profile?.profile_picture_url ? { uri: profile.profile_picture_url } : images.user1)}
                contentFit="cover"
                style={styles.avatar} 
              />
              <TouchableOpacity
                onPress={pickImage}
                style={styles.pickImage}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={24}
                  color={COLORS.white} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* First Name */}
            <Input
              id="firstName"
              placeholder="First Name *"
              value={firstName}
              onInputChanged={(id, value) => setFirstName(value)}
              icon={icons.user}
            />

            {/* Last Name */}
            <Input
              id="lastName"
              placeholder="Last Name"
              value={lastName}
              onInputChanged={(id, value) => setLastName(value)}
              icon={icons.user}
            />

            {/* Phone Code */}
            <SearchableDropdown
              data={phoneCodesData}
              onSelect={(item) => setPhoneCode(item.value)}
              placeholder="Select Phone Code"
              selectedValue={phoneCode}
              searchPlaceholder="Search country code..."
              icon={icons.telephone}
            />

            {/* Mobile Number */}
            <Input
              id="mobileNumber"
              placeholder="Mobile Number"
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
                  {dateOfBirth || 'Date of Birth *'}
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
              placeholder="Select Gender *"
              selectedValue={selectedGender}
              searchPlaceholder="Search gender..."
            />

            {/* Country */}
            <SearchableDropdown
              data={getCountriesAsDropdownItems()}
              onSelect={handleCountryChange}
              placeholder="Select Country"
              selectedValue={selectedCountry}
              searchPlaceholder="Search country..."
              icon={icons.location}
            />

            {/* City */}
            <SearchableDropdown
              data={availableCities}
              onSelect={(item) => setSelectedCity(item.value)}
              placeholder={selectedCountry ? "Select City" : "Select Country First"}
              selectedValue={selectedCity}
              disabled={!selectedCountry}
              searchPlaceholder="Search city..."
              icon={icons.location}
            />

            {/* Occupation */}
            <Input
              id="occupation"
              placeholder="Occupation"
              value={occupation}
              onInputChanged={(id, value) => setOccupation(value)}
              icon={icons.bag}
            />
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
          title={isSaving ? "Updating..." : "Update Profile"}
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
  pickImage: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
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