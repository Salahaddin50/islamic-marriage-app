import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, FlatList, useWindowDimensions, ScrollView } from 'react-native';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, images, SIZES } from '@/constants';
import { getResponsiveWidth, getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '@/utils/responsive';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { menbers } from '@/data';
import { supabase } from '@/src/config/supabase';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import MatchCard from '@/components/MatchCard';
import { Database } from '@/src/types/database.types';

// Simple Header Avatar Component with Profile Picture Support
const SimpleHeaderAvatar = ({ size, displayName, isLoading }: { size: number, displayName?: string, isLoading: boolean }) => {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check media_references first
        const { data: mediaRef } = await supabase
          .from('media_references')
          .select('do_spaces_cdn_url, do_spaces_url, external_url')
          .eq('user_id', user.id)
          .eq('media_type', 'photo')
          .eq('is_profile_picture', true)
          .maybeSingle();

        if (mediaRef) {
          const imageUrl = mediaRef.do_spaces_cdn_url || mediaRef.do_spaces_url || mediaRef.external_url;
          if (imageUrl) {
            setProfileImageUrl(imageUrl);
            return;
          }
        }

        // Check user_profiles as fallback
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('profile_picture_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.profile_picture_url) {
          setProfileImageUrl(profile.profile_picture_url);
        }
      } catch (error) {
        console.log('Error fetching header profile image:', error);
      }
    };

    fetchProfileImage();
  }, []);

  if (isLoading) {
    return (
      <View style={[{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: COLORS.grayscale200,
        justifyContent: 'center',
        alignItems: 'center'
      }]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';
  
  // Show profile picture if available and not errored
  if (profileImageUrl && !imageLoadError) {
    return (
      <View style={[{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: COLORS.grayscale200
      }]}>
        <Image
          source={{ uri: profileImageUrl }}
          style={{
            width: size,
            height: size,
          }}
          resizeMode="cover"
          onError={() => {
            console.log('Header profile image failed to load, showing initial');
            setImageLoadError(true);
          }}
          onLoad={() => {
            console.log('Header profile image loaded successfully');
          }}
        />
      </View>
    );
  }
  
  // Fallback to initial
  return (
    <View style={[{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }]}>
      <Text style={{
        fontSize: size * 0.4,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center'
      }}>
        {initial}
      </Text>
    </View>
  );
};

import RBSheet from "react-native-raw-bottom-sheet";
import Button from '@/components/Button';
import MultiSlider, { MarkerProps } from '@ptomasroos/react-native-multi-slider';
import Input from '@/components/Input';
import { reducer } from '@/utils/reducers/formReducers';
import { validateInput } from '@/utils/actions/formActions';
import { countriesData, CountryData } from '@/data/countries';
import SearchableDropdown from '@/components/SearchableDropdown';

interface SliderHandleProps {
  enabled: boolean;
  markerStyle: object;
}

const CustomSliderHandle: React.FC<SliderHandleProps> = ({ enabled, markerStyle }) => {
  return (
    <View
      style={[
        markerStyle,
        {
          backgroundColor: enabled ? COLORS.primary : 'lightgray',
          borderColor: 'white',
          borderWidth: 2,
          borderRadius: 10,
          width: 20,
          height: 20,
        },
      ]}
    />
  );
};

const isTestMode = true;

const initialState = {
  inputValues: {
    location: isTestMode ? 'New York' : '',
  },
  inputValidities: {
    location: false,
  },
  formIsValid: false,
}

type UserProfileWithMedia = {
  id: string;
  name: string;
  age: number;
  // presentation fields per latest request
  height?: string;
  weight?: string;
  country?: string;
  city?: string;
  image: any;
};

type DatabaseProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  date_of_birth: string;
  height_cm: number | null;
  weight_kg: number | null;
  city: string | null;
  country: string | null;
  gender: string;
  profile_picture_url: string | null;
};

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [users, setUsers] = useState<UserProfileWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const refRBSheet = useRef<any>(null);

  const [ageRange, setAgeRange] = useState([20, 50]); // Initial age range values
  const [formState, dispatchFormState] = useReducer(reducer, initialState);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Physical filters
  const [heightRange, setHeightRange] = useState([150, 200]); // Height in cm
  const [weightRange, setWeightRange] = useState([40, 120]); // Weight in kg
  const [selectedEyeColor, setSelectedEyeColor] = useState<string[]>([]);
  const [selectedHairColor, setSelectedHairColor] = useState<string[]>([]);
  const [selectedSkinTone, setSelectedSkinTone] = useState<string[]>([]);
  const [selectedBodyType, setSelectedBodyType] = useState<string[]>([]);
  
  // Education & Lifestyle filters
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedHousingType, setSelectedHousingType] = useState<string[]>([]);
  const [selectedLivingCondition, setSelectedLivingCondition] = useState<string[]>([]);
  const [selectedSocialCondition, setSelectedSocialCondition] = useState<string[]>([]);
  const [selectedWorkStatus, setSelectedWorkStatus] = useState<string[]>([]);
  
  // Religious filters
  const [selectedReligiousLevel, setSelectedReligiousLevel] = useState<string[]>([]);
  const [selectedPrayerFrequency, setSelectedPrayerFrequency] = useState<string[]>([]);
  const [selectedQuranReading, setSelectedQuranReading] = useState<string[]>([]);
  const [selectedCoveringLevel, setSelectedCoveringLevel] = useState<string[]>([]);
  const [selectedBeardPractice, setSelectedBeardPractice] = useState<string[]>([]);
  const [selectedAcceptedWifePositions, setSelectedAcceptedWifePositions] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [oppositeGender, setOppositeGender] = useState<string | null>(null);
  const { isLoading: profileLoading } = useProfilePicture(refreshTrigger);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const baseWidth = ((windowWidth - 64) / 2) * 0.88; // baseline width (kept for height)
  const baseHeight = baseWidth / (212 / 316); // keep this height
  const cardWidth = baseWidth * 1.155 * 1.05; // increase width by 15.5% + 5% = 21.275%

  // Options arrays (from personal details)
  const eyeColorOptions = ['Brown', 'Black', 'Blue', 'Green', 'Hazel', 'Gray', 'Other'];
  const hairColorOptions = ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Other'];
  const skinToneOptions = ['Very Fair', 'Fair', 'Medium', 'Olive', 'Brown', 'Dark'];
  const bodyTypeOptions = ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size', 'Muscular'];
  const educationOptions = ['High School', 'Some College', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'Doctorate', 'Trade School', 'Other'];
  const languageOptions = ['Arabic', 'English', 'Turkish', 'Russian', 'Spanish', 'French', 'Urdu'];
  const housingOptions = ['Own House', 'Rent Apartment', 'Family Home', 'Shared Accommodation', 'Other'];
  const livingConditionOptions = ['living_with_parents', 'living_alone', 'living_with_children'];
  const socialConditionOptions = ['sufficient', 'rich', 'very_rich'];
  const workStatusOptions = ['working', 'not_working'];
  const religiousLevelOptions = ['Very Religious', 'Religious', 'Moderately Religious', 'Somewhat Religious', 'Not Very Religious'];
  const prayerFrequencyOptions = ['5 Times Daily', 'Regularly', 'Sometimes', 'Rarely', 'Never'];
  const quranReadingOptions = ['Memorized Significant Portions', 'Read Fluently', 'Read with Help', 'Learning to Read', 'Cannot Read Arabic'];
  const coveringLevelOptions = ['will_cover', 'hijab', 'niqab'];
  const beardPracticeOptions = ['Full Beard', 'Trimmed Beard', 'Mustache Only', 'Clean Shaven'];
  const acceptedWifeOptions = ['2', '3', '4'];

  const inputChangedHandler = useCallback(
    (inputId: string, inputValue: string) => {
      const result = validateInput(inputId, inputValue)
      dispatchFormState({
        inputId,
        validationResult: result,
        inputValue,
      })
    }, [dispatchFormState]);

  const handleSliderChange = (values: any) => {
    setAgeRange(values); // Update the age range
  };

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setSelectedCity(''); // Reset city when country changes
    
    // Find cities for selected country
    const countryData = countriesData.find(c => c.name === country);
    setAvailableCities(countryData?.cities || []);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
  };

  // Helper for multi-select chips
  const toggleSelection = (value: string, current: string[], setFn: (vals: string[]) => void) => {
    if (current.includes(value)) {
      setFn(current.filter(v => v !== value));
    } else {
      setFn([...current, value]);
    }
  };

  // Pretty label for values stored with underscores
  const formatLabel = (value: string) => {
    return value
      .toString()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    
    // Age range (default: [20, 50])
    if (ageRange[0] !== 20 || ageRange[1] !== 50) count++;
    
    // Height range (default: [150, 200])
    if (heightRange[0] !== 150 || heightRange[1] !== 200) count++;
    
    // Weight range (default: [40, 120])
    if (weightRange[0] !== 40 || weightRange[1] !== 120) count++;
    
    // Location filters
    if (selectedCountry) count++;
    if (selectedCity) count++;
    
    // Multi-select filters
    if (selectedEyeColor.length > 0) count++;
    if (selectedHairColor.length > 0) count++;
    if (selectedSkinTone.length > 0) count++;
    if (selectedBodyType.length > 0) count++;
    if (selectedEducation.length > 0) count++;
    if (selectedLanguages.length > 0) count++;
    if (selectedHousingType.length > 0) count++;
    if (selectedLivingCondition.length > 0) count++;
    if (selectedSocialCondition.length > 0) count++;
    if (selectedWorkStatus.length > 0) count++;
    if (selectedReligiousLevel.length > 0) count++;
    if (selectedPrayerFrequency.length > 0) count++;
    if (selectedQuranReading.length > 0) count++;
    if (selectedCoveringLevel.length > 0) count++;
    if (selectedBeardPractice.length > 0) count++;
    if (selectedAcceptedWifePositions.length > 0) count++;
    
    return count;
  };

  const resetAllFilters = useCallback(() => {
    // Reset all filter states
    setSelectedCountry('');
    setSelectedCity('');
    setAvailableCities([]);
    setAgeRange([20, 50]);
    setHeightRange([150, 200]);
    setWeightRange([40, 120]);
    setSelectedEyeColor([]);
    setSelectedHairColor([]);
    setSelectedSkinTone([]);
    setSelectedBodyType([]);
    setSelectedEducation([]);
    setSelectedLanguages([]);
    setSelectedHousingType([]);
    setSelectedLivingCondition([]);
    setSelectedSocialCondition([]);
    setSelectedWorkStatus([]);
    setSelectedReligiousLevel([]);
    setSelectedPrayerFrequency([]);
    setSelectedQuranReading([]);
    setSelectedCoveringLevel([]);
    setSelectedBeardPractice([]);
    setSelectedAcceptedWifePositions([]);
  }, []);



  // Fetch user profiles from database
  const fetchUserProfiles = async (ignoreFilters: boolean = false) => {
    try {
      setLoading(true);
      console.log('Starting to fetch user profiles...');
      
      // Get current user to exclude them from results and determine their gender
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user:', currentUser?.id);
      
      // Get current user's gender to show opposite gender profiles
      let currentUserGender = null;
      if (currentUser?.id) {
        const { data: currentUserProfile } = await supabase
          .from('user_profiles')
          .select('gender')
          .eq('user_id', currentUser.id)
          .single();
        
        currentUserGender = currentUserProfile?.gender;
        console.log('Current user gender:', currentUserGender);
      }
      
      // First, let's check if there are any profiles at all
      const { data: allProfiles, error: countError } = await supabase
        .from('user_profiles')
        .select('id, user_id, first_name, gender, city, country, height_cm, weight_kg')
        .limit(10);
        
      console.log('=== DATABASE CHECK ===');
      console.log('Total profiles in database:', allProfiles?.length || 0);
      console.log('Sample profiles with height/weight:', allProfiles);
      console.log('Database connection error:', countError);
      
      if (countError) {
        console.error('Error checking profiles:', countError);
      }

      // Additional direct query to test - try to get ALL profiles
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(20);
      
      console.log('=== TEST QUERY (EXPANDED) ===');  
      console.log('Test data result count:', testData?.length);
      console.log('Test data result:', testData);
      console.log('Test error:', testError);

      // Try a count query to see total records
      const { count, error: countError2 } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log('=== COUNT QUERY ===');
      console.log('Total count:', count);
      console.log('Count error:', countError2);

      // Try without authentication context
      const { data: allDataTest, error: allDataError } = await supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name, gender, city, country, height_cm, weight_kg');
      
      console.log('=== ALL DATA TEST ===');
      console.log('All data count:', allDataTest?.length);
      console.log('All data sample:', allDataTest?.slice(0, 3));
      console.log('All data error:', allDataError);

      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          date_of_birth,
          height_cm,
          weight_kg,
          city,
          country,
          gender,
          profile_picture_url
        `)
        .limit(50);

      // Exclude current user if exists
      if (currentUser?.id) {
        console.log('Excluding current user:', currentUser.id);
        query = query.neq('user_id', currentUser.id);
      }

      // Note: We'll calculate age on the client side since age column might be null

      // Apply gender filter based on current user's gender to show opposite gender
      if (currentUserGender) {
        const og = currentUserGender.toLowerCase() === 'male' ? 'female' : 'male';
        setOppositeGender(og);
        console.log('Showing opposite gender profiles:', og);
        query = query.eq('gender', og);
      } else {
        console.log('Current user gender unknown, showing all profiles');
        // If we can't determine gender, show all profiles
      }

      const shouldApplyFilters = !ignoreFilters;

      // Apply country filter if selected
      if (shouldApplyFilters && selectedCountry) {
        console.log('Applying country filter:', selectedCountry);
        query = query.eq('country', selectedCountry);
      }

      // Apply city filter if selected
      if (shouldApplyFilters && selectedCity) {
        console.log('Applying city filter:', selectedCity);
        query = query.eq('city', selectedCity);
      }

      // Apply physical filters
      if (shouldApplyFilters && heightRange && heightRange[0] && heightRange[1]) {
        query = query.gte('height_cm', heightRange[0]).lte('height_cm', heightRange[1]);
      }
      if (shouldApplyFilters && weightRange && weightRange[0] && weightRange[1]) {
        query = query.gte('weight_kg', weightRange[0]).lte('weight_kg', weightRange[1]);
      }
      if (shouldApplyFilters && selectedEyeColor.length) {
        query = query.in('eye_color', selectedEyeColor);
      }
      if (shouldApplyFilters && selectedHairColor.length) {
        query = query.in('hair_color', selectedHairColor);
      }
      if (shouldApplyFilters && selectedSkinTone.length) {
        query = query.in('skin_tone', selectedSkinTone);
      }
      if (shouldApplyFilters && selectedBodyType.length) {
        query = query.in('body_type', selectedBodyType);
      }

      // Apply education and lifestyle filters
      if (shouldApplyFilters && selectedEducation.length) {
        query = query.in('education_level', selectedEducation);
      }
      if (shouldApplyFilters && selectedHousingType.length) {
        query = query.in('housing_type', selectedHousingType);
      }
      if (shouldApplyFilters && selectedLivingCondition.length) {
        query = query.in('living_condition', selectedLivingCondition);
      }
      if (shouldApplyFilters && selectedSocialCondition.length) {
        query = query.in('social_condition', selectedSocialCondition);
      }
      if (shouldApplyFilters && selectedWorkStatus.length) {
        query = query.in('work_status', selectedWorkStatus);
      }

      // Apply religious filters
      if (shouldApplyFilters && selectedReligiousLevel.length) {
        query = query.in('religious_level', selectedReligiousLevel);
      }
      if (shouldApplyFilters && selectedPrayerFrequency.length) {
        query = query.in('prayer_frequency', selectedPrayerFrequency);
      }
      if (shouldApplyFilters && selectedQuranReading.length) {
        query = query.in('quran_reading_level', selectedQuranReading);
      }
      // Apply gender-specific filters
      if (oppositeGender === 'female') {
        if (shouldApplyFilters && selectedCoveringLevel.length) {
          query = query.in('covering_level', selectedCoveringLevel);
        }
        if (shouldApplyFilters && selectedAcceptedWifePositions.length) {
          query = query.contains('accepted_wife_positions', selectedAcceptedWifePositions);
        }
        if (shouldApplyFilters && selectedWorkStatus.length) {
          query = query.in('work_status', selectedWorkStatus);
        }
      }
      if (oppositeGender === 'male') {
        if (shouldApplyFilters && selectedBeardPractice.length) {
          query = query.in('beard_practice', selectedBeardPractice);
        }
        if (shouldApplyFilters && selectedSocialCondition.length) {
          query = query.in('social_condition', selectedSocialCondition);
        }
      }

      // Languages (array contains)
      if (shouldApplyFilters && selectedLanguages.length) {
        query = query.contains('languages_spoken', selectedLanguages);
      }

      // Test query without filters first
      const { data: testProfilesData, error: testProfilesError } = await supabase
        .from('user_profiles')
        .select('id, user_id, first_name, gender')
        .limit(10);
      
      console.log('=== UNFILTERED TEST QUERY ===');
      console.log('Unfiltered profiles count:', testProfilesData?.length || 0);
      console.log('Unfiltered profiles:', testProfilesData);
      
      console.log('Executing query with filters:', { ageRange, currentUserId: currentUser?.id });
      const { data: profilesData, error } = await query;

      console.log('Query result:', { 
        count: profilesData?.length || 0, 
        error: error?.message,
        profilesData: profilesData
      });

      // Log each profile for debugging
      if (profilesData && profilesData.length > 0) {
        console.log('=== PROFILES RETURNED FROM QUERY ===');
        profilesData.forEach((profile, index) => {
          console.log(`Profile ${index + 1}:`, {
            id: profile.id,
            user_id: profile.user_id,
            name: `${profile.first_name} ${profile.last_name}`,
            gender: profile.gender,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            city: profile.city,
            country: profile.country
          });
        });
      }

      if (error) {
        console.error('Error fetching profiles:', error);
        // Fallback to mock data
        console.log('Falling back to mock data');
        // Convert mock data to match new interface
        const convertedMockData = menbers.map(item => ({
          id: item.id.toString(),
          name: item.name,
          age: item.age ?? 25,
          height: item.height,
          weight: '80kg',
          country: item.location.split(',')[0],
          city: item.location.split(',')[1]?.trim(),
          image: item.image
        }));
        setUsers(convertedMockData);
        return;
      }

      // Build a fallback map of profile picture URLs from media_references for users
      // who don't have profile_picture_url set in user_profiles
      let userIdToProfilePic: Record<string, string> = {};
      if (testProfilesData && testProfilesData.length > 0) {
        try {
          const missingUserIds = testProfilesData
            .filter((p: any) => !p.profile_picture_url)
            .map((p: any) => p.user_id);

          if (missingUserIds.length > 0) {
            const { data: mediaRows, error: mediaRowsError } = await supabase
              .from('media_references')
              .select('user_id, do_spaces_cdn_url, do_spaces_url, external_url, is_profile_picture, media_type')
              .in('user_id', missingUserIds)
              .eq('is_profile_picture', true)
              .eq('media_type', 'photo');

            if (mediaRowsError) {
              console.log('Error fetching media_references for list:', mediaRowsError);
            } else if (mediaRows && mediaRows.length > 0) {
              mediaRows.forEach((row: any) => {
                const url = row.do_spaces_cdn_url || row.do_spaces_url || row.external_url;
                if (url) {
                  userIdToProfilePic[row.user_id] = url;
                }
              });
              console.log('Built media reference map for', Object.keys(userIdToProfilePic).length, 'users');
            }
          }
        } catch (e) {
          console.log('Exception while building media reference map:', e);
        }
      }

      if (profilesData && profilesData.length > 0) {
        const usersWithMedia = profilesData.map((profile) => {
          console.log('Processing real profile from DB:', {
            id: profile.id, 
            name: profile.first_name,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            gender: profile.gender,
            city: profile.city,
            country: profile.country,
            profile_picture_url: profile.profile_picture_url
          });

          // Calculate age from date_of_birth
          const birthDate = new Date(profile.date_of_birth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear() - 
                     (today.getMonth() < birthDate.getMonth() || 
                      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

          // Apply age filter
          console.log('Age check:', { age, ageRange, ageRange0: ageRange[0], ageRange1: ageRange[1] });
          if (shouldApplyFilters && ageRange[0] && ageRange[1] && ageRange[0] > 0 && ageRange[1] > 0 && (age < ageRange[0] || age > ageRange[1])) {
            console.log('Profile filtered out by age:', age, 'not in range', ageRange);
            return null; // Will be filtered out
          }

          // Use profile_picture_url from user_profiles, or fallback to media_references map
          const imageUrl = (profile as any).profile_picture_url || userIdToProfilePic[(profile as any).user_id];

          const isFemale = (profile as any).gender === 'female' || (profile as any).gender === 'Female';

          const processedProfile = {
            id: profile.id,
            name: `${profile.first_name}`.trim(),
            age: age,
            height: profile.height_cm ? `${profile.height_cm}cm` : undefined,
            weight: profile.weight_kg ? `${profile.weight_kg}kg` : undefined,
            country: profile.country || undefined,
            city: profile.city || undefined,
            image: imageUrl ? { uri: imageUrl } : (isFemale ? images.femaleSilhouette : images.maleSilhouette)
          };

          console.log('Final processed profile:', processedProfile);
          return processedProfile;
        }).filter(profile => profile !== null) as UserProfileWithMedia[]; // Remove null entries

        console.log('Successfully processed profiles:', usersWithMedia.length);
        setUsers(usersWithMedia);
      } else {
        console.log('No profiles found, using mock data');
        // Show a message if no real profiles exist
        if (allProfiles && allProfiles.length === 0) {
          console.log('Database is empty - no user profiles exist');
        }
        // Convert mock data to match new interface
        const convertedMockData = menbers.map(item => ({
          id: item.id.toString(),
          name: item.name,
          age: item.age ?? 25,
          height: item.height,
          weight: '80kg',
          country: item.location.split(',')[0],
          city: item.location.split(',')[1]?.trim(),
          image: item.image
        }));
        setUsers(convertedMockData);
      }
    } catch (error) {
      console.error('Error in fetchUserProfiles:', error);
      // Fallback to mock data
      console.log('Exception occurred, falling back to mock data');
      // Convert mock data to match new interface
      const convertedMockData = menbers.map(item => ({
        id: item.id.toString(),
        name: item.name,
        age: item.age ?? 25,
        height: item.height,
        weight: '80kg',
        country: item.location.split(',')[0],
        image: item.image
      }));
      setUsers(convertedMockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfiles();
  }, [])

  // Add a manual refresh function for testing
  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    fetchUserProfiles();
  };

  // Load current user's display name from Supabase profile
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Try to get user profile data, handling the case where the table or column might not exist
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('first_name,last_name,profile_picture_url')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.log('Error fetching profile in index.tsx:', error);
          }
        
        // Profile picture is handled by useProfilePicture hook
        
        // Set display name
        if (profile?.first_name || profile?.last_name) {
          const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
          setDisplayName(name);
        } else if (user.email) {
          setDisplayName(user.email.split('@')[0]);
        }
        } catch (profileError) {
          console.log('Error in profile data fetch:', profileError);
          // Fallback to email username if profile fetch fails
          if (user.email) {
            setDisplayName(user.email.split('@')[0]);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);



  /**
 * render header
 */
  const renderHeader = () => {
    // Function to refresh profile data
    const refreshProfile = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    return (
      <View style={styles.headerContainer}>
        <View style={styles.viewLeft}>
          <TouchableOpacity onLongPress={refreshProfile}>
            <SimpleHeaderAvatar 
              size={50}
              displayName={displayName}
              isLoading={profileLoading}
            />
          </TouchableOpacity>
          <View style={styles.viewNameContainer}>
            <Text style={styles.greeeting}>Salam Aleykoum 👋</Text>
            <Text style={[styles.title, {
              color: COLORS.greyscale900
            }]}>{displayName || 'Welcome'}</Text>
          </View>
        </View>
        <View style={styles.viewRight}>
          <TouchableOpacity
            onPress={() => refRBSheet.current?.open()}
            style={styles.filterButton}>
            <Image
              source={icons.filter}
              resizeMode='contain'
              style={[styles.bellIcon, { tintColor: COLORS.greyscale900 }]}
            />
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const CustomMarker: React.FC<MarkerProps> = (props) => {
    const { currentValue } = props;
    return (
      <View style={styles.customMarker}>
        <Text style={styles.markerText}>{currentValue}</Text>
      </View>
    );
  };


  const renderItem = ({ item }: { item: UserProfileWithMedia }) => {
    return (
      <MatchCard
        name={item.name}
        age={item.age}
        image={item.image}
        height={item.height}
        weight={item.weight}
        country={item.country}
        city={item.city}
        onPress={() => navigation.navigate("matchdetails")}
        containerStyle={[styles.cardContainer, { width: cardWidth, height: baseHeight }]}
      />
    );
  };

  if (loading) {
  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Finding matches for you...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

              return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />

        <RBSheet
          ref={refRBSheet}
          closeOnPressMask={true}
          height={Math.min(windowHeight * 0.9, 1000)}
          customStyles={{
            wrapper: {
              backgroundColor: "rgba(0,0,0,0.5)",
            },
            draggableIcon: {
              backgroundColor: "#000",
            },
            container: {
              borderTopRightRadius: 32,
              borderTopLeftRadius: 32,
              height: Math.min(windowHeight * 0.9, 1000),
              backgroundColor: COLORS.white,
            }
          }}
        >
          <Text style={[styles.bottomTitle, {
            color: COLORS.greyscale900
          }]}>Filter ({users.length})</Text>
          <View style={styles.separateLine} />
          <ScrollView style={{ flex: 1, maxHeight: windowHeight * 0.9 - 150 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginHorizontal: 16 }}>
            {/* Country first */}
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
            }]}>Country</Text>
            <SearchableDropdown
              data={countriesData.map(country => ({ label: country.name, value: country.name }))}
              onSelect={(item: any) => handleCountrySelect(item.value)}
              placeholder="Select Country"
              selectedValue={selectedCountry}
            />
            
            {selectedCountry && (
              <>
                <Text style={[styles.subtitle, {
                  color: COLORS.greyscale900,
                  marginTop: 16,
                }]}>City</Text>
                <SearchableDropdown
                  data={availableCities.map(city => ({ label: city, value: city }))}
                  onSelect={(item: any) => handleCitySelect(item.value)}
                  placeholder="Select City"
                  selectedValue={selectedCity}
                />
              </>
            )}

            {/* Age after location */}
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
            }]}>Age</Text>
            <MultiSlider
              values={ageRange}
              sliderLength={SIZES.width - 32}
              onValuesChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
              allowOverlap={false}
              snapped
              minMarkerOverlapDistance={10}
              selectedStyle={styles.selectedTrack}
              unselectedStyle={styles.unselectedTrack}
              containerStyle={styles.sliderContainer}
              trackStyle={styles.trackStyle}
              customMarker={(e) => <CustomMarker {...e} />}
            />

            {/* Physical Characteristics */}
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>Height Range (cm)</Text>
            <MultiSlider
              values={heightRange}
              sliderLength={SIZES.width - 32}
              onValuesChange={(values) => setHeightRange(values)}
              min={140}
              max={210}
              step={1}
              allowOverlap={false}
              snapped
              minMarkerOverlapDistance={10}
              selectedStyle={styles.selectedTrack}
              unselectedStyle={styles.unselectedTrack}
              containerStyle={styles.sliderContainer}
              trackStyle={styles.trackStyle}
              customMarker={(e) => <CustomMarker {...e} />}
            />

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>Weight Range (kg)</Text>
            <MultiSlider
              values={weightRange}
              sliderLength={SIZES.width - 32}
              onValuesChange={(values) => setWeightRange(values)}
              min={40}
              max={150}
              step={1}
              allowOverlap={false}
              snapped
              minMarkerOverlapDistance={10}
              selectedStyle={styles.selectedTrack}
              unselectedStyle={styles.unselectedTrack}
              containerStyle={styles.sliderContainer}
              trackStyle={styles.trackStyle}
              customMarker={(e) => <CustomMarker {...e} />}
            />

            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Eye Color</Text>
            <View style={styles.horizontalMultiSelect}>
              {eyeColorOptions.map((option: string) => {
                const selected = selectedEyeColor.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => toggleSelection(option, selectedEyeColor, setSelectedEyeColor)}
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
          </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>Hair Color</Text>
            <View style={styles.horizontalMultiSelect}>
              {hairColorOptions.map((option: string) => {
                const selected = selectedHairColor.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => toggleSelection(option, selectedHairColor, setSelectedHairColor)}
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>Skin Tone</Text>
            <View style={styles.horizontalMultiSelect}>
              {skinToneOptions.map((option: string) => {
                const selected = selectedSkinTone.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => toggleSelection(option, selectedSkinTone, setSelectedSkinTone)}
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>Body Type</Text>
            <View style={styles.horizontalMultiSelect}>
              {bodyTypeOptions.map((option: string) => {
                const selected = selectedBodyType.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => toggleSelection(option, selectedBodyType, setSelectedBodyType)}
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>Education Level</Text>
            <View style={styles.horizontalMultiSelect}>
              {educationOptions.map((option: string) => {
                const selected = selectedEducation.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => toggleSelection(option, selectedEducation, setSelectedEducation)}
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Languages */}
            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Languages</Text>
            <View style={styles.horizontalMultiSelect}>
              {languageOptions.map((option: string) => {
                const selected = selectedLanguages.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedLanguages, setSelectedLanguages)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Housing Type */}
            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Housing Type</Text>
            <View style={styles.horizontalMultiSelect}>
              {housingOptions.map((option: string) => {
                const selected = selectedHousingType.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedHousingType, setSelectedHousingType)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Living Condition / Social / Work are gender-specific – still selectable here, but applied conditionally in query */}
            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Living Condition</Text>
            <View style={styles.horizontalMultiSelect}>
              {livingConditionOptions.map((option: string) => {
                const label = formatLabel(option);
                const selected = selectedLivingCondition.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedLivingCondition, setSelectedLivingCondition)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Social Condition</Text>
            <View style={styles.horizontalMultiSelect}>
              {socialConditionOptions.map((option: string) => {
                const label = formatLabel(option);
                const selected = selectedSocialCondition.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedSocialCondition, setSelectedSocialCondition)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Work Status</Text>
            <View style={styles.horizontalMultiSelect}>
              {workStatusOptions.map((option: string) => {
                const label = formatLabel(option);
                const selected = selectedWorkStatus.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedWorkStatus, setSelectedWorkStatus)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>Religious Level</Text>
            <View style={styles.horizontalMultiSelect}>
              {religiousLevelOptions.map((option: string) => {
                const selected = selectedReligiousLevel.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedReligiousLevel, setSelectedReligiousLevel)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>Prayer Frequency</Text>
            <View style={styles.horizontalMultiSelect}>
              {prayerFrequencyOptions.map((option: string) => {
                const selected = selectedPrayerFrequency.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedPrayerFrequency, setSelectedPrayerFrequency)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quran Reading Level */}
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>Quran Reading Level</Text>
            <View style={styles.horizontalMultiSelect}>
              {quranReadingOptions.map((option: string) => {
                const selected = selectedQuranReading.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedQuranReading, setSelectedQuranReading)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Gender-specific: Covering Level or Beard Practice */}
            {oppositeGender === 'female' && (
              <>
                <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Covering Level</Text>
                <View style={styles.horizontalMultiSelect}>
                  {coveringLevelOptions.map((option: string) => {
                    const selected = selectedCoveringLevel.includes(option);
                    return (
                      <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedCoveringLevel, setSelectedCoveringLevel)}>
                        <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{formatLabel(option)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
            {oppositeGender === 'male' && (
              <>
                <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Beard Practice</Text>
                <View style={styles.horizontalMultiSelect}>
                  {beardPracticeOptions.map((option: string) => {
                    const selected = selectedBeardPractice.includes(option);
                    return (
                      <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedBeardPractice, setSelectedBeardPractice)}>
                        <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Accepted Wife Positions (for females) */}
            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Accept To Be Which Wife</Text>
            <View style={styles.horizontalMultiSelect}>
              {acceptedWifeOptions.map((option: string) => {
                const selected = selectedAcceptedWifePositions.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedAcceptedWifePositions, setSelectedAcceptedWifePositions)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>
          </ScrollView>
          <View style={styles.separateLine} />

          <View style={styles.bottomContainer}>
            <Button
              title="Reset"
              style={styles.cancelButton}
              textColor={COLORS.primary}
              onPress={() => {
                resetAllFilters();
                // Immediately fetch ignoring filters so user sees results without reopening
                fetchUserProfiles(true);
                refRBSheet.current?.close();
              }}
            />
            <Button
              title="Apply"
              filled
              style={styles.logoutButton}
              onPress={() => {
                fetchUserProfiles();
                refRBSheet.current?.close();
              }}
            />
          </View>
        </RBSheet>
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
    backgroundColor: COLORS.white,
    paddingVertical: 16
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 32
  },
  loadingIcon: {
    backgroundColor: COLORS.grayscale200,
    justifyContent: 'center',
    alignItems: 'center'
  },
  viewLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  greeeting: {
    fontSize: 12,
    fontFamily: "regular",
    color: "gray",
    marginBottom: 4
  },
  title: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.greyscale900
  },
  viewNameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  viewRight: {
    flexDirection: "row",
    alignItems: "center"
  },
  bellIcon: {
    height: 28,
    width: 28,
    tintColor: COLORS.black,
    marginRight: 8
  },
  bookmarkIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black
  },
  listContainer: {
    paddingBottom: isMobileWeb() ? 160 : 140,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    marginBottom: 24,
    marginRight: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.greyscale900,
    marginTop: 16,
    textAlign: 'center',
  },
  bottomTitle: {
    fontSize: 24,
    fontFamily: "semiBold",
    color: COLORS.black,
    textAlign: "center",
    marginTop: 12
  },
  separateLine: {
    height: .4,
    width: SIZES.width - 32,
    backgroundColor: COLORS.greyscale300,
    marginVertical: 12
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.black,
    marginVertical: 12
  },
  reusltTabContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: SIZES.width - 32,
    justifyContent: "space-between"
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
    paddingHorizontal: 16,
    width: SIZES.width
  },
  cancelButton: {
    flex: 1,
    marginRight: getResponsiveSpacing(8),
    backgroundColor: COLORS.tansparentPrimary,
    borderRadius: 32
  },
  logoutButton: {
    flex: 1,
    marginLeft: getResponsiveSpacing(8),
    backgroundColor: COLORS.primary,
    borderRadius: 32
  },
  filterButton: {
    position: 'relative',
    padding: getResponsiveSpacing(8),
  },
  filterBadge: {
    position: 'absolute',
    top: getResponsiveSpacing(2),
    right: getResponsiveSpacing(2),
    backgroundColor: COLORS.primary,
    borderRadius: getResponsiveSpacing(10),
    minWidth: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginBottom: 16
  },
  // Chip styles aligned with personal details
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.greyscale300,
    backgroundColor: COLORS.white,
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: COLORS.black,
    fontFamily: 'medium',
  },
  optionChipTextSelected: {
    color: COLORS.white,
    fontFamily: 'semiBold',
  },
  horizontalMultiSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  button: {
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: 100,
    alignItems: 'center',
    marginRight: 16,
  },
  selectedButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderRadius: 32
  },
  buttonText: {
    fontFamily: "regular",
    color: COLORS.primary,
    fontSize: 16,
  },
  selectedButtonText: {
    fontFamily: "regular",
    color: COLORS.white
  },

  sliderContainer: {
    height: 40,
  },
  sliderLength: {
    width: SIZES.width - 32,
  },
  selectedTrack: {
    backgroundColor: COLORS.primary,
  },
  unselectedTrack: {
    backgroundColor: 'lightgray',
  },
  trackStyle: {
    height: 4,
  },
  customMarker: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: "center",
    justifyContent: "center",
  },
  markerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
})

export default HomeScreen