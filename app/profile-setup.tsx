// ============================================================================
// PROFILE SETUP SCREEN - HUME ISLAMIC DATING APP
// ============================================================================
// Multi-step profile completion after initial signup
// ============================================================================

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, TextInput, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { COLORS, SIZES, icons } from '../constants';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import DatePickerModal from '../components/DatePickerModal';
import SearchableDropdown from '../components/SearchableDropdown';
// Import removed - we'll implement steps directly
import { getResponsiveFontSize, getResponsiveSpacing, safeGoBack } from '../utils/responsive';
import { phoneCodesData } from '../data/phoneCodes';
import { getCountriesAsDropdownItems, getCitiesForCountry } from '../data/countries';
import RegistrationService, { RegistrationData } from '../src/services/registration.service';
import type { GenderType } from '../src/types/database.types';
import { PhotosVideosAPI } from '../src/api/photos-videos.api';
import { launchMediaPicker } from '../utils/ImagePickerHelper';
import { supabase } from '../src/config/supabase';
import { Image } from 'expo-image';
import { DEFAULT_VIDEO_THUMBNAIL } from '../constants/defaultThumbnails';
import type { PhotoVideoItem } from '../src/services/photos-videos.service';
import { generateVideoThumbnail } from '../utils/videoThumbnailGenerator';

// ================================
// VALIDATION SCHEMAS
// ================================

  const basicInfoSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name must contain only letters'),
  lastName: z.string()
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Last name must contain only letters')
    .optional(),
  aboutMe: z.string()
    .max(500, 'About Me must be less than 500 characters')
    .optional(),
  dateOfBirth: z.string()
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 80;
    }, 'You must be between 18 and 80 years old'),
  gender: z.enum(['male', 'female'] as const),
  phoneCode: z.string().min(1, 'Phone code is required'),
  mobileNumber: z.string()
    .min(8, 'Mobile number must be at least 8 digits')
    .max(15, 'Mobile number must be less than 15 digits')
    .regex(/^[0-9]+$/, 'Mobile number must contain only numbers'),
  country: z.string().min(2, 'Country is required'),
  city: z.string().min(2, 'City is required'),
});

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
  languagesSpoken: z.array(z.string()).min(1, 'At least one language is required'),
  occupation: z.string().optional(), // Made optional for females who select "Not Working"
  income: z.string().optional(),
  socialCondition: z.string().optional(), // For males
  housingType: z.string().min(1, 'Housing type is required'),
  livingCondition: z.string().min(1, 'Living condition is required'),
  workStatus: z.string().optional(), // For females: "Not Working" or "Working"
});

const religiousSchema = z.object({
  religiousLevel: z.string().min(1, 'Religious level is required'),
  prayerFrequency: z.string().min(1, 'Prayer frequency is required'),
  quranReading: z.string().min(1, 'Quran reading level is required'),
  hijabPractice: z.string().optional(), // Only for females (legacy)
  coveringLevel: z.string().optional(), // New field for females
  beardPractice: z.string().optional(), // Only for males
});

const polygamySchema = z.object({
  seekingWifeNumber: z.string().optional(), // For males - single selection
  acceptedWifePositions: z.array(z.string()).optional(), // For females - multi selection
});

type BasicInfoForm = z.infer<typeof basicInfoSchema>;
type PhysicalDetails = z.infer<typeof physicalDetailsSchema>;
type LifestyleDetails = z.infer<typeof lifestyleSchema>;
type ReligiousDetails = z.infer<typeof religiousSchema>;
type PolygamyDetails = z.infer<typeof polygamySchema>;



// ================================
// PROFILE SETUP COMPONENT
// ================================

