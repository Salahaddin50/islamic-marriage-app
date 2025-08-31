import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, FlatList, useWindowDimensions, ScrollView } from 'react-native';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, images, SIZES } from '@/constants';
import { getResponsiveWidth, getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '@/utils/responsive';
import { useNavigation } from 'expo-router';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { menbers } from '@/data';
import { supabase } from '@/src/config/supabase';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import MatchCard from '@/components/MatchCard';
import HomeListSkeleton from '@/components/HomeListSkeleton';
import { Database } from '@/src/types/database.types';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useMatchStore } from '@/src/store';
import { InterestsService, InterestStatus } from '@/src/services/interests';
import { FlatGrid } from 'react-native-super-grid';
import { imageCache } from '@/utils/imageCache';

// Cached profile image to prevent reloading
let cachedProfileImageUrl: string | null = null;
let profileImageLoadTime = 0;
const PROFILE_IMAGE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Simple Header Avatar Component with Profile Picture Support
const SimpleHeaderAvatar = ({ size, displayName, isLoading }: { size: number, displayName?: string, isLoading: boolean }) => {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(cachedProfileImageUrl);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  useEffect(() => {
    const fetchProfileImage = async () => {
      // Check if we have a fresh cached image
      const isCacheFresh = cachedProfileImageUrl && (Date.now() - profileImageLoadTime) < PROFILE_IMAGE_CACHE_TTL;
      if (isCacheFresh) {
        setProfileImageUrl(cachedProfileImageUrl);
        return;
      }
      
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
            cachedProfileImageUrl = imageUrl;
            profileImageLoadTime = Date.now();
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
          cachedProfileImageUrl = profile.profile_picture_url;
          profileImageLoadTime = Date.now();
          setProfileImageUrl(profile.profile_picture_url);
        } else {
          cachedProfileImageUrl = null;
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
            setImageLoadError(true);
            cachedProfileImageUrl = null; // Clear cache on error
          }}
          onLoad={() => {}}
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

const isTestMode = false;

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
  user_id: string; // Add user_id for navigation
  name: string;
  age: number;
  // presentation fields per latest request
  height?: string;
  weight?: string;
  country?: string;
  city?: string;
  image: any;
  unlocked?: boolean; // computed: whether media should be visible
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

// Lightweight in-memory cache for instant home resume
let cachedUsers: UserProfileWithMedia[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const HOME_CACHE_KEY = 'hume_home_profiles_cache_v1';

// Cache for filter states to survive page refresh and auth redirects
let cachedFilters: any = null;
const FILTERS_CACHE_KEY = 'hume_filters_cache';
const RESET_FLAG_KEY = 'hume_reset_filters_on_login';

// Cross-platform storage utility
const Storage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [users, setUsers] = useState<UserProfileWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 24;
  const [filterLoading, setFilterLoading] = useState(false);
  const refRBSheet = useRef<any>(null);
  const imagePreloadRef = useRef(new Set<string>());

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
  const [selectedSeekingWifeNumber, setSelectedSeekingWifeNumber] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [oppositeGender, setOppositeGender] = useState<string | null>(null);
  const [isGalleryView, setIsGalleryView] = useState(false);
  const { isLoading: profileLoading } = useProfilePicture(refreshTrigger);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const baseWidth = ((windowWidth - 64) / 2) * 0.88; // baseline width
  // Make cards more vertical to match mobile phone aspect ratio (9:16 or similar)
  const baseHeight = baseWidth * 1.6; // Much more vertical ratio for mobile photos
  const cardWidth = isGalleryView ? windowWidth - 32 : baseWidth * 1.155 * 1.05; // gallery view: full width, grid view: increased width

  // Options arrays (matching database enums)
  const eyeColorOptions = ['Brown', 'Black', 'Hazel', 'Green', 'Blue', 'Gray', 'Amber'];
  const hairColorOptions = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Red', 'Gray', 'White'];
  const skinToneOptions = ['Very Fair', 'Fair', 'Medium', 'Olive', 'Dark', 'Very Dark'];
  const bodyTypeOptions = ['Slim', 'Athletic', 'Average', 'Curvy', 'Muscular'];
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

  // Format enum values for display (already in proper format)
  const formatEnumLabel = (value: string) => {
    return value; // Values are already properly formatted
  };

  // Save current filter state to cache
  const saveFiltersToCache = async () => {
    const filters = {
      ageRange,
      selectedCountry,
      selectedCity,
      availableCities,
      heightRange,
      weightRange,
      selectedEyeColor,
      selectedHairColor,
      selectedSkinTone,
      selectedBodyType,
      selectedEducation,
      selectedLanguages,
      selectedHousingType,
      selectedLivingCondition,
      selectedSocialCondition,
      selectedWorkStatus,
      selectedReligiousLevel,
      selectedPrayerFrequency,
      selectedQuranReading,
      selectedCoveringLevel,
      selectedBeardPractice,
      selectedAcceptedWifePositions,
      selectedSeekingWifeNumber,
    };
    
    cachedFilters = filters;
    
    try {
      await Storage.setItem(FILTERS_CACHE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.log('Error saving filters to storage:', error);
    }
  };

  // Restore filter state from cache
  const restoreFiltersFromCache = async () => {
    try {
      // First try in-memory cache
      if (cachedFilters) {
        applyFiltersToState(cachedFilters);
        return;
      }
      
      // Then try storage
      const savedFilters = await Storage.getItem(FILTERS_CACHE_KEY);
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        cachedFilters = filters;
        applyFiltersToState(filters);
      }
    } catch (error) {
      console.log('Error restoring filters from storage:', error);
    }
  };
  
  // Helper function to apply filters to state
  const applyFiltersToState = (filters: any) => {
    setAgeRange(filters.ageRange || [20, 50]);
    setSelectedCountry(filters.selectedCountry || '');
    setSelectedCity(filters.selectedCity || '');
    setAvailableCities(filters.availableCities || []);
    setHeightRange(filters.heightRange || [150, 200]);
    setWeightRange(filters.weightRange || [40, 120]);
    setSelectedEyeColor(filters.selectedEyeColor || []);
    setSelectedHairColor(filters.selectedHairColor || []);
    setSelectedSkinTone(filters.selectedSkinTone || []);
    setSelectedBodyType(filters.selectedBodyType || []);
    setSelectedEducation(filters.selectedEducation || []);
    setSelectedLanguages(filters.selectedLanguages || []);
    setSelectedHousingType(filters.selectedHousingType || []);
    setSelectedLivingCondition(filters.selectedLivingCondition || []);
    setSelectedSocialCondition(filters.selectedSocialCondition || []);
    setSelectedWorkStatus(filters.selectedWorkStatus || []);
    setSelectedReligiousLevel(filters.selectedReligiousLevel || []);
    setSelectedPrayerFrequency(filters.selectedPrayerFrequency || []);
    setSelectedQuranReading(filters.selectedQuranReading || []);
    setSelectedCoveringLevel(filters.selectedCoveringLevel || []);
    setSelectedBeardPractice(filters.selectedBeardPractice || []);
    setSelectedAcceptedWifePositions(filters.selectedAcceptedWifePositions || []);
    setSelectedSeekingWifeNumber(filters.selectedSeekingWifeNumber || []);
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
    if (selectedSeekingWifeNumber.length > 0) count++;
    
    return count;
  };

  const resetAllFilters = useCallback(async () => {
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
    setSelectedSeekingWifeNumber([]);
    // Clear cached filters
    cachedFilters = null;
    
    try {
      await Storage.removeItem(FILTERS_CACHE_KEY);
    } catch (error) {
      console.log('Error clearing filters from storage:', error);
    }
  }, []);



  // Smart prefetching of next batch
  const prefetchNextBatch = React.useCallback(async (currentUsers: UserProfileWithMedia[]) => {
    if (currentUsers.length < 10) return;
    
    // Extract image URIs to preload
    const imageUris = currentUsers
      .slice(-6) // Last 6 items
      .map(user => typeof user.image === 'object' && user.image?.uri ? user.image.uri : null)
      .filter(Boolean) as string[];
    
    // Preload in background
    imageCache.preloadBatch(imageUris).catch(() => {});
  }, []);

  // Fetch user profiles from database
  const fetchUserProfiles = async (ignoreFilters: boolean = false, isFilter: boolean = false, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setIsFetchingMore(true);
      } else if (isFilter) {
        setFilterLoading(true);
      } else {
      setLoading(true);
      }
      
      // Clear cache when gender filtering issues occur - temporary debug
      console.log('🔧 Clearing user cache for gender debug');
      cachedUsers = [];
      cachedAt = 0;
      
      // Get current user to exclude them from results and determine their gender
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Get current user's gender to show opposite gender profiles
      let currentUserGender = null;
      if (currentUser?.id) {
        const { data: currentUserProfile } = await supabase
          .from('user_profiles')
          .select('gender')
          .eq('user_id', currentUser.id)
          .single();
        
        currentUserGender = currentUserProfile?.gender;
      }

      const start = isLoadMore ? (page + 1) * PAGE_SIZE : 0;
      const end = start + PAGE_SIZE - 1;

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
          profile_picture_url,
          islamic_questionnaire
        `)
        .order('created_at', { ascending: false })
        .range(start, end);

      // Exclude current user if exists
      if (currentUser?.id) {
        query = query.neq('user_id', currentUser.id);
      }

      // Note: We'll calculate age on the client side since age column might be null

      // Apply gender filter based on current user's gender to show opposite gender
      if (currentUserGender) {
        const og = currentUserGender.toLowerCase() === 'male' ? 'female' : 'male';
        console.log('🔍 Gender Filter Debug:', {
          currentUserGender: currentUserGender,
          oppositeGender: og,
          currentUserLowercase: currentUserGender.toLowerCase()
        });
        setOppositeGender(og);
        query = query.eq('gender', og);
      } else {
        console.log('❌ No current user gender found');
      }

      const shouldApplyFilters = !ignoreFilters;

      // Apply country filter if selected
      if (shouldApplyFilters && selectedCountry) {
        query = query.eq('country', selectedCountry);
      }

      // Apply city filter if selected
      if (shouldApplyFilters && selectedCity) {
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

      // Apply religious filters (from islamic_questionnaire JSON)
      if (shouldApplyFilters && selectedReligiousLevel.length) {
        console.log('🔍 Filtering by religious_level:', selectedReligiousLevel);
        query = query.filter('islamic_questionnaire->>religious_level', 'in', `(${selectedReligiousLevel.join(',')})`);
      }
      if (shouldApplyFilters && selectedPrayerFrequency.length) {
        console.log('🔍 Filtering by prayer_frequency:', selectedPrayerFrequency);
        query = query.filter('islamic_questionnaire->>prayer_frequency', 'in', `(${selectedPrayerFrequency.join(',')})`);
      }
      if (shouldApplyFilters && selectedQuranReading.length) {
        console.log('🔍 Filtering by quran_reading_level:', selectedQuranReading);
        query = query.filter('islamic_questionnaire->>quran_reading_level', 'in', `(${selectedQuranReading.join(',')})`);
      }
      // Apply gender-specific filters
      if (oppositeGender === 'female') {
        if (shouldApplyFilters && selectedCoveringLevel.length) {
          console.log('🔍 Filtering by covering_level:', selectedCoveringLevel);
          query = query.filter('islamic_questionnaire->>covering_level', 'in', `(${selectedCoveringLevel.join(',')})`);
        }
        if (shouldApplyFilters && selectedAcceptedWifePositions.length) {
          console.log('🔍 Filtering by accepted_wife_positions:', selectedAcceptedWifePositions);
          // For arrays, we need to check if the JSON array contains any of the selected values
          selectedAcceptedWifePositions.forEach(position => {
            query = query.filter('islamic_questionnaire->accepted_wife_positions', 'cs', `["${position}"]`);
          });
        }
        if (shouldApplyFilters && selectedWorkStatus.length) {
          query = query.in('work_status', selectedWorkStatus);
        }
      }
      if (oppositeGender === 'male') {
        if (shouldApplyFilters && selectedBeardPractice.length) {
          console.log('🔍 Filtering by beard_practice:', selectedBeardPractice);
          query = query.filter('islamic_questionnaire->>beard_practice', 'in', `(${selectedBeardPractice.join(',')})`);
        }
        if (shouldApplyFilters && selectedSeekingWifeNumber.length) {
          console.log('🔍 Filtering by seeking_wife_number:', selectedSeekingWifeNumber);
          query = query.filter('islamic_questionnaire->>seeking_wife_number', 'in', `(${selectedSeekingWifeNumber.join(',')})`);
        }
        if (shouldApplyFilters && selectedSocialCondition.length) {
          query = query.in('social_condition', selectedSocialCondition);
        }
      }

      // Languages (array contains)
      if (shouldApplyFilters && selectedLanguages.length) {
        query = query.contains('languages_spoken', selectedLanguages);
      }

      const { data: profilesData, error } = await query;

      if (error) {
        console.error('❌ Query Error:', error);
        // Show no results on error
        setUsers([]);
        cachedUsers = [];
        cachedAt = Date.now();
        return;
      }

      console.log('🔍 Query Results:', {
        totalProfiles: profilesData?.length || 0,
        sampleProfile: profilesData?.[0]?.islamic_questionnaire,
        genderBreakdown: profilesData?.reduce((acc: any, profile: any) => {
          acc[profile.gender] = (acc[profile.gender] || 0) + 1;
          return acc;
        }, {}),
        appliedFilters: {
          currentUserGender,
          oppositeGender,
          selectedReligiousLevel,
          selectedSeekingWifeNumber,
          selectedAcceptedWifePositions,
          selectedBeardPractice,
          selectedCoveringLevel
        }
      });

      // Build a fallback map of profile picture URLs from media_references for users
      // who don't have profile_picture_url set in user_profiles
      let userIdToProfilePic: Record<string, string> = {};
      if (profilesData && profilesData.length > 0) {
        try {
          const missingUserIds = profilesData
            .filter((p: any) => !p.profile_picture_url)
            .map((p: any) => p.user_id);

          if (missingUserIds.length > 0) {
            const { data: mediaRows } = await supabase
              .from('media_references')
              .select('user_id, do_spaces_cdn_url, do_spaces_url, external_url, is_profile_picture, media_type')
              .in('user_id', missingUserIds)
              .eq('is_profile_picture', true)
              .eq('media_type', 'photo');

            if (mediaRows && mediaRows.length > 0) {
              mediaRows.forEach((row: any) => {
                const url = row.do_spaces_cdn_url || row.do_spaces_url || row.external_url;
                if (url) {
                  userIdToProfilePic[row.user_id] = url;
                }
              });
            }
          }
        } catch (e) {
          // Silent error handling for media references
        }
      }

      if (profilesData && profilesData.length > 0) {
        // Preload interests to compute media visibility
        let pendingIncomingFrom: Set<string> = new Set();
        let approvedWith: Set<string> = new Set();
        try {
          const { data: { user: me } } = await supabase.auth.getUser();
          if (me) {
            const [outgoingPending, incomingPending, approvedList] = await Promise.all([
              InterestsService.listOutgoing(),
              InterestsService.listIncoming(),
              InterestsService.listApproved(),
            ]);
            // Incoming pending interests = other users who sent to me → their photos should be open
            incomingPending.forEach(r => pendingIncomingFrom.add(r.sender_id));
            // Approved interests → photos open both ways
            approvedList.forEach(r => {
              if (r.sender_id === me.id) approvedWith.add(r.receiver_id);
              else if (r.receiver_id === me.id) approvedWith.add(r.sender_id);
            });
          }
        } catch {}

        const usersWithMedia = profilesData.map((profile) => {
          // Calculate age from date_of_birth
          const birthDate = new Date(profile.date_of_birth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear() - 
                     (today.getMonth() < birthDate.getMonth() || 
                      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

          // Apply age filter
          if (shouldApplyFilters && ageRange[0] && ageRange[1] && ageRange[0] > 0 && ageRange[1] > 0 && (age < ageRange[0] || age > ageRange[1])) {
            return null; // Will be filtered out
          }

          // Use profile_picture_url from user_profiles, or fallback to media_references map
          const imageUrl = (profile as any).profile_picture_url || userIdToProfilePic[(profile as any).user_id];

          const isFemale = (profile as any).gender === 'female' || (profile as any).gender === 'Female';

          const processedProfile = {
            id: profile.id,
            user_id: profile.user_id, // Add user_id for navigation
            name: `${profile.first_name}`.trim(),
            age: age,
            height: profile.height_cm ? `${profile.height_cm}cm` : undefined,
            weight: profile.weight_kg ? `${profile.weight_kg}kg` : undefined,
            country: profile.country || undefined,
            city: profile.city || undefined,
            image: imageUrl ? { uri: imageUrl } : (isFemale ? images.femaleSilhouette : images.maleSilhouette),
            unlocked: approvedWith.has((profile as any).user_id) || pendingIncomingFrom.has((profile as any).user_id)
          };

          return processedProfile;
        }).filter(profile => profile !== null) as UserProfileWithMedia[]; // Remove null entries

        // Append or replace depending on load mode
        if (isLoadMore) {
          const newUsers = [...users, ...usersWithMedia];
          setUsers(newUsers);
          setPage(prev => prev + 1);
          // Smart prefetch for smooth scrolling
          prefetchNextBatch(newUsers);
          // Aggressive image preloading for next visible items
          const nextImages = usersWithMedia
            .slice(0, 6)
            .map(u => typeof u.image === 'object' && u.image?.uri ? u.image.uri : null)
            .filter(Boolean) as string[];
          nextImages.forEach(uri => {
            if (!imagePreloadRef.current.has(uri)) {
              imagePreloadRef.current.add(uri);
              imageCache.preloadImage(uri).catch(() => {});
            }
          });
        } else {
          setUsers(usersWithMedia);
          setPage(0);
          setHasMore(true);
          // Preload first batch of images aggressively
          const firstImages = usersWithMedia
            .slice(0, 8)
            .map(u => typeof u.image === 'object' && u.image?.uri ? u.image.uri : null)
            .filter(Boolean) as string[];
          firstImages.forEach(uri => {
            if (!imagePreloadRef.current.has(uri)) {
              imagePreloadRef.current.add(uri);
              imageCache.preloadImage(uri).catch(() => {});
            }
          });
          prefetchNextBatch(usersWithMedia);
        }
        // cache results for instant navigation back
        cachedUsers = isLoadMore && Array.isArray(cachedUsers)
          ? [...cachedUsers, ...usersWithMedia]
          : usersWithMedia;
        cachedAt = Date.now();
        // persist to storage for cold starts
        try {
          const toStore = isLoadMore && Array.isArray(cachedUsers)
            ? [...(cachedUsers as UserProfileWithMedia[])]
            : usersWithMedia;
          await Storage.setItem(HOME_CACHE_KEY, JSON.stringify({ users: toStore, cachedAt }));
        } catch {}

        // Determine if there are more pages
        if (profilesData.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        // No profiles found
        if (!isLoadMore) {
          setUsers([]);
          cachedUsers = [];
          cachedAt = Date.now();
        }
        try {
          await Storage.setItem(HOME_CACHE_KEY, JSON.stringify({ users: [], cachedAt }));
        } catch {}
        setHasMore(false);
      }
    } catch (error) {
      // Show no results on exception
      if (!isLoadMore) {
        setUsers([]);
        cachedUsers = [];
        cachedAt = Date.now();
      }
    } finally {
      if (isLoadMore) {
        setIsFetchingMore(false);
      } else if (isFilter) {
        setFilterLoading(false);
      } else {
      setLoading(false);
      }
    }
  };

    // Render instantly from cache when available; fetch only when needed
  useFocusEffect(
    React.useCallback(() => {
      const initializeScreen = async () => {
        // Render from persistent cache immediately if present
        try {
          const stored = await Storage.getItem(HOME_CACHE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.users?.length) {
              setUsers(parsed.users as UserProfileWithMedia[]);
              setLoading(false);
            }
          }
        } catch {}

        // If coming from a fresh login, reset filters once
        try {
          const resetFlag = await Storage.getItem(RESET_FLAG_KEY);
          if (resetFlag) {
            await resetAllFilters();
            await Storage.removeItem(RESET_FLAG_KEY);
            await fetchUserProfiles(true);
            return;
          }
        } catch {}

        // Otherwise, restore previous filters
        await restoreFiltersFromCache();
        
        const isFresh = cachedUsers && (Date.now() - cachedAt) < CACHE_TTL_MS;
        if (isFresh) {
          setUsers(cachedUsers as UserProfileWithMedia[]);
          setLoading(false);
          return;
        }
    fetchUserProfiles();
      };
      
      initializeScreen();
  }, [])
  );

  // Add a manual refresh function for testing
  const handleRefresh = () => {
    // Reset and refetch from page 0
    setPage(0);
    setHasMore(true);
    fetchUserProfiles(false, false, false);
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
        
        // Set display name (first name only)
        if (profile?.first_name) {
          setDisplayName(profile.first_name);
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
            }]}>{(displayName || 'Welcome').slice(0, 15)}{(displayName && displayName.length > 15) ? '…' : ''}</Text>
          </View>
        </View>
        <View style={styles.viewRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('settingsnotifications')}
            style={styles.notifButton}
          >
            <Image
              source={icons.notificationBell}
              resizeMode='contain'
              style={[styles.bellIcon, { tintColor: COLORS.greyscale900 }]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsGalleryView(!isGalleryView)}
            style={styles.galleryButton}>
            {isGalleryView ? (
              // Big card view: single rounded rectangle
              <View style={styles.gridIcon}>
                <View style={styles.singleRoundedRect} />
              </View>
            ) : (
              // Grid view: 2x2 circles
              <View style={styles.gridIcon}>
                <View style={styles.gridRow}>
                  <View style={styles.gridSquare} />
                  <View style={styles.gridSquare} />
                </View>
                <View style={styles.gridRow}>
                  <View style={styles.gridSquare} />
                  <View style={styles.gridSquare} />
                </View>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => !filterLoading && refRBSheet.current?.open()}
            disabled={filterLoading}
            style={[styles.filterButton, filterLoading && { opacity: 0.7 }]}>
            {filterLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
            <Image
              source={icons.filter}
              resizeMode='contain'
              style={[styles.bellIcon, { tintColor: COLORS.greyscale900 }]}
            />
            )}
            {!filterLoading && getActiveFiltersCount() > 0 && (
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


  // Optimized render with smart preloading
  React.useEffect(() => {
    if (users.length > 0) {
      // Preload visible images immediately
      const visibleImages = users.slice(0, 8)
        .map(user => typeof user.image === 'object' && user.image?.uri ? user.image.uri : null)
        .filter(Boolean) as string[];
      imageCache.preloadBatch(visibleImages).catch(() => {});
    }
  }, [users]);

  const renderItem = React.useCallback(({ item }: { item: UserProfileWithMedia }) => {
    const cardHeight = isGalleryView ? baseHeight * 1.3 : baseHeight; // More vertical in gallery view
    const isSilhouette = !item.image?.uri || item.image === images.femaleSilhouette || item.image === images.maleSilhouette;
    return (
      <MatchCard
        name={item.name}
        age={item.age}
        image={item.image}
        height={item.height}
        weight={item.weight}
        country={item.country}
        city={item.city}
        onPress={() => navigation.navigate("matchdetails", { userId: item.user_id })}
        containerStyle={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}
        imageStyle={{ resizeMode: 'cover', alignSelf: 'center' }} // Ensure full photo display, top-aligned
        locked={!item.unlocked && !isSilhouette}
      />
    );
  }, [navigation, cardWidth, baseHeight, isGalleryView]);

  const getItemLayout = React.useCallback((_: any, index: number) => {
    const cardHeight = isGalleryView ? baseHeight * 1.3 : baseHeight;
    const columnsPerRow = isGalleryView ? 1 : 2;
    const rowIndex = Math.floor(index / columnsPerRow);
    const rowHeight = cardHeight + 24; // card height + marginBottom
    const offset = 16 + rowIndex * rowHeight; // list paddingTop = 16
    return { length: rowHeight, offset, index };
  }, [baseHeight, isGalleryView]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}> 
        <View style={[styles.container, { backgroundColor: COLORS.white }]}> 
          {renderHeader()} 
          <HomeListSkeleton isGalleryView={isGalleryView} />
        </View> 
      </SafeAreaView> 
    );
  }

  if (!loading && users.length === 0) {
              return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No matches found with current filters</Text>
            <Text style={[styles.loadingText, { fontSize: 14, marginTop: 8, opacity: 0.7 }]}>
              Try adjusting your filters to see more results
            </Text>
          </View>

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
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{formatEnumLabel(option)}</Text>
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
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{formatEnumLabel(option)}</Text>
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
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{formatEnumLabel(option)}</Text>
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
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{formatEnumLabel(option)}</Text>
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

              {/* Male Seeking Wife Preferences (show when filtering male profiles) */}
              {oppositeGender === 'male' && (
                <>
                  <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Looking For Which Wife</Text>
                  <View style={styles.horizontalMultiSelect}>
                    {acceptedWifeOptions.map((option: string) => {
                      const selected = selectedSeekingWifeNumber.includes(option);
                      return (
                        <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedSeekingWifeNumber, setSelectedSeekingWifeNumber)}>
                          <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Female Accepted Wife Positions (show when filtering female profiles) */}
              {oppositeGender === 'female' && (
                <>
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
                </>
              )}

            </View>
            </ScrollView>
            <View style={styles.separateLine} />

            <View style={styles.bottomContainer}>
              <Button
                title="Reset"
                style={[styles.cancelButton, filterLoading && { opacity: 0.7 }]}
                textColor={COLORS.primary}
                disabled={filterLoading}
                onPress={async () => {
                  if (!filterLoading) {
                    await resetAllFilters();
                    // Immediately fetch ignoring filters so user sees results without reopening
                    fetchUserProfiles(true, true);
                    refRBSheet.current?.close();
                  }
                }}
              />
              <Button
                title="Apply"
                filled
                style={[styles.logoutButton, filterLoading && { opacity: 0.7 }]}
                disabled={filterLoading}
                onPress={async () => {
                  if (!filterLoading) {
                    await saveFiltersToCache();
                    fetchUserProfiles(false, true);
                    refRBSheet.current?.close();
                  }
                }}
              />
            </View>
          </RBSheet>
        </View>
      </SafeAreaView>
    );
  }

              return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
        <View style={{ flex: 1 }}>
        <FlatGrid
          itemDimension={isGalleryView ? windowWidth - 32 : baseWidth * 1.155 * 1.05}
          data={users}
          style={{ flex: 1 }}
          spacing={isGalleryView ? 0 : 12}
          renderItem={({ item, index }) => {
            const cardHeight = isGalleryView ? baseHeight * 1.3 : baseHeight;
            const isSilhouette = !item.image?.uri || item.image === images.femaleSilhouette || item.image === images.maleSilhouette;
            return (
              <MatchCard
                name={item.name}
                age={item.age}
                image={item.image}
                height={item.height}
                weight={item.weight}
                country={item.country}
                city={item.city}
                onPress={() => navigation.navigate("matchdetails", { userId: item.user_id })}
                containerStyle={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}
                imageStyle={{ resizeMode: 'cover', alignSelf: 'center' }}
                locked={!item.unlocked && !isSilhouette}
              />
            );
          }}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
                      initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={3}
            removeClippedSubviews={true}
            onEndReachedThreshold={0.2}
          onEndReached={() => {
            if (!isFetchingMore && hasMore && users.length >= PAGE_SIZE) {
              fetchUserProfiles(false, false, true);
            }
          }}
          ListFooterComponent={isFetchingMore ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null}
        />
          {filterLoading && (
            <View style={styles.filterLoadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.filterLoadingText}>Applying filters...</Text>
            </View>
          )}
        </View>

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
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{formatEnumLabel(option)}</Text>
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
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{formatEnumLabel(option)}</Text>
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
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{formatEnumLabel(option)}</Text>
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
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{formatEnumLabel(option)}</Text>
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

            {/* Male Seeking Wife Preferences (show when filtering male profiles) */}
            {oppositeGender === 'male' && (
              <>
                <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>Looking For Which Wife</Text>
                <View style={styles.horizontalMultiSelect}>
                  {acceptedWifeOptions.map((option: string) => {
                    const selected = selectedSeekingWifeNumber.includes(option);
                    return (
                      <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedSeekingWifeNumber, setSelectedSeekingWifeNumber)}>
                        <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Female Accepted Wife Positions (show when filtering female profiles) */}
            {oppositeGender === 'female' && (
              <>
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
              </>
            )}

          </View>
          </ScrollView>
          <View style={styles.separateLine} />

          <View style={styles.bottomContainer}>
            <Button
              title="Reset"
              style={[styles.cancelButton, filterLoading && { opacity: 0.7 }]}
              textColor={COLORS.primary}
              disabled={filterLoading}
              onPress={async () => {
                if (!filterLoading) {
                  await resetAllFilters();
                // Immediately fetch ignoring filters so user sees results without reopening
                  fetchUserProfiles(true, true);
                refRBSheet.current?.close();
                }
              }}
            />
            <Button
              title="Apply"
              filled
                style={[styles.logoutButton, filterLoading && { opacity: 0.7 }]}
                disabled={filterLoading}
                onPress={async () => {
                  if (!filterLoading) {
                    await saveFiltersToCache();
                    fetchUserProfiles(false, true);
                refRBSheet.current?.close();
                  }
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
    fontSize: 13,
    fontFamily: "regular",
    color: "gray",
    marginBottom: 4
  },
  title: {
    fontSize: 14.5,
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
  notifButton: {
    padding: 4,
    marginRight: 4,
  },
  bellIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black,
    marginRight: 4
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
    padding: getResponsiveSpacing(4),
  },
  galleryButton: {
    padding: getResponsiveSpacing(4),
    marginRight: getResponsiveSpacing(4),
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
  // Modern Material Design 3 inspired buttons
  modernButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.grayscale100,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  modernButtonActive: {
    backgroundColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modernButtonIcon: {
    width: 20,
    height: 20,
  },
  modernBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  modernBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: 'bold',
    textAlign: 'center',
  },
  // Custom icons for gallery toggle
  gridIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  // For grid view: horizontal layout of two vertical rectangles
  gridIconHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  // For gallery view: 2x2 grid of rounded squares
  gridRow: {
    flexDirection: 'row',
    marginVertical: 1.5,
  },
  gridSquare: {
    width: 7,
    height: 7,
    backgroundColor: COLORS.greyscale900,
    borderRadius: 3.5,
    marginHorizontal: 1.5,
  },
  // Big card view icon: one rounded rectangle
  singleRoundedRect: {
    width: 16,
    height: 10,
    backgroundColor: COLORS.greyscale900,
    borderRadius: 3,
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
  filterLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  filterLoadingText: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.greyscale900,
    marginTop: 12,
    textAlign: 'center',
  },
})

export default HomeScreen