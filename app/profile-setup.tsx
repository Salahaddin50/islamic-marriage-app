// ============================================================================
// PROFILE SETUP SCREEN - HUME ISLAMIC DATING APP
// ============================================================================
// Multi-step profile completion after initial signup
// ============================================================================

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, TextInput, FlatList, Modal, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
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
import { useLanguage } from '../src/contexts/LanguageContext';
import * as SecureStore from 'expo-secure-store';

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
  const { t } = useLanguage();
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

  // Step 5: Custom left-side slider (scroll handle) to make vertical scrolling easier over media
  const mediaScrollRef = useRef<ScrollView>(null);
  const [mediaContentHeight, setMediaContentHeight] = useState(1);
  const [mediaContainerHeight, setMediaContainerHeight] = useState(1);
  const [mediaScrollY, setMediaScrollY] = useState(0);
  const handleMinHeight = 36;
  const handleHeight = Math.max(handleMinHeight, Math.min(mediaContainerHeight, (mediaContainerHeight / Math.max(mediaContentHeight, 1)) * mediaContainerHeight));
  const handleMaxY = Math.max(0, mediaContainerHeight - handleHeight);
  const handleY = Math.min(handleMaxY, Math.max(0, (mediaScrollY / Math.max(1, mediaContentHeight - mediaContainerHeight)) * handleMaxY));

  const panStartRef = useRef({ y: 0, handleStartY: 0 });
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_evt: GestureResponderEvent, _gs: PanResponderGestureState) => {
        panStartRef.current = { y: 0, handleStartY: handleY };
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gs: PanResponderGestureState) => {
        const dy = gs.dy;
        const nextHandleY = Math.min(handleMaxY, Math.max(0, panStartRef.current.handleStartY + dy));
        const fraction = handleMaxY > 0 ? nextHandleY / handleMaxY : 0;
        const targetScrollY = fraction * Math.max(0, mediaContentHeight - mediaContainerHeight);
        if (mediaScrollRef.current) {
          mediaScrollRef.current.scrollTo({ y: targetScrollY, animated: false });
        }
      },
      onPanResponderRelease: () => {},
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  // Helper: convert CDN to direct URL to avoid CORS issues on web
  const getDirectUrl = (url: string) => {
    if (url && url.includes('.cdn.')) {
      return url.replace('.cdn.digitaloceanspaces.com', '.digitaloceanspaces.com');
    }
    return url;
  };

  // Form states for each step
  const [basicInfoData, setBasicInfoData] = useState<Partial<BasicInfoForm>>({});
  const [physicalDetails, setPhysicalDetails] = useState<Partial<PhysicalDetails>>({});
  const [lifestyleDetails, setLifestyleDetails] = useState<Partial<LifestyleDetails>>({});
  const [religiousDetails, setReligiousDetails] = useState<Partial<ReligiousDetails>>({});
  const [polygamyDetails, setPolygamyDetails] = useState<Partial<PolygamyDetails>>({});

  // Polygamy Sunnah checkboxes state
  const [polygamySunnahChecked, setPolygamySunnahChecked] = useState(false);
  const [halalIntentionChecked, setHalalIntentionChecked] = useState(false);
  const [fairnessIntentionChecked, setFairnessIntentionChecked] = useState(false);

  // Form management for Step 1 (Basic Info)
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset: resetBasicForm,
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
  // Dynamic step-complete checks to style Continue button
  const step1Complete = Boolean(
    (watchedValues?.firstName || '').trim() &&
    watchedValues?.gender &&
    (watchedValues?.dateOfBirth || '').trim() &&
    (watchedValues?.country || '').trim() &&
    (watchedValues?.city || '').trim() &&
    (watchedValues?.phoneCode || '').trim() &&
    (watchedValues?.mobileNumber || '').trim() &&
    polygamySunnahChecked &&
    halalIntentionChecked &&
    fairnessIntentionChecked
  );
  const physicalWatch = physicalForm.watch();
  const step2Complete = Boolean(
    physicalWatch?.height && physicalWatch?.weight &&
    physicalWatch?.eyeColor && physicalWatch?.hairColor &&
    physicalWatch?.skinColor && physicalWatch?.bodyType
  );
  const lifestyleWatch = lifestyleForm.watch();
  const step3Complete = Boolean(
    lifestyleWatch?.education &&
    Array.isArray(lifestyleWatch?.languagesSpoken) && lifestyleWatch.languagesSpoken.length > 0 &&
    lifestyleWatch?.housingType && lifestyleWatch?.livingCondition
  );
  const religiousWatch = religiousForm.watch();
  const step4Complete = Boolean(
    religiousWatch?.religiousLevel && religiousWatch?.prayerFrequency && religiousWatch?.quranReading &&
    ((watchedValues?.gender === 'female') ? !!religiousWatch?.coveringLevel : true)
  );

  // Step 6 completion: at least one selection depending on gender
  const step6Complete = watchedValues.gender === 'male'
    ? !!polygamyDetails.seekingWifeNumber
    : !!(polygamyDetails.acceptedWifePositions && polygamyDetails.acceptedWifePositions.length);

  // Fetch existing profile data on component mount
  useEffect(() => {
    const fetchExistingProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          console.log('Fetched existing profile data:', profile);
          
          // Populate Step 1 (Basic Info) fields
          console.log('Setting Step 1 values:', {
            firstName: profile.first_name,
            lastName: profile.last_name,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            occupation: profile.occupation
          });
          
          // Populate Step 1 (Basic Info) using state + form reset approach
          const basicData = {
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            aboutMe: profile.about_me || '',
            gender: profile.gender as GenderType,
            dateOfBirth: profile.date_of_birth || '',
            country: profile.country || '',
            city: profile.city || '',
            phoneCode: profile.phone_code || '',
            mobileNumber: profile.mobile_number || '',
          };
          console.log('Setting basic info data:', basicData);
          setBasicInfoData(basicData);

          // Set date picker state
          if (profile.date_of_birth) {
            setSelectedDate(profile.date_of_birth);
          }

          // Set country/city states
          if (profile.country) {
            setSelectedCountry(profile.country);
            const cities = getCitiesForCountry(profile.country);
            setAvailableCities(cities.map(city => city.value));
          }

          // Populate Step 2 (Physical Details)
          const physicalData = {
            height: profile.height_cm || undefined,
            weight: profile.weight_kg || undefined,
            eyeColor: profile.eye_color || undefined,
            hairColor: profile.hair_color || undefined,
            skinColor: profile.skin_tone || undefined,
            bodyType: profile.body_type || undefined,
          };
          console.log('Setting Physical Details:', physicalData);
          setPhysicalDetails(physicalData);

          // Populate Step 3 (Lifestyle Details)
          const lifestyleData = {
            education: profile.education_level || undefined,
            occupation: profile.occupation || undefined,
            languagesSpoken: profile.languages_spoken || [],
            income: profile.monthly_income || undefined,
            socialCondition: profile.social_condition || undefined,
            workStatus: profile.work_status || undefined,
            housingType: profile.housing_type || undefined,
            livingCondition: profile.living_condition || undefined,
          };
          console.log('Setting Lifestyle Details:', lifestyleData);
          setLifestyleDetails(lifestyleData);

          // Populate Step 4 (Religious Details) and Step 6 (Polygamy Details)
          if (profile.islamic_questionnaire) {
            const questionnaire = profile.islamic_questionnaire;
            
            setReligiousDetails({
              religiousLevel: questionnaire.religious_level || undefined,
              prayerFrequency: questionnaire.prayer_frequency || undefined,
              quranReading: questionnaire.quran_reading_level || undefined,
              hijabPractice: questionnaire.hijab_practice || undefined,
              coveringLevel: questionnaire.covering_level || undefined,
              beardPractice: questionnaire.beard_practice || undefined,
            });

            setPolygamyDetails({
              seekingWifeNumber: questionnaire.seeking_wife_number || undefined,
              acceptedWifePositions: questionnaire.accepted_wife_positions || [],
            });
          }

          // Load existing media (photos/videos) for Step 5
          await loadMyMedia();
        }
      } catch (error) {
        console.error('Error fetching existing profile:', error);
      }
    };

    fetchExistingProfile();
  }, [setValue]);

  // Reset form defaults when state changes (to populate forms with fetched data)
  useEffect(() => {
    console.log('Resetting basicForm with:', basicInfoData);
    resetBasicForm(basicInfoData);
  }, [basicInfoData, resetBasicForm]);

  useEffect(() => {
    console.log('Resetting physicalForm with:', physicalDetails);
    physicalForm.reset(physicalDetails);
  }, [physicalDetails, physicalForm]);

  useEffect(() => {
    console.log('Resetting lifestyleForm with:', lifestyleDetails);
    lifestyleForm.reset(lifestyleDetails);
  }, [lifestyleDetails, lifestyleForm]);

  useEffect(() => {
    console.log('Resetting religiousForm with:', religiousDetails);
    religiousForm.reset(religiousDetails);
  }, [religiousDetails, religiousForm]);

  // Step 1: Basic Info
  const handleBasicInfo = async (data: BasicInfoForm) => {
    setIsLoading(true);
    try {
      // Save basic info to database immediately
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profileData = {
          user_id: user.id,
          first_name: data.firstName,
          last_name: data.lastName || '',
          about_me: data.aboutMe || '',
          gender: data.gender,
          date_of_birth: data.dateOfBirth,
          country: data.country,
          city: data.city,
          phone_code: data.phoneCode || null,
          mobile_number: data.mobileNumber || null,
          updated_at: new Date().toISOString(),
        };

        // Check if profile exists
        const { data: existing } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          // Update existing profile
          await supabase
            .from('user_profiles')
            .update(profileData)
            .eq('user_id', user.id);
        } else {
          // Create new profile
          await supabase
            .from('user_profiles')
            .insert({ ...profileData, created_at: new Date().toISOString() });
        }
        
        console.log('Step 1 data saved to database');
      }
      
    setComprehensiveData({ ...comprehensiveData, basicInfo: data });
    setCurrentStep(2);
    } catch (error) {
      console.error('Error saving Step 1 data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Physical Details
  const handlePhysicalDetailsNext = async (data: PhysicalDetails) => {
    setIsLoading(true);
    try {
      // Save physical details to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .update({
            height_cm: data.height,
            weight_kg: data.weight,
            eye_color: data.eyeColor,
            hair_color: data.hairColor,
            skin_tone: data.skinColor,
            body_type: data.bodyType,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        console.log('Step 2 data saved to database');
      }
      
    setPhysicalDetails(data);
    setCurrentStep(3);
    } catch (error) {
      console.error('Error saving Step 2 data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Lifestyle & Work
  const handleLifestyleNext = async (data: LifestyleDetails) => {
    setIsLoading(true);
    try {
      // Save lifestyle details to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .update({
            education_level: data.education,
            occupation: data.occupation || null,
            languages_spoken: data.languagesSpoken,
            monthly_income: data.income || null,
            social_condition: data.socialCondition || null,
            work_status: data.workStatus || null,
            housing_type: data.housingType || null,
            living_condition: data.livingCondition || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        console.log('Step 3 data saved to database');
      }
      
    setLifestyleDetails(data);
    setCurrentStep(4);
    } catch (error) {
      console.error('Error saving Step 3 data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Religious Commitment
  const handleReligiousNext = async (data: ReligiousDetails) => {
    setIsLoading(true);
    try {
      // Save religious details to database as JSON
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get existing questionnaire data
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('islamic_questionnaire')
          .eq('user_id', user.id)
          .single();

        const existingQuestionnaire = existingProfile?.islamic_questionnaire || {};
        
        const updatedQuestionnaire = {
          ...existingQuestionnaire,
          religious_level: data.religiousLevel,
          prayer_frequency: data.prayerFrequency,
          quran_reading_level: data.quranReading,
          hijab_practice: data.hijabPractice,
          covering_level: watchedValues.gender === 'female' ? data.coveringLevel : null,
          beard_practice: data.beardPractice,
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from('user_profiles')
          .update({
            islamic_questionnaire: updatedQuestionnaire,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        console.log('Step 4 data saved to database');
      }
      
    setReligiousDetails(data);
    setCurrentStep(5);
    } catch (error) {
      console.error('Error saving Step 4 data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 5: Continue to final confirmation (do not submit yet)
  const handlePolygamyComplete = async () => {
    setCurrentStep(6);
  };

  // Step 6: Save polygamy preferences and complete
  const handlePolygamyNext = async () => {
    setIsLoading(true);
    try {
      // Save polygamy preferences to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get existing questionnaire data
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('islamic_questionnaire')
          .eq('user_id', user.id)
          .single();

        const existingQuestionnaire = existingProfile?.islamic_questionnaire || {};
        
        const updatedQuestionnaire = {
          ...existingQuestionnaire,
          seeking_wife_number: watchedValues.gender === 'male' ? polygamyDetails.seekingWifeNumber : null,
          accepted_wife_positions: watchedValues.gender === 'female' ? polygamyDetails.acceptedWifePositions : null,
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from('user_profiles')
          .update({
            islamic_questionnaire: updatedQuestionnaire,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        console.log('Step 6 data saved to database');
      }
      
      // Set refresh flag for Home screen to fetch fresh, correct matches
      try {
        const key = 'hume_reset_filters_on_login';
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, '1');
        }
        try {
          await SecureStore.setItemAsync(key, '1');
        } catch {}
      } catch {}

      // Navigate to app
      Alert.alert(
        'Profile Complete!',
        'Your profile has been set up successfully. Welcome to Zawajplus!',
        [
          {
            text: 'Start Browsing',
            onPress: () => {
              console.log('Navigating to tabs...');
              // Ensure the refresh flag is written before navigation (best-effort)
              try {
                const key = 'hume_reset_filters_on_login';
                if (typeof window !== 'undefined' && window.localStorage) {
                  window.localStorage.setItem(key, '1');
                }
                SecureStore.setItemAsync(key, '1').catch(() => {});
              } catch {}
              router.replace('/(tabs)/home');
          }
          }
        ]
      );
      
      // Automatic navigation after 2 seconds as backup
      setTimeout(() => {
        console.log('Auto-navigating to home...');
        try {
          const key = 'hume_reset_filters_on_login';
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, '1');
          }
          SecureStore.setItemAsync(key, '1').catch(() => {});
        } catch {}
        router.replace('/(tabs)/home');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving Step 6 data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Do NOT create any user_profiles rows before final submit; allow media step to work without it
  const ensureMinimalProfileForMedia = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user; // only ensure authenticated; no inserts here
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
      // Validate size before upload using config
      const { MEDIA_CONFIG } = require('../src/config');
      const MAX_PHOTO_SIZE = MEDIA_CONFIG.MAX_PHOTO_SIZE; // 25MB
      const MAX_VIDEO_SIZE = MEDIA_CONFIG.MAX_VIDEO_SIZE; // 100MB
      if (type === 'photo' && blob.size > MAX_PHOTO_SIZE) {
        const sizeMB = Math.round(MAX_PHOTO_SIZE / (1024 * 1024));
        Alert.alert('File too large', `Photo size must be less than ${sizeMB}MB.`);
        return;
      }
      if (type === 'video' && blob.size > MAX_VIDEO_SIZE) {
        const sizeMB = Math.round(MAX_VIDEO_SIZE / (1024 * 1024));
        Alert.alert('File too large', `Video size must be less than ${sizeMB}MB.`);
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
    { label: t('profile_setup.options.eye_color.brown'), value: 'Brown' },
    { label: t('profile_setup.options.eye_color.black'), value: 'Black' },
    { label: t('profile_setup.options.eye_color.hazel'), value: 'Hazel' },
    { label: t('profile_setup.options.eye_color.green'), value: 'Green' },
    { label: t('profile_setup.options.eye_color.blue'), value: 'Blue' },
    { label: t('profile_setup.options.eye_color.gray'), value: 'Gray' },
    { label: t('profile_setup.options.eye_color.amber'), value: 'Amber' },
  ];

  const hairColorOptions = [
    { label: t('profile_setup.options.hair_color.black'), value: 'Black' },
    { label: t('profile_setup.options.hair_color.dark_brown'), value: 'Dark Brown' },
    { label: t('profile_setup.options.hair_color.brown'), value: 'Brown' },
    { label: t('profile_setup.options.hair_color.light_brown'), value: 'Light Brown' },
    { label: t('profile_setup.options.hair_color.blonde'), value: 'Blonde' },
    { label: t('profile_setup.options.hair_color.red'), value: 'Red' },
    { label: t('profile_setup.options.hair_color.gray'), value: 'Gray' },
    { label: t('profile_setup.options.hair_color.white'), value: 'White' },
  ];

  const skinColorOptions = [
    { label: t('profile_setup.options.skin_color.very_fair'), value: 'Very Fair' },
    { label: t('profile_setup.options.skin_color.fair'), value: 'Fair' },
    { label: t('profile_setup.options.skin_color.medium'), value: 'Medium' },
    { label: t('profile_setup.options.skin_color.olive'), value: 'Olive' },
    { label: t('profile_setup.options.skin_color.brown'), value: 'Brown' },
    { label: t('profile_setup.options.skin_color.dark_brown'), value: 'Dark Brown' },
    { label: t('profile_setup.options.skin_color.very_dark'), value: 'Very Dark' },
  ];

  // Body type options filtered by gender to avoid mismatched suggestions
  const bodyTypeOptionsAll = {
    male: [
      { label: t('profile_setup.options.body_type.slim'), value: 'Slim' },
      { label: t('profile_setup.options.body_type.average'), value: 'Average' },
      { label: t('profile_setup.options.body_type.athletic'), value: 'Athletic' },
      { label: t('profile_setup.options.body_type.heavy_set'), value: 'Heavy Set' },
    ],
    female: [
      { label: t('profile_setup.options.body_type.slim'), value: 'Slim' },
      { label: t('profile_setup.options.body_type.average'), value: 'Average' },
      { label: t('profile_setup.options.body_type.athletic'), value: 'Athletic' },
      { label: t('profile_setup.options.body_type.curvy'), value: 'Curvy' },
      { label: t('profile_setup.options.body_type.plus_size'), value: 'Plus Size' },
    ],
  } as const;

  const educationOptions = [
    { label: t('profile_setup.options.education.high_school'), value: 'High School' },
    { label: t('profile_setup.options.education.some_college'), value: 'Some College' },
    { label: t('profile_setup.options.education.bachelor'), value: "Bachelor's Degree" },
    { label: t('profile_setup.options.education.master'), value: "Master's Degree" },
    { label: t('profile_setup.options.education.phd'), value: 'PhD/Doctorate' },
    { label: t('profile_setup.options.education.islamic'), value: 'Islamic Studies' },
    { label: t('profile_setup.options.education.certification'), value: 'Professional Certification' },
    { label: t('profile_setup.options.education.other'), value: 'Other' },
  ];

  const languageOptions = [
    { label: t('profile_setup.options.languages.arabic'), value: 'Arabic' },
    { label: t('profile_setup.options.languages.english'), value: 'English' },
    { label: t('profile_setup.options.languages.turkish'), value: 'Turkish' },
    { label: t('profile_setup.options.languages.russian'), value: 'Russian' },
    { label: t('profile_setup.options.languages.spanish'), value: 'Spanish' },
    { label: t('profile_setup.options.languages.french'), value: 'French' },
    { label: t('profile_setup.options.languages.urdu'), value: 'Urdu' },
  ];

  const housingOptions = [
    { label: t('profile_setup.options.housing.rent_apartment'), value: 'rent_apartment' },
    { label: t('profile_setup.options.housing.rent_house'), value: 'rent_house' },
    { label: t('profile_setup.options.housing.own_apartment'), value: 'own_apartment' },
    { label: t('profile_setup.options.housing.own_house'), value: 'own_house' },
    { label: t('profile_setup.options.housing.family_home'), value: 'family_home' },
    { label: t('profile_setup.options.housing.shared'), value: 'shared_accommodation' },
    { label: t('profile_setup.options.housing.other'), value: 'other' },
  ];

  const livingConditionOptions = [
    { label: t('profile_setup.options.living.with_parents'), value: 'living_with_parents' },
    { label: t('profile_setup.options.living.alone'), value: 'living_alone' },
    { label: t('profile_setup.options.living.with_children'), value: 'living_with_children' },
  ];

  const socialConditionOptions = [
    { label: t('profile_setup.options.social_condition.sufficient'), value: 'sufficient' },
    { label: t('profile_setup.options.social_condition.rich'), value: 'rich' },
    { label: t('profile_setup.options.social_condition.very_rich'), value: 'very_rich' },
  ];

  const coveringLevelOptions = [
    { label: t('profile_setup.options.covering.will_cover'), value: 'Will Cover' },
    { label: t('profile_setup.options.covering.hijab'), value: 'Hijab' },
    { label: t('profile_setup.options.covering.niqab'), value: 'Niqab' },
  ];

  const workStatusOptions = [
    { label: t('profile_setup.options.work_status.not_working'), value: 'not_working' },
    { label: t('profile_setup.options.work_status.working'), value: 'working' },
  ];

  const religiousLevelOptions = [
    { label: t('profile_setup.options.religious_level.very_religious'), value: 'Very Religious' },
    { label: t('profile_setup.options.religious_level.religious'), value: 'Religious' },
    { label: t('profile_setup.options.religious_level.moderate'), value: 'Moderately Religious' },
    { label: t('profile_setup.options.religious_level.somewhat'), value: 'Somewhat Religious' },
    { label: t('profile_setup.options.religious_level.learning'), value: 'Learning' },
  ];

  const prayerFrequencyOptions = [
    { label: t('profile_setup.options.prayer_frequency.all_5'), value: 'All 5 Daily Prayers' },
    { label: t('profile_setup.options.prayer_frequency.most'), value: 'Most Prayers' },
    { label: t('profile_setup.options.prayer_frequency.some'), value: 'Some Prayers' },
    { label: t('profile_setup.options.prayer_frequency.friday'), value: 'Friday Only' },
    { label: t('profile_setup.options.prayer_frequency.occasionally'), value: 'Occasionally' },
    { label: t('profile_setup.options.prayer_frequency.learning'), value: 'Learning to Pray' },
  ];

  const quranReadingOptions = [
    { label: t('profile_setup.options.quran.memorized'), value: 'Memorized Significant Portions' },
    { label: t('profile_setup.options.quran.fluent'), value: 'Read Fluently' },
    { label: t('profile_setup.options.quran.with_help'), value: 'Read with Help' },
    { label: t('profile_setup.options.quran.learning'), value: 'Learning to Read' },
    { label: t('profile_setup.options.quran.cannot_read'), value: 'Cannot Read Arabic' },
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
      <Text style={styles.multiSelectNote}>{t('profile_setup.languages_note')}</Text>
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

      // Build minimal preferences payload from polygamy selections
      const preferencesPayload = watchedValues.gender === 'male' 
        ? {
            seekingWifeNumber: polygamyDetails.seekingWifeNumber 
              ? [polygamyDetails.seekingWifeNumber]
              : [],
            acceptPolygamy: !!polygamyDetails.seekingWifeNumber,
            currentWives: 0,
            maxWives: 4,
          }
        : {
            wifePositionsAccepted: polygamyDetails.acceptedWifePositions || [],
            acceptPolygamy: (polygamyDetails.acceptedWifePositions || []).length > 0,
            maritalStatus: 'never_married',
      };

      // Register with simplified preferences  
      console.log('Creating profile with data:', registrationData);
      console.log('Preferences payload:', preferencesPayload);
      
      const result = await RegistrationService.createProfileWithPreferences(registrationData, preferencesPayload);
      console.log('Profile creation result:', result);

      // Set refresh flag for Home screen to fetch fresh, correct matches
      try {
        const key = 'hume_reset_filters_on_login';
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, '1');
        }
        try {
          await SecureStore.setItemAsync(key, '1');
        } catch {}
      } catch {}

      Alert.alert(
        'Profile Complete!',
        'Your profile has been set up successfully. Welcome to Zawajplus!',
        [
          {
            text: 'Start Browsing',
            onPress: () => {
              console.log('Navigating to tabs...');
              try {
                const key = 'hume_reset_filters_on_login';
                if (typeof window !== 'undefined' && window.localStorage) {
                  window.localStorage.setItem(key, '1');
                }
                SecureStore.setItemAsync(key, '1').catch(() => {});
              } catch {}
              router.replace('/(tabs)/home');
            }
          }
        ]
      );
      
      // Automatic navigation after 2 seconds as backup
      setTimeout(() => {
        console.log('Auto-navigating to home...');
        try {
          const key = 'hume_reset_filters_on_login';
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, '1');
          }
          SecureStore.setItemAsync(key, '1').catch(() => {});
        } catch {}
        router.replace('/(tabs)/home');
      }, 2000);
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
          <Text style={styles.progressText}>{t('profile_setup.progress', { current: currentStep, total: 6 })}</Text>
        </View>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <ScrollView 
            style={styles.stepContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.stepScrollContent}
          >
            <Text style={styles.stepTitle}>{t('profile_setup.basic_title')}</Text>
            <Text style={styles.stepSubtitle}>{t('profile_setup.basic_subtitle')}</Text>

            <View style={styles.formContainer}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    id="firstName"
                    placeholder={t('profile_setup.first_name_placeholder')}
                    value={value}
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
                    placeholder={t('profile_setup.last_name_placeholder')}
                    value={value}
                    onInputChanged={(id, text) => onChange(text)}
                    errorText={errors.lastName?.message}
                    icon={icons.user}
                  />
                )}
              />

              {/* About Me Section */}
              <View style={styles.textAreaContainer}>
                <Text style={styles.textAreaLabel}>{t('profile_setup.about_me_label')}</Text>
                <Controller
                  control={control}
                  name="aboutMe"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textArea}
                      placeholder={t('profile_setup.about_me_placeholder')}
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
                    placeholder={t('profile_setup.phone_code_placeholder')}
                    selectedValue={value}
                    error={errors.phoneCode?.message}
                    searchPlaceholder={t('profile_setup.search_phone_code')}
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
                    placeholder={t('profile_setup.mobile_number_placeholder')}
                    value={value}
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
                        {value || t('profile_setup.dob_placeholder')}
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
                    placeholder={t('profile_setup.country_placeholder')}
                    selectedValue={value}
                    error={errors.country?.message}
                    searchPlaceholder={t('profile_setup.search_country')}
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
                    placeholder={selectedCountry ? t('profile_setup.city_placeholder') : t('profile_setup.city_placeholder_disabled')}
                    selectedValue={value}
                    error={errors.city?.message}
                    disabled={!selectedCountry}
                    searchPlaceholder={t('profile_setup.search_city')}
                    icon={icons.location}
                  />
                )}
              />

              {/* Gender Selection */}
              <View style={styles.genderContainer}>
                <Text style={styles.genderTitle}>{t('profile_setup.gender_label')}</Text>
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
                            {t('profile_setup.male')}
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
                            {t('profile_setup.female')}
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

              {/* Polygamy Sunnah Checkboxes */}
              <View style={styles.checkboxContainer}>
                <Text style={styles.checkboxSectionTitle}>{t('profile_setup.commitments_title')}</Text>
                
                {/* First Checkbox */}
                <TouchableOpacity 
                  style={styles.checkboxItem}
                  onPress={() => setPolygamySunnahChecked(!polygamySunnahChecked)}
                >
                  <View style={[styles.checkbox, polygamySunnahChecked && styles.checkboxChecked]}>
                    {polygamySunnahChecked && (
                      <Text style={styles.checkboxTick}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxText}>{t('profile_setup.commitment_sunnah')}</Text>
                </TouchableOpacity>

                {/* Second Checkbox */}
                <TouchableOpacity 
                  style={styles.checkboxItem}
                  onPress={() => setHalalIntentionChecked(!halalIntentionChecked)}
                >
                  <View style={[styles.checkbox, halalIntentionChecked && styles.checkboxChecked]}>
                    {halalIntentionChecked && (
                      <Text style={styles.checkboxTick}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxText}>{t('profile_setup.commitment_halal')}</Text>
                </TouchableOpacity>

                {/* Third Checkbox - Gender Specific */}
                <TouchableOpacity 
                  style={styles.checkboxItem}
                  onPress={() => setFairnessIntentionChecked(!fairnessIntentionChecked)}
                >
                  <View style={[styles.checkbox, fairnessIntentionChecked && styles.checkboxChecked]}>
                    {fairnessIntentionChecked && (
                      <Text style={styles.checkboxTick}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxText}>
                    {watchedValues?.gender === 'male' 
                      ? t('profile_setup.commitment_fair_male')
                      : t('profile_setup.commitment_fair_female')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title={t('profile_setup.continue')}
                onPress={handleSubmit(handleBasicInfo)}
                style={[styles.continueButton, step1Complete ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary } : { backgroundColor: COLORS.white, borderColor: COLORS.primary }]}
                textColor={step1Complete ? COLORS.white : COLORS.primary}
              />
              <Button
                title={t('profile_setup.fill_later')}
                onPress={async () => { try { await supabase.auth.signOut(); } catch {} finally { router.replace('/'); } }}
                style={[styles.continueButton, { backgroundColor: COLORS.white, borderColor: COLORS.primary }]}
                textColor={COLORS.primary}
              />
            </View>
          </ScrollView>
        )}

        {/* Step 2: Physical Details */}
        {currentStep === 2 && (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>{t('profile_setup.physical_title')}</Text>
            <Text style={styles.stepSubtitle}>{t('profile_setup.physical_subtitle')}</Text>

            <View style={styles.formContainer}>
              <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                  <Controller
                    control={physicalForm.control}
                    name="height"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        id="height"
                        placeholder={t('profile_setup.height_placeholder')}
                        value={value ? String(value) : ''}
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
                        placeholder={t('profile_setup.weight_placeholder')}
                        value={value ? String(value) : ''}
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
                  renderDropdownSelector(t('profile_setup.eye_color'), eyeColorOptions, value, onChange, true)
                }
              />

              <Controller
                control={physicalForm.control}
                name="hairColor"
                render={({ field: { onChange, value } }) => 
                  renderDropdownSelector(t('profile_setup.hair_color'), hairColorOptions, value, onChange, true)
                }
              />

              <Controller
                control={physicalForm.control}
                name="skinColor"
                render={({ field: { onChange, value } }) => 
                  renderDropdownSelector(t('profile_setup.skin_color'), skinColorOptions, value, onChange, true)
                }
              />

              <Controller
                control={physicalForm.control}
                name="bodyType"
                render={({ field: { onChange, value } }) => {
                  const gender = watchedValues.gender || 'male';
                  const options = gender === 'female' ? bodyTypeOptionsAll.female : bodyTypeOptionsAll.male;
                  return renderDropdownSelector(t('profile_setup.body_type'), options, value, onChange, true);
                }}
              />

              <Button
                title={t('profile_setup.continue')}
                onPress={physicalForm.handleSubmit(handlePhysicalDetailsNext)}
                style={[styles.continueButton, step2Complete ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary } : { backgroundColor: COLORS.white, borderColor: COLORS.primary }]}
                textColor={step2Complete ? COLORS.white : COLORS.primary}
              />
              <Button
                title={t('profile_setup.fill_later')}
                onPress={async () => { try { await supabase.auth.signOut(); } catch {} finally { router.replace('/'); } }}
                style={[styles.continueButton, { backgroundColor: COLORS.white, borderColor: COLORS.primary }]}
                textColor={COLORS.primary}
              />
            </View>
          </ScrollView>
        )}

        {/* Step 3: Lifestyle & Work */}
        {currentStep === 3 && (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>{t('profile_setup.lifestyle_title')}</Text>
            <Text style={styles.stepSubtitle}>{t('profile_setup.lifestyle_subtitle')}</Text>

            <View style={styles.formContainer}>
              <Controller
                control={lifestyleForm.control}
                name="education"
                render={({ field: { onChange, value } }) => 
                  renderDropdownSelector(t('profile_setup.education_level'), educationOptions, value, onChange, true)
                }
              />

              <Controller
                control={lifestyleForm.control}
                name="languagesSpoken"
                render={({ field: { onChange, value } }) => 
                  renderMultiSelector(
                    t('profile_setup.languages_spoken'), 
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
                        placeholder={t('profile_setup.occupation_placeholder')}
                        value={value}
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
                        placeholder={t('profile_setup.income_placeholder')}
                        onInputChanged={(id, text) => onChange(text)}
                      />
                    )}
                  />

                  <Controller
                    control={lifestyleForm.control}
                    name="socialCondition"
                    render={({ field: { onChange, value } }) => 
                      renderDropdownSelector(t('profile_setup.social_condition'), socialConditionOptions, value, onChange, true)
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
                      renderDropdownSelector(t('profile_setup.work_status'), workStatusOptions, value, onChange, true)
                    }
                  />

                  {lifestyleForm.watch('workStatus') === 'Working' && (
                    <Controller
                      control={lifestyleForm.control}
                      name="occupation"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          id="occupation"
                          placeholder={t('profile_setup.occupation_placeholder')}
                          value={value}
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
                  renderDropdownSelector(t('profile_setup.housing_type'), housingOptions, value, onChange, true)
                }
              />

              <Controller
                control={lifestyleForm.control}
                name="livingCondition"
                render={({ field: { onChange, value } }) => 
                  renderDropdownSelector(t('profile_setup.living_condition'), livingConditionOptions, value, onChange, true)
                }
              />

              <Button
                title={t('profile_setup.continue')}
                onPress={lifestyleForm.handleSubmit(handleLifestyleNext)}
                style={[styles.continueButton, step3Complete ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary } : { backgroundColor: COLORS.white, borderColor: COLORS.primary }]}
                textColor={step3Complete ? COLORS.white : COLORS.primary}
              />
              <Button
                title={t('profile_setup.fill_later')}
                onPress={async () => { try { await supabase.auth.signOut(); } catch {} finally { router.replace('/'); } }}
                style={[styles.continueButton, { backgroundColor: COLORS.white, borderColor: COLORS.primary }]}
                textColor={COLORS.primary}
              />
            </View>
          </ScrollView>
        )}

        {/* Step 4: Religious Commitment */}
        {currentStep === 4 && (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>{t('profile_setup.religious_title')}</Text>
            <Text style={styles.stepSubtitle}>{t('profile_setup.religious_subtitle')}</Text>

            <View style={styles.formContainer}>
              <Controller
                control={religiousForm.control}
                name="religiousLevel"
                render={({ field: { onChange, value } }) => 
                  renderDropdownSelector(t('profile_setup.religious_level'), religiousLevelOptions, value, onChange, true)
                }
              />

              <Controller
                control={religiousForm.control}
                name="prayerFrequency"
                render={({ field: { onChange, value } }) => 
                  renderDropdownSelector(t('profile_setup.prayer_frequency'), prayerFrequencyOptions, value, onChange, true)
                }
              />

              <Controller
                control={religiousForm.control}
                name="quranReading"
                render={({ field: { onChange, value } }) => 
                  renderDropdownSelector(t('profile_setup.quran_level'), quranReadingOptions, value, onChange, true)
                }
              />

              {watchedValues.gender === 'female' && (
                <Controller
                  control={religiousForm.control}
                  name="coveringLevel"
                  render={({ field: { onChange, value } }) => 
                    renderDropdownSelector(t('profile_setup.covering_level'), coveringLevelOptions, value, onChange, true)
                  }
                />
              )}

              {watchedValues.gender === 'male' && (
                <Controller
                  control={religiousForm.control}
                  name="beardPractice"
                  render={({ field: { onChange, value } }) => 
                    renderDropdownSelector(
                      t('profile_setup.beard_practice'),
                      [
                        t('profile_setup.options.beard.full'),
                        t('profile_setup.options.beard.trimmed'),
                        t('profile_setup.options.beard.mustache'),
                        t('profile_setup.options.beard.clean'),
                      ],
                      value,
                      onChange
                    )
                  }
                />
              )}

              <Button
                title={t('profile_setup.continue')}
                onPress={religiousForm.handleSubmit(handleReligiousNext)}
                style={[styles.continueButton, step4Complete ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary } : { backgroundColor: COLORS.white, borderColor: COLORS.primary }]}
                textColor={step4Complete ? COLORS.white : COLORS.primary}
              />
              <Button
                title={t('profile_setup.fill_later')}
                onPress={async () => { try { await supabase.auth.signOut(); } catch {} finally { router.replace('/'); } }}
                style={[styles.continueButton, { backgroundColor: COLORS.white, borderColor: COLORS.primary }]}
                textColor={COLORS.primary}
              />
            </View>
          </ScrollView>
        )}

        {/* Step 5: Photos & Videos (3 photos required) */}
        {currentStep === 5 && (
          <View style={{ flex: 1, position: 'relative' }}>
            <ScrollView 
              ref={mediaScrollRef}
              style={styles.stepContainer} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.mediaScrollContent}
              keyboardShouldPersistTaps="handled"
              onLayout={(e) => { setMediaContainerHeight(e.nativeEvent.layout.height || 1); }}
              onContentSizeChange={(_w, h) => { setMediaContentHeight(h || 1); }}
              onScroll={(e) => { setMediaScrollY(e.nativeEvent.contentOffset.y || 0); }}
              scrollEventThrottle={16}
            >
            <Text style={styles.stepTitle}>{t('profile_setup.media_title')}</Text>
            <Text style={styles.stepSubtitle}>{t('profile_setup.media_subtitle')}</Text>

            <View style={styles.formContainer}>
              {/* Photos Section */}
              <View style={styles.sectionHeaderInline}>
                <Text style={styles.sectionTitleInline}>{t('profile_setup.my_photos', { count: photos.length })}</Text>
                <TouchableOpacity 
                  style={[styles.addButtonInline, mediaUploading && styles.addButtonDisabledInline]}
                  onPress={() => !mediaUploading && pickAndUploadMedia('photo')}
                  disabled={mediaUploading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonTextInline}>{mediaUploading ? t('profile_setup.uploading') : t('profile_setup.add_photo')}</Text>
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
                <Text style={styles.mediaInfoText}>{t('profile_setup.need_three_photos')}</Text>
              )}

              {/* Videos Section */}
              <View style={[styles.sectionHeaderInline, { marginTop: getResponsiveSpacing(16) }]}>
                <Text style={styles.sectionTitleInline}>{t('profile_setup.my_videos', { count: videos.length })}</Text>
                <TouchableOpacity 
                  style={[styles.addButtonInline, mediaUploading && styles.addButtonDisabledInline]}
                  onPress={() => !mediaUploading && pickAndUploadMedia('video')}
                  disabled={mediaUploading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonTextInline}>{mediaUploading ? t('profile_setup.uploading') : t('profile_setup.add_video')}</Text>
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
                title={t('profile_setup.continue')}
                onPress={handleMediaNext}
                style={[
                  styles.continueButton,
                  photos.length >= 3
                    ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                    : { backgroundColor: COLORS.white, borderColor: COLORS.primary }
                ]}
                textColor={photos.length >= 3 ? COLORS.white : COLORS.primary}
                disabled={mediaLoading || mediaUploading || photos.length < 3}
              />
            </View>
            </ScrollView>

            {/* Left-side slider track and handle (touch area) */}
            <View style={styles.leftSliderTrack} {...panResponder.panHandlers}>
              <View style={[styles.leftSliderHandle, { height: handleHeight, transform: [{ translateY: handleY }] }]} />
            </View>
          </View>
        )}

        {/* Step 6: Marriage Intentions */}
        {currentStep === 6 && (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>{t('profile_setup.polygamy_title')}</Text>
            <Text style={styles.stepSubtitle}>
              {watchedValues.gender === 'male' 
                ? t('profile_setup.polygamy_subtitle_male') 
                : t('profile_setup.polygamy_subtitle_female')}
            </Text>

            <View style={styles.formContainer}>
              {watchedValues.gender === 'male' ? (
                // Male: Single selection for wife number
                <View style={styles.polygamySection}>
                  <Text style={styles.polygamyTitle}>{t('profile_setup.looking_for_which_wife')}</Text>
                  <Text style={styles.polygamyNote}>
                    {t('profile_setup.positions_note')}
                  </Text>
                  
                  {[t('profile_setup.second_wife'), t('profile_setup.third_wife'), t('profile_setup.fourth_wife')].map((option, index) => {
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
                            {t('profile_setup.currently_have', { count: index + 1, plural: index > 0 ? 's' : '' })}
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
                  <Text style={styles.polygamyTitle}>{t('profile_setup.positions_accept')}</Text>
                  <Text style={styles.polygamyNote}>
                    {t('profile_setup.positions_note')}
                  </Text>
                  
                  {[t('profile_setup.second_wife'), t('profile_setup.third_wife'), t('profile_setup.fourth_wife')].map((option, index) => {
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
                            {t('profile_setup.accept_being', { position: option.toLowerCase() })}
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
                title={isLoading ? t('profile_setup.completing_registration') : t('profile_setup.complete_registration')}
                onPress={handlePolygamyNext}
                style={[
                  styles.continueButton,
                  step6Complete
                    ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                    : { backgroundColor: COLORS.white, borderColor: COLORS.primary }
                ]}
                textColor={step6Complete ? COLORS.white : COLORS.primary}
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
    marginTop: getResponsiveSpacing(16),
    marginBottom: getResponsiveSpacing(16),
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
    paddingHorizontal: getResponsiveSpacing(8),
  },
  gridSeparator: {
    height: getResponsiveSpacing(12),
  },
  mediaItem: {
    position: 'relative',
    width: '48%',
    marginHorizontal: 0,
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

  // Left-side slider for Step 5 media scroll
  leftSliderTrack: {
    position: 'absolute',
    left: 6,
    top: 0,
    bottom: 0,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // subtle area, keep mostly transparent to avoid visual noise
    backgroundColor: 'transparent',
  },
  leftSliderHandle: {
    position: 'absolute',
    width: 6,
    borderRadius: 3,
    backgroundColor: COLORS.greyscale400,
    opacity: 0.7,
  },
  checkboxContainer: {
    marginBottom: getResponsiveSpacing(24),
    marginTop: getResponsiveSpacing(16),
  },
  checkboxSectionTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(16),
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSpacing(16),
    paddingHorizontal: getResponsiveSpacing(4),
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 4,
    marginRight: getResponsiveSpacing(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxTick: {
    color: COLORS.white,
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
    color: COLORS.black,
    lineHeight: getResponsiveFontSize(20),
  },

});

export default ProfileSetup;