const ProfileSetup: React.FC = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [comprehensiveData, setComprehensiveData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [photosCount, setPhotosCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [photos, setPhotos] = useState<PhotoVideoItem[]>([]);
  const [videos, setVideos] = useState<PhotoVideoItem[]>([]);
  const [videoThumbs, setVideoThumbs] = useState<Record<string, string>>({});
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenItem, setFullScreenItem] = useState<PhotoVideoItem | null>(null);
  const [fullScreenType, setFullScreenType] = useState<'photo' | 'video'>('video');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper: convert CDN to direct URL to avoid CORS issues on web
  const getDirectUrl = (url: string) => {
    if (url && url.includes('.cdn.')) {
      return url.replace('.cdn.digitaloceanspaces.com', '.digitaloceanspaces.com');
    }
    return url;
  };

  // Form states for each step
  const [physicalDetails, setPhysicalDetails] = useState<Partial<PhysicalDetails>>({});
  const [lifestyleDetails, setLifestyleDetails] = useState<Partial<LifestyleDetails>>({});
  const [religiousDetails, setReligiousDetails] = useState<Partial<ReligiousDetails>>({});
  const [polygamyDetails, setPolygamyDetails] = useState<Partial<PolygamyDetails>>({});

  // Form management for Step 1 (Basic Info)
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
          defaultValues: {
      firstName: '',
      lastName: '',
      aboutMe: '',
      dateOfBirth: '',
      gender: undefined,
      phoneCode: '',
      mobileNumber: '',
      country: '',
      city: '',
    }
  });

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

  const watchedValues = watch();

  // Step 1: Basic Info
  const handleBasicInfo = async (data: BasicInfoForm) => {
    setComprehensiveData({ ...comprehensiveData, basicInfo: data });
    setCurrentStep(2);
  };

  // Step 2: Physical Details
  const handlePhysicalDetailsNext = (data: PhysicalDetails) => {
    setPhysicalDetails(data);
    setCurrentStep(3);
  };

  // Step 3: Lifestyle & Work
  const handleLifestyleNext = (data: LifestyleDetails) => {
    setLifestyleDetails(data);
    setCurrentStep(4);
  };

  // Step 4: Religious Commitment
  const handleReligiousNext = (data: ReligiousDetails) => {
    setReligiousDetails(data);
    setCurrentStep(5);
  };

  // Step 5: Complete Registration
  const handlePolygamyComplete = async () => {
    setIsLoading(true);
    try {
      const completeProfile = {
        basicInfo: comprehensiveData.basicInfo,
        physicalDetails,
        lifestyleDetails,
        religiousDetails,
        polygamyDetails,
        gender: watchedValues.gender,
      };

      await RegistrationService.createComprehensiveProfile(completeProfile);
      
      // Show success message and navigate to home
      Alert.alert(
        'Profile Complete!',
        'Your Islamic dating profile has been created successfully!',
        [
          {
            text: 'Start Browsing',
            onPress: () => router.replace('/(tabs)/home')
          }
        ],
        { cancelable: false }
      );
      
      // Automatic navigation after 2 seconds as backup
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 2000);
    } catch (error: any) {
      console.error('Profile completion error:', error);
      Alert.alert('Error', 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure minimal profile for media uploads
  const ensureMinimalProfileForMedia = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) return true;

      const basic = watchedValues;
      if (!basic.firstName || !basic.gender || !basic.dateOfBirth || !basic.country || !basic.city) {
        return false;
      }
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          first_name: basic.firstName,
          last_name: basic.lastName || '',
          gender: basic.gender,
          date_of_birth: new Date(basic.dateOfBirth).toISOString().split('T')[0],
          country: basic.country,
          city: basic.city,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      return !error;
    } catch (e) {
      return false;
    }
  };

  const loadMyMedia = async () => {
    try {
      setMediaLoading(true);
      const ensured = await ensureMinimalProfileForMedia();
      if (!ensured) {
        setPhotosCount(0);
        setVideosCount(0);
        setPhotos([]);
        setVideos([]);
        return;
      }
      const result = await PhotosVideosAPI.getMyMedia();
      if (result.success && result.data) {
        setPhotos(result.data.photos);
        setVideos(result.data.videos);
        setPhotosCount(result.data.photos.length);
        setVideosCount(result.data.videos.length);
        // Generate thumbnails client-side for videos missing one
        try {
          const toProcess = (result.data.videos || []).filter(v => !v.thumbnail_url || !(v.thumbnail_url.includes('.png') || v.thumbnail_url.includes('.jpg') || v.thumbnail_url.includes('.jpeg') || v.thumbnail_url.includes('.webp')));
          for (const v of toProcess) {
            try {
              const res = await fetch(getDirectUrl(v.external_url));
              const blob = await res.blob();
              const thumb = await generateVideoThumbnail(blob, { width: 400, height: 300, quality: 0.8 });
              if (thumb && thumb.length > 1000) {
                setVideoThumbs(prev => ({ ...prev, [v.id]: thumb }));
              }
            } catch (err) {
              // ignore per-item errors
            }
          }
        } catch {}
      } else {
        setPhotosCount(0);
        setVideosCount(0);
        setPhotos([]);
        setVideos([]);
      }
    } finally {
      setMediaLoading(false);
    }
  };

  const pickAndUploadMedia = async (type: 'photo' | 'video') => {
    try {
      setMediaUploading(true);
      const media = await launchMediaPicker(type);
      if (!media) return;
      const response = await fetch(media.uri);
      let blob = await response.blob();
      if (media.mimeType) {
        blob = new Blob([blob], { type: media.mimeType });
      }
      // Validate size before upload
      const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
      const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
      if (type === 'photo' && blob.size > MAX_PHOTO_SIZE) {
        Alert.alert('File too large', 'Photo size must be less than 10MB.');
        return;
      }
      if (type === 'video' && blob.size > MAX_VIDEO_SIZE) {
        Alert.alert('File too large', 'Video size must be less than 100MB.');
        return;
      }
      const result = type === 'photo'
        ? await PhotosVideosAPI.uploadPhoto(blob, { visibility: 'private' })
        : await PhotosVideosAPI.uploadVideo(blob, { visibility: 'private' });
      if (result.success) {
        // If this is the first photo (no avatar yet), set uploaded photo as avatar
        if (type === 'photo') {
          try {
            const mediaAfter = await PhotosVideosAPI.getMyMedia();
            const hasAvatar = mediaAfter.success && mediaAfter.data?.photos?.some((p) => p.is_profile_picture);
            if (!hasAvatar && result.data?.id) {
              await PhotosVideosAPI.setProfilePicture(result.data.id);
            }
          } catch {}
        }
        await loadMyMedia();
        Alert.alert('Success', type === 'photo' ? 'Photo uploaded successfully' : 'Video uploaded successfully');
      } else {
        Alert.alert('Error', result.error || 'Upload failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to upload media');
    } finally {
      setMediaUploading(false);
    }
  };

  React.useEffect(() => {
    if (currentStep === 5) {
      loadMyMedia();
    }
  }, [currentStep]);

  const handleMediaNext = () => {
    if (photos.length < 3) {
      Alert.alert('Add Photos', 'Please upload at least 3 photos to continue.');
      return;
    }
    setCurrentStep(6);
  };

  const setAsAvatar = async (id: string) => {
    try {
      setMediaLoading(true);
      const result = await PhotosVideosAPI.setProfilePicture(id);
      if (result.success) {
        await loadMyMedia();
        Alert.alert('Success', 'Photo set as profile avatar!');
      } else {
        Alert.alert('Error', result.error || 'Failed to set avatar');
      }
    } finally {
      setMediaLoading(false);
    }
  };

  const handleDeleteMedia = async (id: string, type: 'photo' | 'video') => {
    try {
      setMediaLoading(true);
      const result = await PhotosVideosAPI.deleteMedia(id);
      if (result.success) {
        // If avatar was deleted and there are remaining photos without avatar, set first as avatar
        try {
          const mediaAfter = await PhotosVideosAPI.getMyMedia();
          const photosList = mediaAfter.success ? (mediaAfter.data?.photos || []) : [];
          const hasAvatar = photosList.some((p) => p.is_profile_picture);
          if (!hasAvatar && photosList.length > 0) {
            await PhotosVideosAPI.setProfilePicture(photosList[0].id);
          }
        } catch {}
        await loadMyMedia();
      } else {
        Alert.alert('Error', result.error || 'Delete failed');
      }
    } finally {
      setMediaLoading(false);
    }
  };

  const renderPhotoItem = ({ item }: { item: PhotoVideoItem }) => {
    const getPhotoUrl = () => {
      if (item.thumbnail_url && (
        item.thumbnail_url.includes('.jpg') ||
        item.thumbnail_url.includes('.jpeg') ||
        item.thumbnail_url.includes('.png') ||
        item.thumbnail_url.includes('.webp')
      )) {
        return getDirectUrl(item.thumbnail_url);
      } else {
        return getDirectUrl(item.external_url);
      }
    };

    return (
      <View style={styles.mediaItem}>
        <TouchableOpacity 
          style={styles.imageContainer}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: getPhotoUrl() }}
            contentFit="cover"
            style={styles.photoItem}
            cachePolicy="memory-disk"
            transition={200}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => setAsAvatar(item.id)}
          activeOpacity={0.5}
        >
          <Text style={styles.buttonText}>Main</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { zIndex: 99 }]}
          onPress={() => handleDeleteMedia(item.id, 'photo')}
          activeOpacity={0.5}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>

        {item.is_profile_picture && (
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>Current Avatar</Text>
          </View>
        )}
      </View>
    );
  };

  const renderVideoItem = ({ item }: { item: PhotoVideoItem }) => {
    const localThumb = videoThumbs[item.id];
    const thumbRaw = localThumb || item.thumbnail_url || DEFAULT_VIDEO_THUMBNAIL;
    const thumb = thumbRaw.startsWith('http') ? getDirectUrl(thumbRaw) : thumbRaw;
    const isPlayingInline = playingVideoId === item.id;
    const mediaUrl = getDirectUrl(item.external_url);
    return (
      <View style={styles.mediaItem}>
        <TouchableOpacity 
          style={styles.videoContainer} 
          activeOpacity={0.8}
          onPress={() => {
            if (Platform.OS === 'web') {
              setPlayingVideoId(prev => prev === item.id ? null : item.id);
            }
          }}
        >
          {isPlayingInline && Platform.OS === 'web' ? (
            <video
              src={mediaUrl}
              style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, backgroundColor: 'transparent' }}
              controls
              playsInline
              autoPlay
            />
          ) : (
            <>
              <Image
                source={{ uri: thumb }}
                contentFit="contain"
                style={[styles.videoItem, { objectFit: 'contain' }]}
                cachePolicy="none"
                transition={200}
              />
              <View style={styles.playButton}>
                <Text style={styles.playButtonText}>Play</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { zIndex: 99 }]}
          onPress={() => handleDeleteMedia(item.id, 'video')}
          activeOpacity={0.5}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Full screen handling (reusing light version)
  const openFullScreen = (item: PhotoVideoItem, type: 'photo' | 'video') => {
    setFullScreenItem(item);
    setFullScreenType(type);
    setFullScreenVisible(true);
    setIsVideoPlaying(type === 'video');
  };

  const closeFullScreen = () => {
    setFullScreenVisible(false);
    setFullScreenItem(null);
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const renderFullScreenModal = () => {
    if (!fullScreenItem) return null;
    const mediaUrl = getDirectUrl(fullScreenItem.external_url);
    return (
      <Modal
        visible={fullScreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreen}
      >
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity onPress={closeFullScreen} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fullScreenContent}>
            {fullScreenType === 'photo' ? (
              <Image source={{ uri: mediaUrl }} contentFit="contain" style={styles.fullScreenImage} />
            ) : (
              <View style={styles.fullScreenVideoContainer}>
                {Platform.OS === 'web' ? (
                  <video
                    ref={videoRef}
                    src={mediaUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'transparent' }}
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <View style={styles.nativeVideoPlaceholder}>
                    <Text style={styles.nativeVideoText}>Video Player</Text>
                    <Text style={styles.nativeVideoSubtext}>Native video player not implemented</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      // If on first step, go back to previous screen with safe navigation
      safeGoBack(navigation, router, '/welcome');
    }
  };

  // Handle country selection and update cities
  const handleCountryChange = (selectedCountry: { label: string; value: string }) => {
    setSelectedCountry(selectedCountry.value);
    setValue('country', selectedCountry.value);
    
    // Update available cities based on selected country
    const cities = getCitiesForCountry(selectedCountry.value);
    setAvailableCities(cities.map(city => city.value));
    
    // Clear city selection when country changes
    setValue('city', '');
  };

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

  const languageOptions = [
    { label: 'Arabic', value: 'Arabic' },
    { label: 'English', value: 'English' },
    { label: 'Turkish', value: 'Turkish' },
    { label: 'Russian', value: 'Russian' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'French', value: 'French' },
    { label: 'Urdu', value: 'Urdu' }
  ];

  const housingOptions = [
    'Rent Apartment', 'Rent House', 'Own Apartment', 'Own House', 
    'Family Home', 'Shared Accommodation', 'Other'
  ];

  const livingConditionOptions = [
    { label: 'Living with Parents', value: 'living_with_parents' },
    { label: 'Living Alone', value: 'living_alone' },
    { label: 'Living with Children', value: 'living_with_children' }
  ];

  const socialConditionOptions = [
    { label: 'Sufficient', value: 'sufficient' },
    { label: 'Rich', value: 'rich' },
    { label: 'Very Rich', value: 'very_rich' }
  ];

  const coveringLevelOptions = [
    { label: 'Will Cover', value: 'will_cover' },
    { label: 'Hijab', value: 'hijab' },
    { label: 'Niqab', value: 'niqab' }
  ];

  const workStatusOptions = [
    { label: 'Not Working', value: 'not_working' },
    { label: 'Working', value: 'working' }
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

  // Helper function for multi-select (for languages)
  const renderMultiSelector = (
    title: string,
    options: { label: string; value: string }[],
    selectedValues: string[],
    onToggle: (value: string) => void,
    required = false
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title} {required && '*'}</Text>
      <Text style={styles.multiSelectNote}>You can select multiple languages</Text>
      <View style={styles.multiSelectContainer}>
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
      {selectedValues.length > 0 && (
        <Text style={styles.selectedCount}>
          {selectedValues.length} language{selectedValues.length > 1 ? 's' : ''} selected
        </Text>
      )}
    </View>
  );

  // Final submission
  const handleCompleteProfile = async () => {
    setIsLoading(true);
    try {
      const registrationData: RegistrationData = {
        firstName: watchedValues.firstName!,
        lastName: watchedValues.lastName || '',
        aboutMe: watchedValues.aboutMe || '',
        email: '', // This will be taken from auth context
        dateOfBirth: watchedValues.dateOfBirth!,
        gender: watchedValues.gender!,
        country: watchedValues.country!,
        city: watchedValues.city!,
      };

      // Register with simplified preferences  
      await RegistrationService.createProfileWithPreferences(registrationData, islamicPreferences);

      Alert.alert(
        'Profile Complete!',
        'Your profile has been set up successfully. Welcome to Hume!',
        [
          {
            text: 'Start Browsing',
            onPress: () => navigation.navigate('(tabs)')
          }
        ]
      );
    } catch (error: any) {
      console.error('Profile completion error:', error);
      Alert.alert('Error', 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <Header 
          showBackButton={currentStep > 1} 
          onBackPress={handleBack}
        />

        {/* Step Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 6) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {currentStep} of 6</Text>
        </View>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <ScrollView 
            style={styles.stepContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.stepScrollContent}
          >
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSubtitle}>
              Let's get to know you better
            </Text>

            <View style={styles.formContainer}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    id="firstName"
                    placeholder="First Name *"
                    onInputChanged={(id, text) => onChange(text)}
                    errorText={errors.firstName?.message}
                    icon={icons.user}
                  />
                )}
              />

              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    id="lastName"
                    placeholder="Last Name"
                    onInputChanged={(id, text) => onChange(text)}
                    errorText={errors.lastName?.message}
                    icon={icons.user}
                  />
                )}
              />

              {/* About Me Section */}
              <View style={styles.textAreaContainer}>
                <Text style={styles.textAreaLabel}>About Me</Text>
                <Controller
                  control={control}
                  name="aboutMe"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textArea}
                      placeholder="Share a bit about yourself, your interests, and what you're looking for..."
                      value={value}
                      onChangeText={onChange}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  )}
                />
                {errors.aboutMe && (
                  <Text style={styles.errorText}>{errors.aboutMe.message}</Text>
                )}
              </View>

              {/* Phone Code Selection */}
              <Controller
                control={control}
                name="phoneCode"
                render={({ field: { onChange, value } }) => (
                  <SearchableDropdown
                    data={phoneCodesData}
                    onSelect={(item) => onChange(item.value)}
                    placeholder="Select Phone Code *"
                    selectedValue={value}
                    error={errors.phoneCode?.message}
                    searchPlaceholder="Search country code..."
                    icon={icons.telephone}
                  />
                )}
              />

              {/* Mobile Number */}
              <Controller
                control={control}
                name="mobileNumber"
                render={({ field: { onChange, value } }) => (
                  <Input
                    id="mobileNumber"
                    placeholder="Mobile Number *"
                    onInputChanged={(id, text) => onChange(text)}
                    errorText={errors.mobileNumber?.message}
                    icon={icons.call}
                    keyboardType="phone-pad"
                  />
                )}
              />

              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity 
                    style={styles.datePickerInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <View style={styles.dateInputContainer}>
                      <Text style={[
                        styles.dateInputText,
                        !value && styles.dateInputPlaceholder
                      ]}>
                        {value || 'Date of Birth *'}
                      </Text>
                      <View style={styles.calendarIcon}>
                        <Text style={styles.calendarEmoji}>📅</Text>
                      </View>
                    </View>
                    {errors.dateOfBirth && (
                      <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
                    )}
                  </TouchableOpacity>
                )}
              />

              {/* Country Selection */}
              <Controller
                control={control}
                name="country"
                render={({ field: { onChange, value } }) => (
                  <SearchableDropdown
                    data={getCountriesAsDropdownItems()}
                    onSelect={(item) => handleCountryChange(item)}
                    placeholder="Select Country *"
                    selectedValue={value}
                    error={errors.country?.message}
                    searchPlaceholder="Search country..."
                    icon={icons.location}
                  />
                )}
              />

              {/* City Selection */}
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, value } }) => (
                  <SearchableDropdown
                    data={getCitiesForCountry(selectedCountry)}
                    onSelect={(item) => onChange(item.value)}
                    placeholder={selectedCountry ? "Select City *" : "Select Country First"}
                    selectedValue={value}
                    error={errors.city?.message}
                    disabled={!selectedCountry}
                    searchPlaceholder="Search city..."
                    icon={icons.location}
                  />
                )}
              />

              {/* Gender Selection */}
              <View style={styles.genderContainer}>
                <Text style={styles.genderTitle}>Gender *</Text>
                <View style={styles.genderButtons}>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.genderButton,
                            value === 'male' && styles.genderButtonSelected
                          ]}
                          onPress={() => onChange('male')}
                        >
                          <Text style={[
                            styles.genderButtonText,
                            value === 'male' && styles.genderButtonTextSelected
                          ]}>
                            Male
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.genderButton,
                            value === 'female' && styles.genderButtonSelected
                          ]}
                          onPress={() => onChange('female')}
                        >
                          <Text style={[
                            styles.genderButtonText,
                            value === 'female' && styles.genderButtonTextSelected
                          ]}>
                            Female
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  />
                </View>
                {errors.gender && (
                  <Text style={styles.errorText}>{errors.gender.message}</Text>
                )}
              </View>

              <Button
                title="Continue"
                onPress={handleSubmit(handleBasicInfo)}
                style={styles.continueButton}
              />
            </View>
          </ScrollView>
        )}

        {/* Step 2: Physical Details */}
        {currentStep === 2 && (
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
        )}

        {/* Step 3: Lifestyle & Work */}
        {currentStep === 3 && (
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
                name="languagesSpoken"
                render={({ field: { onChange, value } }) => 
                  renderMultiSelector(
                    'Languages Spoken', 
                    languageOptions, 
                    value || [], 
                    (selectedLanguage) => {
                      const currentLanguages = value || [];
                      const updatedLanguages = currentLanguages.includes(selectedLanguage)
                        ? currentLanguages.filter(lang => lang !== selectedLanguage)
                        : [...currentLanguages, selectedLanguage];
                      onChange(updatedLanguages);
                    },
                    true
                  )
                }
              />

              {/* For Males: Occupation and Income */}
              {watchedValues.gender === 'male' && (
                <>
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

                  <Controller
                    control={lifestyleForm.control}
                    name="socialCondition"
                    render={({ field: { onChange, value } }) => 
                      renderDropdownSelector('Social Condition', socialConditionOptions, value, onChange, true)
                    }
                  />
                </>
              )}

              {/* For Females: Work Status and Conditional Occupation */}
              {watchedValues.gender === 'female' && (
                <>
                  <Controller
                    control={lifestyleForm.control}
                    name="workStatus"
                    render={({ field: { onChange, value } }) => 
                      renderDropdownSelector('Work Status', workStatusOptions, value, onChange, true)
                    }
                  />

                  {lifestyleForm.watch('workStatus') === 'Working' && (
                    <Controller
                      control={lifestyleForm.control}
                      name="occupation"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          id="occupation"
                          placeholder="Occupation (Optional)"
                          onInputChanged={(id, text) => onChange(text)}
                        />
                      )}
                    />
                  )}
                </>
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
        )}

        {/* Step 4: Religious Commitment */}
        {currentStep === 4 && (
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

              {watchedValues.gender === 'female' && (
                <Controller
                  control={religiousForm.control}
                  name="coveringLevel"
                  render={({ field: { onChange, value } }) => 
                    renderDropdownSelector('Covering Level', coveringLevelOptions, value, onChange, true)
                  }
                />
              )}

              {watchedValues.gender === 'male' && (
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
        )}

        {/* Step 5: Photos & Videos (3 photos required) */}
        {currentStep === 5 && (
          <ScrollView 
            style={styles.stepContainer} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mediaScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepTitle}>Photos & Videos</Text>
            <Text style={styles.stepSubtitle}>Add at least 3 photos. Videos are optional.</Text>

            <View style={styles.formContainer}>
              {/* Photos Section */}
              <View style={styles.sectionHeaderInline}>
                <Text style={styles.sectionTitleInline}>My Photos ({photos.length})</Text>
                <TouchableOpacity 
                  style={[styles.addButtonInline, mediaUploading && styles.addButtonDisabledInline]}
                  onPress={() => !mediaUploading && pickAndUploadMedia('photo')}
                  disabled={mediaUploading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonTextInline}>{mediaUploading ? 'Uploading...' : 'Add Photo'}</Text>
                </TouchableOpacity>
              </View>

              {photos.length > 0 ? (
                <FlatList
                  data={photos}
                  renderItem={renderPhotoItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.gridRow}
                  scrollEnabled={false}
                  contentContainerStyle={styles.gridContainer}
                  ItemSeparatorComponent={() => <View style={styles.gridSeparator} />}
                />
              ) : (
                <Text style={styles.mediaInfoText}>Add at least 3 photos to continue.</Text>
              )}

              {/* Videos Section */}
              <View style={[styles.sectionHeaderInline, { marginTop: getResponsiveSpacing(16) }]}>
                <Text style={styles.sectionTitleInline}>My Videos ({videos.length})</Text>
                <TouchableOpacity 
                  style={[styles.addButtonInline, mediaUploading && styles.addButtonDisabledInline]}
                  onPress={() => !mediaUploading && pickAndUploadMedia('video')}
                  disabled={mediaUploading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonTextInline}>{mediaUploading ? 'Uploading...' : 'Add Video'}</Text>
                </TouchableOpacity>
              </View>

              {videos.length > 0 ? (
                <FlatList
                  data={videos}
                  renderItem={renderVideoItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.gridRow}
                  scrollEnabled={false}
                  contentContainerStyle={styles.gridContainer}
                  ItemSeparatorComponent={() => <View style={styles.gridSeparator} />}
                />
              ) : null}

              <Button
                title="Continue"
                onPress={handleMediaNext}
                style={styles.continueButton}
                disabled={mediaLoading || mediaUploading || photos.length < 3}
              />
            </View>
          </ScrollView>
        )}

        {/* Step 6: Marriage Intentions */}
        {currentStep === 6 && (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Marriage Intentions</Text>
            <Text style={styles.stepSubtitle}>
              {watchedValues.gender === 'male' 
                ? 'Which wife number are you looking for?' 
                : 'Which positions would you accept in a polygamous marriage?'
              }
            </Text>

            <View style={styles.formContainer}>
              {watchedValues.gender === 'male' ? (
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
                  watchedValues.gender === 'male' ? !polygamyDetails.seekingWifeNumber : 
                  !polygamyDetails.acceptedWifePositions?.length
                )}
              />
            </View>
          </ScrollView>
        )}

        {/* Full Screen Media Modal */}
        {renderFullScreenModal()}

        {/* Date Picker Modal */}
        <DatePickerModal
          open={showDatePicker}
          startDate="1950-01-01"
          selectedDate={selectedDate}
          onClose={() => setShowDatePicker(false)}
          onChangeStartDate={(date: string) => {
            // Convert from YYYY/MM/DD to YYYY-MM-DD format
            const formattedDate = date.replace(/\//g, '-');
            setSelectedDate(formattedDate);
            // Update the form value
            const currentValues = watchedValues;
            setValue('dateOfBirth', formattedDate);
            setShowDatePicker(false);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ================================
// STYLES
// ================================

const styles = StyleSheet.create({
  textAreaContainer: {
    marginBottom: getResponsiveSpacing(24),
  },
  textAreaLabel: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(8),
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.greyscale500,
    borderRadius: 12,
    padding: getResponsiveSpacing(16),
    minHeight: 120,
    backgroundColor: COLORS.white,
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.black,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardContainer: {
    flex: 1,
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
    paddingHorizontal: getResponsiveSpacing(24),
  },
  stepTitle: {
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(8),
  },
  stepSubtitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(32),
    lineHeight: getResponsiveFontSize(22),
  },
  stepNote: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'medium',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: getResponsiveSpacing(32),
  },
  formContainer: {
    flex: 1,
  },
  genderContainer: {
    marginBottom: getResponsiveSpacing(24),
  },
  genderTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(12),
  },
  genderButtons: {
    flexDirection: 'row',
    gap: getResponsiveSpacing(12),
  },
  genderButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: getResponsiveSpacing(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: getResponsiveSpacing(6),
  },
  genderButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semiBold',
    color: COLORS.primary,
  },
  genderButtonTextSelected: {
    color: COLORS.white,
  },
  errorText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'regular',
    color: COLORS.red,
    marginTop: getResponsiveSpacing(4),
  },
  continueButton: {
    marginTop: getResponsiveSpacing(24),
    marginBottom: getResponsiveSpacing(32),
  },
  stepScrollContent: {
    paddingBottom: getResponsiveSpacing(40),
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveSpacing(12),
    flexWrap: 'wrap',
  },
  halfWidth: {
    width: '48%',
  },
  selectorContainer: {
    marginBottom: getResponsiveSpacing(24),
  },
  sectionHeaderInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(16),
  },
  sectionTitleInline: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'bold',
    color: COLORS.black,
  },
  addButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addButtonDisabledInline: {
    opacity: 0.6,
  },
  addButtonTextInline: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'medium',
    color: COLORS.primary,
    marginLeft: getResponsiveSpacing(4),
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
    borderWidth: 1,
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
  mediaInfoText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.gray,
    marginBottom: getResponsiveSpacing(12),
    textAlign: 'center',
  },
  multiSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing(8),
  },
  multiSelectNote: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'regular',
    color: COLORS.gray,
    marginBottom: getResponsiveSpacing(12),
  },
  selectedCount: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'medium',
    color: COLORS.primary,
    marginTop: getResponsiveSpacing(8),
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
    borderWidth: 1,
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
  gridContainer: {
    paddingBottom: getResponsiveSpacing(20),
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(4),
  },
  gridSeparator: {
    height: getResponsiveSpacing(12),
  },
  mediaItem: {
    position: 'relative',
    width: (SIZES.width - 56) / 2,
    marginHorizontal: getResponsiveSpacing(4),
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  photoItem: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: COLORS.grayscale200,
  },
  videoContainer: {
    position: 'relative',
  },
  videoItem: {
    width: '100%',
    aspectRatio: 0.5625,
    borderRadius: 12,
    backgroundColor: COLORS.grayscale200,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -25,
    marginLeft: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  deleteButton: {
    position: 'absolute',
    top: getResponsiveSpacing(4),
    right: getResponsiveSpacing(4),
    paddingHorizontal: getResponsiveSpacing(8),
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  avatarButton: {
    position: 'absolute',
    top: getResponsiveSpacing(4),
    left: getResponsiveSpacing(4),
    paddingHorizontal: getResponsiveSpacing(8),
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34c759',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  buttonText: {
    fontSize: getResponsiveFontSize(10),
    fontFamily: 'semiBold',
    color: COLORS.white,
    textAlign: 'center',
  },
  profileBadge: {
    position: 'absolute',
    bottom: getResponsiveSpacing(8),
    left: getResponsiveSpacing(8),
    backgroundColor: COLORS.primary,
    paddingHorizontal: getResponsiveSpacing(8),
    paddingVertical: getResponsiveSpacing(4),
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileBadgeText: {
    fontSize: getResponsiveFontSize(10),
    fontFamily: 'bold',
    color: COLORS.white,
    marginLeft: getResponsiveSpacing(4),
  },
  datePickerInput: {
    marginVertical: getResponsiveSpacing(12),
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.greyscale500,
    borderRadius: 12,
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(16),
    backgroundColor: COLORS.white,
    minHeight: 52,
  },
  dateInputText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.black,
    flex: 1,
  },
  dateInputPlaceholder: {
    color: COLORS.gray,
  },
  calendarIcon: {
    marginLeft: getResponsiveSpacing(8),
  },
  calendarEmoji: {
    fontSize: getResponsiveFontSize(20),
  },
  mediaScrollContent: {
    paddingBottom: getResponsiveSpacing(120),
  },

});

export default ProfileSetup;
