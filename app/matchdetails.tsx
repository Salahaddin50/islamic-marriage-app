  import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Modal, Dimensions, Platform, Linking, TextInput, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { COLORS, icons, images, SIZES } from '@/constants';
// import AutoSlider from '@/components/AutoSlider'; // Removed to ensure we only use custom implementation
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { supabase } from '@/src/config/supabase';
import { getResponsiveFontSize, getResponsiveSpacing, safeGoBack, isDesktopWeb } from '@/utils/responsive';
import { DEFAULT_VIDEO_THUMBNAIL } from '@/constants/defaultThumbnails';
import MatchDetailsSkeleton from '@/components/MatchDetailsSkeleton';
import { InterestsService, InterestStatus } from '@/src/services/interests';
import { MeetService, MeetOverallStatus } from '@/src/services/meet';
import { MessageRequestsService } from '@/src/services/message-requests.service';
import { calculateTimeDifference, getLocalTimeForUser, TimeDifferenceResult } from '@/utils/timezoneUtils';
import { useTranslation } from 'react-i18next';

// Types for user profile data (comprehensive - matches database)
interface UserProfile {
  [key: string]: any; // Allow any field from database
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  date_of_birth: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  eye_color?: string;
  hair_color?: string;
  skin_tone?: string;
  body_type?: string;
  country?: string;
  city?: string;
  education_level?: string;
  occupation?: string;
  monthly_income?: string;
  social_condition?: string;
  work_status?: string;
  housing_type?: string;
  living_condition?: string;
  languages_spoken?: string[];
  profile_picture_url?: string;
  about_me?: string;
  islamic_questionnaire?: string;
  phone_code?: string;
  mobile_number?: string;
  created_at?: string;
  updated_at?: string;
}

interface MediaReference {
  id: string;
  external_url: string;
  thumbnail_url?: string;
  is_profile_picture: boolean;
  media_order: number;
  media_type: 'photo' | 'video';
}

// Cache for match details to prevent reloading
let cachedMatchDetails: { [key: string]: UserProfile } = {};
let cachedMatchMedia: { [key: string]: MediaReference[] } = {};
let matchDetailsLoadTime: { [key: string]: number } = {};
const MATCH_DETAILS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const MatchDetails = () => {
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const navigation = useNavigation<NavigationProp<any>>();
  const router = useRouter();
  const { t } = useTranslation();

  // Silence console noise while on this screen
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;
    const originalError = console.error;
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.error = () => {};
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.info = originalInfo;
      console.debug = originalDebug;
      console.error = originalError;
    };
  }, []);



  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userMedia, setUserMedia] = useState<MediaReference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [interestStatus, setInterestStatus] = useState<InterestStatus>('none');
  const [isInterestSender, setIsInterestSender] = useState(false);
  const [interestRecordId, setInterestRecordId] = useState<string | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<{ [key: string]: boolean }>({});
  const [thumbnailLoading, setThumbnailLoading] = useState<{ [key: string]: boolean }>({});
  const [silhouetteFailedToLoad, setSilhouetteFailedToLoad] = useState<{ [key: string]: boolean }>({});
  // Meet request state
  const [meetStatus, setMeetStatus] = useState<MeetOverallStatus>('none');
  const [isMeetSender, setIsMeetSender] = useState(false);
  const [meetRecordId, setMeetRecordId] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState<string | null | undefined>(null);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [showPhotoRequestInfoModal, setShowPhotoRequestInfoModal] = useState(false);
  const [showVideoMeetInfoModal, setShowVideoMeetInfoModal] = useState(false);
  const [showVideoPreconditionModal, setShowVideoPreconditionModal] = useState(false);
  const [showChatInfoModal, setShowChatInfoModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [returnToModal, setReturnToModal] = useState<'none' | 'videoPre' | 'videoInfo' | 'chatInfo'>('none');
  const [showUnderReviewModal, setShowUnderReviewModal] = useState(false);
  const [chatOathConfirmed, setChatOathConfirmed] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [meetDate, setMeetDate] = useState<string>(''); // web-only date
  const [meetTime, setMeetTime] = useState<string>(''); // web-only time
  const [meetScheduledAt, setMeetScheduledAt] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  // Message request state
  const [messageStatus, setMessageStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [isMessageSender, setIsMessageSender] = useState(false);
  const [messageRecordId, setMessageRecordId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [timeDifference, setTimeDifference] = useState<TimeDifferenceResult | null>(null);
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`; // Local YYYY-MM-DD
  }, []);

  // Blinking animation for active step (runs only when not yet accepted)
  const blinkOpacity = useRef(new Animated.Value(1)).current;
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    // Blink the first non-accepted step: 1 (interest) → 2 (meet) → 3 (message)
    if (interestStatus !== 'accepted') {
      setActiveStep(1);
    } else if (meetStatus !== 'accepted') {
      setActiveStep(2);
    } else if (messageStatus !== 'accepted') {
      setActiveStep(3);
    } else {
      setActiveStep(null);
    }
  }, [interestStatus, meetStatus, messageStatus]);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (activeStep) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(blinkOpacity, { toValue: 1, duration: 600, useNativeDriver: true })
        ])
      );
      loop.start();
    } else {
      blinkOpacity.setValue(1);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [activeStep, blinkOpacity]);

  // Check if user has any active package (for video request validation)
  const checkUserPackage = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user has any completed payment (same logic as crown color)
      const { data: paymentRecords, error } = await supabase
        .from('payment_records')
        .select('package_type, status, payment_details, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !paymentRecords || paymentRecords.length === 0) {
        return false;
      }

      return true;
    } catch (e) {
      console.log('Error checking user package:', e);
      return false;
    }
  };
  
  // Fullscreen media viewer state
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [selectedMediaType, setSelectedMediaType] = useState<'photo' | 'video'>('photo');

  // Helper function to navigate to a valid user
  const navigateToValidUser = (validUserId: string) => {
    console.log('🔄 Navigating to valid user:', validUserId);
    router.push({
      pathname: '/matchdetails',
      params: { userId: validUserId }
    });
  };

  // Load user data on component mount
  useEffect(() => {
    if (userId && userId !== 'undefined') {
      loadUserDetails(userId);
    } else {
      setError('No valid user ID provided. Please go back and try again.');
      setIsLoading(false);
    }
  }, [userId]);

  // Load meet status for this profile
  useEffect(() => {
    (async () => {
      if (!userId) return;
      try {
        const res = await MeetService.getStatusForTarget(userId);
        setMeetStatus(res.status);
        setIsMeetSender(res.isSender);
        setMeetRecordId(res.record?.id || null);
        setMeetLink(res.meetLink);
        setMeetScheduledAt(res.record?.scheduled_at || null);
      } catch {}
    })();
  }, [userId]);

  // Load messaging status for this profile
  useEffect(() => {
    (async () => {
      if (!userId) return;
      try {
        const res = await MessageRequestsService.getStatusForTarget(userId);
        setMessageStatus((res.status as any) || 'none');
        setIsMessageSender(res.isSender);
        setMessageRecordId(res.record?.id || null);
      } catch {}
    })();
  }, [userId, nowTick]);

  // autoMeet behavior removed per request — navigating should not auto-click anything
  // Refresh ticker every minute so time-based gating updates
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Can message only after 1 hour from approved meet time
  const canMessage = useMemo(() => {
    if (interestStatus !== 'accepted') return false;
    if (meetStatus !== 'accepted') return false;
    if (!meetScheduledAt) return false;
    const ts = new Date(meetScheduledAt).getTime();
    if (Number.isNaN(ts)) return false;
    return Date.now() >= (ts + 60 * 60 * 1000);
  }, [interestStatus, meetStatus, meetScheduledAt, nowTick]);

  const formatMeetingDateShort = (iso?: string | null): string => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString(undefined, { month: 'short' });
      const year = String(d.getFullYear()).slice(-2);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} ${t('match_details.at')} ${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Load interest status for this profile
  useEffect(() => {
    (async () => {
      if (!userId) return;
      try {
        const res = await InterestsService.getStatusForTarget(userId);
        setInterestStatus(res.status);
        setIsInterestSender(res.isSender);
        setInterestRecordId(res.record?.id || null);
      } catch {}
    })();
  }, [userId]);

  const loadUserDetails = async (targetUserId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // console.log('🔍 DEBUG: Loading user details for userId:', targetUserId);

      // Check cache first
      const isCacheFresh = cachedMatchDetails[targetUserId] && 
        (Date.now() - (matchDetailsLoadTime[targetUserId] || 0)) < MATCH_DETAILS_CACHE_TTL;

      if (isCacheFresh) {
        console.log('📦 Using cached data for user:', targetUserId);
        setUserProfile(cachedMatchDetails[targetUserId]);
        setUserMedia(cachedMatchMedia[targetUserId] || []);
        setIsLoading(false);
        return;
      } else {
        console.log('🔄 Cache disabled/expired, fetching fresh data for user:', targetUserId);
      }

      // Load profile and media in parallel for better performance
      const [profileResult, mediaResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle(),
        supabase
          .from('media_references')
          .select(`
            id,
            external_url,
            thumbnail_url,
            is_profile_picture,
            media_order,
            media_type,
            visibility_level
          `)
          .eq('user_id', targetUserId)
          .in('media_type', ['photo', 'video'])
          .order('is_profile_picture', { ascending: false })
          .order('media_order', { ascending: true })
      ]);

      const { data: profileByUserId, error: profileErrorByUserId } = profileResult;
      let { data: mediaData, error: mediaError } = mediaResult;
      
      let profileData: UserProfile | null = null;
      if (!profileErrorByUserId && profileByUserId) profileData = profileByUserId as any;

      console.log('📊 Media query result:', { mediaError, mediaCount: mediaData?.length || 0 });

      // If no media found with direct user ID
      if (!mediaData || mediaData.length === 0) {
        console.log('⚠️ No media found for user:', targetUserId);
        
        // PROPER SOLUTION: This is where we should fix the database permissions
        // The issue is likely with Supabase Row Level Security (RLS) policies
        // We should update the RLS policies to allow users to view other users' media
        // with appropriate visibility levels (public, matched_only, etc.)
        
        console.log('ℹ️ To properly fix this issue:');
        console.log('1. Update Supabase RLS policies for media_references table');
        console.log('2. Ensure authenticated users can view appropriate media');
        console.log('3. Implement proper visibility levels (public, private, matched_only)');
        
        // For now, we'll just show an empty array
        mediaData = [];
        
        // TODO: Remove this temporary solution and implement proper database permissions
      } else {
        console.log('✅ Found media for user:', targetUserId, 'Count:', mediaData.length);
        console.log('📸 Media details:', mediaData.map(m => ({ 
          id: m.id, 
          type: m.media_type, 
          order: m.media_order, 
          isProfile: m.is_profile_picture 
        })));
      }

      if (mediaError) {
        console.error('❌ Media fetch error:', mediaError);
      }

      // Debug queries removed for cleaner console output

      const media = mediaData || [];

      // Media data processing (debug removed for cleaner output)

      // Cache the data
      if (profileData) {
        cachedMatchDetails[targetUserId] = profileData;
        cachedMatchMedia[targetUserId] = media;
        matchDetailsLoadTime[targetUserId] = Date.now();
      }

      setUserProfile(profileData);
      setUserMedia(media);

    } catch (error) {
      setError('Failed to load user details');
    } finally {
      setIsLoading(false);
    }
  };

  // Load current user profile for timezone comparison
  useEffect(() => {
    const loadCurrentUserProfile = async () => {
      try {

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ No authenticated user found');
          return;
        }
        console.log('✅ User found:', user.id);

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('country, gender, admin_approved')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('📊 Profile query result:', { profile, error });
        if (profile) {
          console.log('✅ Current user location:', profile);
          setCurrentUserProfile(profile as any);
        } else {
          console.log('❌ No profile found for current user');
        }
      } catch (error) {

      }
    };

    loadCurrentUserProfile();
  }, []);

  // Calculate timezone difference when both profiles are available
  useEffect(() => {
    if (currentUserProfile && userProfile) {

      const timeDiff = calculateTimeDifference(
        currentUserProfile.country,
        userProfile.country
      );

      setTimeDifference(timeDiff);
    } else {

      setTimeDifference(null);
    }
  }, [currentUserProfile, userProfile]);

  // Memoized helper functions for better performance
  const formatEnumValue = useCallback((value?: string) => {
    if (!value) return t('match_details.not_specified');
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, [t]);

  // Normalize stored values to match locale option keys (e.g., "dark brown" -> "dark_brown")
  const normalizeOptionValue = useCallback((value?: string) => {
    if (!value) return '';
    return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }, []);

  // Map common English display labels to canonical option keys used in locales
  const synonymMaps: Record<string, Record<string, string>> = {
    living: {
      living_alone: 'alone',
      with_parents: 'with_parents',
      with_children: 'with_children',
      // Extra normalizations for common phrasings stored in DB
      living_with_parents: 'with_parents',
      living_with_children: 'with_children'
    },
    quran: {
      memorized_significant_portions: 'memorized',
      read_fluently: 'fluent',
      read_with_help: 'with_help',
      learning_to_read: 'learning',
      cannot_read_arabic: 'cannot_read'
    },
    prayer_frequency: {
      most_prayers: 'most',
      all_5: 'all_5',
      // Extra normalizations for numeric phrasing
      five_times_daily: 'all_5',
      _5_times_daily: 'all_5',
      '5_times_daily': 'all_5',
      all_5_daily_prayers: 'all_5',
      all_five_daily_prayers: 'all_5',
      five_daily_prayers: 'all_5',
      friday_only: 'friday',
      occasionally: 'occasionally',
      learning: 'learning'
    },
    beard: {
      trimmed_beard: 'trimmed',
      full_beard: 'full',
      mustache_only: 'mustache',
      clean_shaven: 'clean'
    },
    education: {
      bachelor_s_degree: 'bachelor',
      bachelors_degree: 'bachelor',
      master_s_degree: 'master',
      masters_degree: 'master',
      phd_doctorate: 'phd',
      associate_degree: 'some_college',
      high_school: 'high_school'
    }
  };

  // Translate profile option by category; returns null if no matching key
  const translateOptionValue = useCallback((category: string, value?: string) => {
    if (!value) return null;
    const normalized = normalizeOptionValue(value);
    const canonical = synonymMaps[category]?.[normalized] ?? normalized;
    const key = `profile_setup.options.${category}.${canonical}`;
    const translated = t(key as any);
    return translated !== key ? translated : null;
  }, [t, normalizeOptionValue]);

  // Convenience: translate or fallback to formatted text
  const translateOrFormat = useCallback((category: string, value?: string) => {
    const tr = translateOptionValue(category, value);
    return tr ?? formatEnumValue(value);
  }, [translateOptionValue, formatEnumValue]);

  const parseIslamicQuestionnaire = useCallback((data?: any) => {
    if (!data) return null;
    
    // If it's already an object, return it directly
    if (typeof data === 'object' && data !== null) {
      return data;
    }
    
    // If it's a string, try to parse it
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Error parsing Islamic questionnaire string:', error);
        return null;
      }
    }
    
    return null;
  }, []);

  const calculateAge = useCallback((dateOfBirth: string) => {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, []);

  // Memoized computed values to avoid recalculation on every render
  const computedData = useMemo(() => {
    if (!userProfile) return null;

    const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
    const age = calculateAge(userProfile.date_of_birth);
    const location = [userProfile.country, userProfile.city].filter(Boolean).join(', ');
    const islamicData = parseIslamicQuestionnaire(userProfile.islamic_questionnaire);

    return {
      fullName,
      age,
      location,
      islamicData
    };
  }, [userProfile, calculateAge, parseIslamicQuestionnaire]);

  const openFullscreenImage = (mediaUri: string, mediaType: 'photo' | 'video' = 'photo') => {
    setSelectedImageUri(mediaUri);
    setSelectedMediaType(mediaType);
    setShowFullscreenImage(true);
  };

  const closeFullscreenImage = () => {
    setShowFullscreenImage(false);
    setSelectedImageUri('');
    setSelectedMediaType('photo');
  };

  // Smart thumbnail URL resolver with fallbacks (matching photosvideos.tsx logic)
  const getThumbnailUrl = (media: MediaReference) => {
    // Priority 1: Use permanent stored thumbnail from database (only if it's a real image)
    if (media.thumbnail_url && media.thumbnail_url.trim() !== '') {
      const thumbnailUrl = media.thumbnail_url;
      // Check if it's a real thumbnail image (PNG, JPG, etc.) like in photosvideos.tsx
      if (thumbnailUrl.includes('.jpg') || thumbnailUrl.includes('.jpeg') || 
          thumbnailUrl.includes('.png') || thumbnailUrl.includes('.webp')) {
        console.log('🎬 Using valid image thumbnail_url:', thumbnailUrl);
        return thumbnailUrl;
      }
      console.log('⚠️ thumbnail_url is not a valid image format:', thumbnailUrl);
    }

    // Priority 2: For videos without valid thumbnail, use default video thumbnail
    if (media.media_type === 'video') {
      console.log('📺 Using default video thumbnail (no valid image thumbnail available)');
      return DEFAULT_VIDEO_THUMBNAIL;
    }

    // Priority 4: Fallback to external_url for photos
    return media.external_url;
  };

  // Define slider media types
  type SliderMedia = 
    | { uri: string; type: 'photo'; id: string; videoUrl?: never; fallbackUri?: string }
    | { uri: string; type: 'video'; id: string; videoUrl: string; fallbackUri?: string };

  const getSliderImages = (): SliderMedia[] => {
    console.log('🎯 getSliderImages called with userMedia:', {
      userMediaExists: !!userMedia,
      userMediaLength: userMedia?.length || 0,
      userMediaSample: userMedia?.slice(0, 2).map(m => ({ id: m.id, type: m.media_type, url: m.external_url }))
    });
    
    let sliderImages: SliderMedia[] = [];
    
    if (userMedia && userMedia.length > 0) {
      // Separate photos and videos
      const photos = userMedia.filter(m => m.media_type === 'photo');
      const videos = userMedia.filter(m => m.media_type === 'video');

      // Sort photos by profile picture first, then by media_order
      const sortedPhotos = [...photos].sort((a, b) => {
        // Profile pictures first
        if (a.is_profile_picture && !b.is_profile_picture) return -1;
        if (!a.is_profile_picture && b.is_profile_picture) return 1;
        // Then by media_order
        return (a.media_order || 0) - (b.media_order || 0);
      });

      // Add all photos to slider
      sliderImages.push(
        ...sortedPhotos.map(photo => ({ 
          uri: photo.external_url, 
          type: 'photo' as const, 
          id: photo.id 
        }))
      );

      // Add video thumbnail as LAST slide in carousel
      if (videos.length > 0) {
        const sortedVideos = [...videos].sort((a, b) => (a.media_order || 0) - (b.media_order || 0));
        const video = sortedVideos[0];
        
        console.log('🎥 Adding video to slider:', {
          id: video.id,
          originalThumbnailUrl: video.thumbnail_url,
          resolvedThumbnail: getThumbnailUrl(video),
          videoUrl: video.external_url
        });
        
        sliderImages.push({
          uri: getThumbnailUrl(video),
          type: 'video',
          id: video.id,
          videoUrl: video.external_url,
        });
      }

      console.log('🖼️ Final slider composition:', {
        totalSlides: sliderImages.length,
        photos: photos.length,
        videos: videos.length > 0 ? 1 : 0
      });
    } else {
      console.log('❌ No userMedia available for slider');
    }
    
    // Priority 2: Add profile picture from user_profiles if not already included in media
    if (userProfile?.profile_picture_url && userProfile.profile_picture_url.trim() !== '') {
      const profilePicUrl = userProfile.profile_picture_url;
      
      // Check if this profile picture is already in the slider (avoid duplicates)
      const alreadyExists = sliderImages.some(img => 
        img.uri === profilePicUrl || img.id === 'profile_picture'
      );
      
      if (!alreadyExists && (profilePicUrl.startsWith('http') || profilePicUrl.startsWith('data:'))) {
        console.log('✅ Adding profile picture from user_profiles to slider');
        sliderImages.unshift({ // Add at the beginning
          uri: profilePicUrl, 
          type: 'photo' as const,
          id: 'profile_picture'
        });
      }
    }
    
    // Priority 3: Fallback to gender-specific silhouette if no media exists
    if (sliderImages.length === 0) {
      console.log('⚠️ No media found, using gender-specific silhouette');
      const isFemale = userProfile?.gender?.toLowerCase() === 'female';
      
      // For web compatibility, use direct image URLs with fallback
      if (Platform.OS === 'web') {
        const silhouetteUrl = isFemale 
          ? 'https://islamic-marriage-photos-2025.lon1.cdn.digitaloceanspaces.com/silhouette/female_silhouette.jpg'
          : 'https://islamic-marriage-photos-2025.lon1.cdn.digitaloceanspaces.com/silhouette/male_silhouette.png';
        
        const fallbackUrl = isFemale
          ? 'https://via.placeholder.com/400x600/e8e8e8/666666?text=👤+Female+Profile'
          : 'https://via.placeholder.com/400x600/e8e8e8/666666?text=👤+Male+Profile';
        
        sliderImages.push({ 
          uri: silhouetteUrl, 
          type: 'photo' as const,
          id: 'silhouette',
          fallbackUri: fallbackUrl
        });
      } else {
        const silhouettePath = isFemale 
          ? require('../assets/images/female_silhouette.jpg')
          : require('../assets/images/male_silhouette.png');
        
        sliderImages.push({ 
          uri: silhouettePath, 
          type: 'photo' as const,
          id: 'silhouette'
        });
      }
    }
    
    console.log('📸 Final slider images count:', sliderImages.length);
    return sliderImages;
  };

  // Custom AutoSlider component with tap functionality
  const renderAutoSlider = () => {
    const sliderImages = getSliderImages();
    const canViewPhotos = interestStatus === 'accepted' || (interestStatus === 'pending' && !isInterestSender);
    const desktop = Platform.OS === 'web' && isDesktopWeb();
    const sliderMaxWidth = desktop ? Math.min(SIZES.width, 720) : SIZES.width;
    const sidePadding = desktop ? Math.max((SIZES.width - sliderMaxWidth) / 2, 32) : 0;
    
    // AutoSlider debug (removed for cleaner output)
    
    return (
      <View style={[styles.autoSliderContainer, desktop && { paddingHorizontal: sidePadding }]}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.autoSliderScroll}
          contentContainerStyle={styles.autoSliderContentContainer}
        >
          {sliderImages.map((media, index) => (
            <TouchableOpacity 
              key={media.id} 
              onPress={() => {
                if (media.type === 'video') {
                  if (interestStatus !== 'accepted') return;
                  openFullscreenImage(media.videoUrl, 'video');
                } else {
                  if (!canViewPhotos) return;
                  openFullscreenImage(media.uri);
                }
              }}
              style={[styles.autoSliderImageContainer, desktop && { width: sliderMaxWidth }]}
            >
              <Image
                source={{ 
                  uri: silhouetteFailedToLoad[media.id] && media.fallbackUri 
                    ? media.fallbackUri 
                    : media.uri 
                }}
                style={[styles.autoSliderImage, desktop && { width: sliderMaxWidth }]}
                blurRadius={!canViewPhotos && media.type === 'photo' && media.id !== 'silhouette' ? 15 : 0}
                contentFit="cover"
                contentPosition="top"
                cachePolicy="memory-disk"
                transition={200}
                onLoadStart={() => {
                  console.log('🔄 Loading slider image:', { type: media.type, id: media.id, uri: media.uri });
                }}
                onLoad={() => {
                  console.log('✅ Slider image loaded successfully:', { type: media.type, id: media.id });
                }}
                onError={(error) => {
                  console.log('❌ Slider image error:', { 
                    type: media.type, 
                    id: media.id, 
                    uri: media.uri,
                    error 
                  });
                  // If this is a silhouette image that failed, try fallback
                  if (media.id === 'silhouette' && media.fallbackUri && !silhouetteFailedToLoad[media.id]) {
                    console.log('🔄 Silhouette image failed to load from DigitalOcean CDN, trying fallback');
                    setSilhouetteFailedToLoad(prev => ({ ...prev, [media.id]: true }));
                  }
                }}
              />
              {/* No text overlay; blur already applied above. Silhouette never blurred. */}
              
              {/* Video indicator overlay */}
              {media.type === 'video' && (
                <View style={styles.autoSliderVideoIndicator}>
                  <View style={styles.autoSliderPlayIconContainer}>
                    <Text style={styles.autoSliderPlayIconText}>▶</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {sliderImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                { backgroundColor: COLORS.primary }
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

    const renderHeader = () => {
        return (
            <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => safeGoBack(navigation, router, '/(tabs)/home')} style={styles.headerBackButton} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
                    <Image
                        source={icons.back}
            contentFit="contain"
                        style={styles.backIcon}
                    />
                </TouchableOpacity>

                {/* Removed favorite button per request */}
            </View>
    );
  };

  // Show skeleton loading state
  if (isLoading) {
    return <MatchDetailsSkeleton />;
  }

  // Show error state
  if (error || !userProfile) {
    return (
      <View style={[styles.area, { backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>{error || t('match_details.user_not_found')}</Text>
        
        {/* Button to go back */}
        <TouchableOpacity style={styles.backButton} onPress={() => safeGoBack(navigation, router, '/(tabs)/home')}>
          <Text style={styles.backButtonText}>{t('match_details.go_back')}</Text>
        </TouchableOpacity>
        
        {/* Button to try a different user - will be populated with a valid user ID from logs */}
        <TouchableOpacity 
          style={[styles.backButton, { marginTop: 10, backgroundColor: COLORS.secondary }]} 
          onPress={() => {
            // Replace with a valid user ID from your console logs
            // Example: navigateToValidUser('3f789864-9cf6-4865-95f2-20deab32495e');
            alert('Check console logs for valid user IDs and update the navigateToValidUser function with one of them');
          }}
        >
          <Text style={styles.backButtonText}>{t('match_details.try_different_user')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { fullName, age, location, islamicData } = computedData || {};

  return (
         <View style={[styles.area, { backgroundColor: COLORS.white }]}>
            <StatusBar hidden />
       {renderAutoSlider()}
            {renderHeader()}
      
            <ScrollView style={[styles.footerContainer, { backgroundColor: "white" }]}>
        {/* Basic Info: Name, Age */}
        <Text style={[styles.fullName, { color: COLORS.greyscale900 }]}>
          {fullName}, {age}
        </Text>
        
        {/* Location: Country, City */}
        {location && (
          <Text style={[styles.locationText, { color: COLORS.grayscale700 }]}>
            {location}
          </Text>
        )}

                          {/* Media Gallery Section (Photos and Videos) */}
         {userMedia && userMedia.length > 0 && (
           <>
             <Text style={[styles.subtitle, { color: COLORS.primary }]}>{t('match_details.photos_videos')}</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
               {userMedia
                 .sort((a, b) => {
                   // Photos first, then videos
                   if (a.media_type === 'photo' && b.media_type === 'video') return -1;
                   if (a.media_type === 'video' && b.media_type === 'photo') return 1;
                   // Within same type, sort by media_order
                   return (a.media_order || 0) - (b.media_order || 0);
                 })
                 .map((media, index) => (
                            <TouchableOpacity
                   key={media.id} 
                   style={styles.mediaItem}
                   onPress={() => {
                     const canViewPhotos = interestStatus === 'accepted' || (interestStatus === 'pending' && !isInterestSender);
                     if (media.media_type === 'video' && interestStatus !== 'accepted') return;
                     if (media.media_type === 'photo' && !canViewPhotos) return;
                     openFullscreenImage(media.external_url, media.media_type)
                   }}
                 >
                   {thumbnailLoading[media.id] && (
                     <View style={styles.thumbnailLoadingContainer}>
                       <ActivityIndicator size="small" color={COLORS.primary} />
                     </View>
                   )}
                   
                   <Image
                     source={{ uri: getThumbnailUrl(media) }}
                     style={[
                       styles.mediaImage,
                       thumbnailErrors[media.id] && styles.mediaImageError
                     ]}
                     blurRadius={(interestStatus !== 'accepted' && media.media_type === 'video') ? 0 : ((interestStatus === 'accepted' || (interestStatus === 'pending' && !isInterestSender)) ? 0 : (media.media_type === 'photo' ? 15 : 0))}
                     contentFit="cover"
                     cachePolicy="memory-disk"
                     transition={200}
                     onLoadStart={() => {
                       setThumbnailLoading(prev => ({ ...prev, [media.id]: true }));
                       setThumbnailErrors(prev => ({ ...prev, [media.id]: false }));
                     }}
                     onError={() => {
                       console.log('❌ Thumbnail failed to load:', {
                         mediaId: media.id,
                         thumbnail_url: media.thumbnail_url,
                         external_url: media.external_url,
                         resolvedUrl: getThumbnailUrl(media)
                       });
                       setThumbnailErrors(prev => ({ ...prev, [media.id]: true }));
                       setThumbnailLoading(prev => ({ ...prev, [media.id]: false }));
                     }}
                     onLoad={() => {
                       console.log('✅ Thumbnail loaded successfully:', {
                         mediaId: media.id,
                         thumbnail_url: media.thumbnail_url,
                         external_url: media.external_url,
                         resolvedUrl: getThumbnailUrl(media)
                       });
                       setThumbnailLoading(prev => ({ ...prev, [media.id]: false }));
                       setThumbnailErrors(prev => ({ ...prev, [media.id]: false }));
                     }}
                   />
                   
                   {/* Error state - show placeholder */}
                   {thumbnailErrors[media.id] && (
                     <View style={styles.thumbnailErrorContainer}>
                       <Text style={styles.thumbnailErrorText}>
                         {media.media_type === 'video' ? '🎥' : '🖼️'}
                       </Text>
                     </View>
                   )}
                   {/* Video indicator overlay */}
                   {media.media_type === 'video' && (
                     <View style={styles.videoIndicator}>
                       <View style={styles.playIconContainer}>
                         <Text style={styles.playIconText}>▶</Text>
                       </View>
                     </View>
                   )}
                            </TouchableOpacity>
                        ))}
             </ScrollView>
           </>
         )}

         {/* About Me Section - Always show */}
         <Text style={[styles.subtitle, { color: COLORS.primary }]}>{t('match_details.about_me')}</Text>
         <Text style={[styles.description, { color: COLORS.grayscale700 }] }>
           {userProfile.about_me || userProfile.bio || t('match_details.no_info_provided')}
         </Text>

        {/* Physical Details Section - Clean UI without lines */}
        <Text style={[styles.subtitle, { color: COLORS.primary }]}>{t('match_details.physical_details')}</Text>
        {userProfile.height_cm && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>{t('match_details.height')}: </Text>{userProfile.height_cm} cm
          </Text>
        )}
        {userProfile.weight_kg && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>{t('match_details.weight')}: </Text>{userProfile.weight_kg} kg
          </Text>
        )}
        {userProfile.eye_color && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>{t('match_details.eye_color')}: </Text>{translateOrFormat('eye_color', userProfile.eye_color)}
          </Text>
        )}
        {userProfile.hair_color && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>{t('match_details.hair_color')}: </Text>{translateOrFormat('hair_color', userProfile.hair_color)}
          </Text>
        )}
        {userProfile.skin_tone && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>{t('match_details.skin_tone')}: </Text>{translateOrFormat('skin_color', userProfile.skin_tone)}
          </Text>
        )}
        {userProfile.body_type && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>{t('match_details.body_type')}: </Text>{translateOrFormat('body_type', userProfile.body_type)}
          </Text>
        )}

                                 {/* Lifestyle & Work Section - Always show and clean UI */}
         <Text style={[styles.subtitle, { color: COLORS.primary }]}>{t('match_details.lifestyle_work')}</Text>
        
        {/* Education Level - Always show */}
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>{t('match_details.education_level')}: </Text>{userProfile.education_level ? translateOrFormat('education', userProfile.education_level) : t('match_details.not_specified')}
        </Text>
        
        {/* Languages Spoken */}
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>{t('match_details.languages_spoken')}: </Text>
          {userProfile.languages_spoken && userProfile.languages_spoken.length > 0 
            ? userProfile.languages_spoken.map((lng: string) => translateOrFormat('languages', lng)).join(', ') 
            : t('match_details.not_specified')}
        </Text>

        {/* Gender-specific work information */}
        {userProfile.gender === 'male' && (
          <>
            <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
              <Text style={styles.cleanDetailLabel}>{t('match_details.occupation')}: </Text>{userProfile.occupation || t('match_details.not_specified')}
            </Text>
            {userProfile.monthly_income && (
              <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
                <Text style={styles.cleanDetailLabel}>{t('match_details.monthly_income')}: </Text>{userProfile.monthly_income}
              </Text>
            )}
            <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
              <Text style={styles.cleanDetailLabel}>{t('match_details.social_condition')}: </Text>
              {userProfile.social_condition ? translateOrFormat('social_condition', userProfile.social_condition) : t('match_details.not_specified')}
            </Text>
          </>
        )}
        
        {userProfile.gender === 'female' && (
          <>
            <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
              <Text style={styles.cleanDetailLabel}>{t('match_details.work_status')}: </Text>
              {userProfile.work_status ? translateOrFormat('work_status', userProfile.work_status) : t('match_details.not_specified')}
            </Text>
            {(userProfile.work_status === 'working' || userProfile.occupation) && (
              <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
                <Text style={styles.cleanDetailLabel}>{t('match_details.occupation')}: </Text>{userProfile.occupation || t('match_details.not_specified')}
              </Text>
            )}
          </>
        )}

        {/* Housing Type - Always show */}
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>{t('match_details.housing_type')}: </Text>{userProfile.housing_type ? translateOrFormat('housing', userProfile.housing_type) : t('match_details.not_specified')}
        </Text>
        
        {/* Living Condition - Always show */}
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>{t('match_details.living_condition')}: </Text>
          {userProfile.living_condition ? translateOrFormat('living', userProfile.living_condition) : t('match_details.not_specified')}
        </Text>

                                 {/* Religious Commitment Section - Clean UI */}
         <Text style={[styles.subtitle, { color: COLORS.primary }]}>{t('match_details.religious_commitment')}</Text>
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>{t('match_details.religious_level')}: </Text>
          {islamicData?.religious_level ? translateOrFormat('religious_level', islamicData.religious_level) : t('match_details.not_specified')}
        </Text>
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>{t('match_details.prayer_frequency')}: </Text>
          {islamicData?.prayer_frequency ? translateOrFormat('prayer_frequency', islamicData.prayer_frequency) : t('match_details.not_specified')}
        </Text>
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>{t('match_details.quran_reading_level')}: </Text>
          {islamicData?.quran_reading_level ? translateOrFormat('quran', islamicData.quran_reading_level) : t('match_details.not_specified')}
        </Text>
        {userProfile.gender === 'female' && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>{t('match_details.covering_level')}: </Text>
            {islamicData?.covering_level ? translateOrFormat('covering', islamicData.covering_level) : t('match_details.not_specified')}
          </Text>
        )}
        {userProfile.gender === 'male' && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>{t('match_details.beard_practice')}: </Text>
            {islamicData?.beard_practice ? translateOrFormat('beard', islamicData.beard_practice) : t('match_details.not_specified')}
          </Text>
        )}

                                   {/* Marriage Intentions Section - Gender-specific filtering */}
         <Text style={[styles.subtitle, { color: COLORS.primary }]}>{t('match_details.marriage_intentions')}</Text>
         
         {/* For Males ONLY: Show seeking_wife_number */}
         {userProfile.gender === 'male' && (
           <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
             <Text style={styles.cleanDetailLabel}>{t('match_details.looking_for_wife')}: </Text>
             {islamicData?.seeking_wife_number ? 
               (islamicData.seeking_wife_number === '1' ? t('match_details.first_wife') :
                islamicData.seeking_wife_number === '2' ? t('match_details.second_wife') : 
                islamicData.seeking_wife_number === '3' ? t('match_details.third_wife') : 
                islamicData.seeking_wife_number === '4' ? t('match_details.fourth_wife') : 
                `${islamicData.seeking_wife_number}`) 
               : t('match_details.not_specified')}
           </Text>
         )}
         
         {/* For Females ONLY: Show accepted_wife_positions */}
         {userProfile.gender === 'female' && (
           <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
             <Text style={styles.cleanDetailLabel}>{t('match_details.accepted_wife_positions')}: </Text>
             {islamicData?.accepted_wife_positions && Array.isArray(islamicData.accepted_wife_positions) && islamicData.accepted_wife_positions.length > 0 ?
               islamicData.accepted_wife_positions.map((position: string) => 
                 position === '1' ? t('match_details.first_wife') :
                 position === '2' ? t('match_details.second_wife') : 
                 position === '3' ? t('match_details.third_wife') : 
                 position === '4' ? t('match_details.fourth_wife') : 
                 `${position}`)
               .join(', ')
               : t('match_details.not_specified')}
           </Text>
         )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fullscreen Media Modal */}
      <Modal
        visible={showFullscreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreenImage}
      >
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity 
            style={styles.fullscreenBackground}
            onPress={closeFullscreenImage}
          >
            <View style={styles.fullscreenImageWrapper}>
              {selectedMediaType === 'video' ? (
                // Video player for web
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                  <video
                    src={selectedImageUri}
                    controls
                    autoPlay
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      backgroundColor: 'black'
                    }}
                  />
                </div>
              ) : (
                // Image display
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.fullscreenImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
              )}
            </View>
            
            {/* Close button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeFullscreenImage}
            >
              <Text style={styles.closeButtonText}>{t('match_details.close')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* How it works Modal */}
      <Modal
        visible={showHowItWorksModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHowItWorksModal(false)}
      >
        <View style={styles.fullscreenContainer}>
          <View style={[styles.modalCard, { maxWidth: 380 }]}> 
            <Text style={[styles.subtitle, { marginTop: 0, marginBottom: 12, textAlign: 'center', color: COLORS.primary }]}>{t('help_center.tutorial.title')}</Text>

            {((currentUserProfile?.gender || '').toLowerCase() === 'female') ? (
              <>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}><Text style={styles.infoStepNumber}>1</Text></View>
                  <Text style={styles.infoStepText}>{t('help_center.tutorial.female.step1')}</Text>
                </View>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}><Text style={styles.infoStepNumber}>2</Text></View>
                  <Text style={styles.infoStepText}>{t('help_center.tutorial.female.step2')}</Text>
                </View>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}><Text style={styles.infoStepNumber}>3</Text></View>
                  <Text style={styles.infoStepText}>{t('help_center.tutorial.female.step3')}</Text>
                </View>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}><Text style={styles.infoStepNumber}>4</Text></View>
                  <Text style={styles.infoStepText}>{t('help_center.tutorial.female.step4')}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}><Text style={styles.infoStepNumber}>1</Text></View>
                  <Text style={styles.infoStepText}>{t('help_center.tutorial.male.step1')}</Text>
                </View>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}><Text style={styles.infoStepNumber}>2</Text></View>
                  <Text style={styles.infoStepText}>{t('help_center.tutorial.male.step2')}</Text>
                </View>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}><Text style={styles.infoStepNumber}>3</Text></View>
                  <Text style={styles.infoStepText}>{t('help_center.tutorial.male.step3')}</Text>
                </View>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}><Text style={styles.infoStepNumber}>4</Text></View>
                  <Text style={styles.infoStepText}>{t('help_center.tutorial.male.step4')}</Text>
                </View>
              </>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
              <TouchableOpacity 
                style={[styles.infoButton, styles.confirmButton, { width: '100%' }]} 
                onPress={() => {
                  setShowHowItWorksModal(false);
                  if (returnToModal === 'videoPre') setShowVideoPreconditionModal(true);
                  else if (returnToModal === 'videoInfo') setShowVideoMeetInfoModal(true);
                  else if (returnToModal === 'chatInfo') setShowChatInfoModal(true);
                  setReturnToModal('none');
                }}
              >
                <Text style={styles.infoButtonText}>{t('match_details.ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* White backdrop strip to hide underlying content while scrolling */}
      <View style={styles.fabBackdrop} />
      {/* Small 3-step indicator just above footer buttons */}
      <View style={styles.stepsContainer}>
        {/* Full-width white/blur backdrop behind circles for visibility */}
        <BlurView intensity={80} tint={'light'} style={styles.stepsBackdrop}>
          <View style={styles.stepsBackdropOverlay} />
        </BlurView>
        <View style={styles.stepsRow}>
          <View style={styles.stepColumn}>
            <Animated.View style={[styles.stepCircle, (interestStatus === 'accepted') && styles.stepCircleDone, (activeStep === 1) && { opacity: blinkOpacity }]}>
              <Text style={[styles.stepCircleText, (interestStatus === 'accepted') && styles.stepCircleTextDone]}>1</Text>
            </Animated.View>
          </View>
          <View style={styles.stepColumn}>
            <Animated.View style={[styles.stepCircle, (meetStatus === 'accepted') && styles.stepCircleDone, (activeStep === 2) && { opacity: blinkOpacity }]}>
              <Text style={[styles.stepCircleText, (meetStatus === 'accepted') && styles.stepCircleTextDone]}>2</Text>
            </Animated.View>
          </View>
          <View style={styles.stepColumn}>
            <Animated.View style={[styles.stepCircle, (messageStatus === 'accepted') && styles.stepCircleDone, (activeStep === 3) && { opacity: blinkOpacity }]}>
              <Text style={[styles.stepCircleText, (messageStatus === 'accepted') && styles.stepCircleTextDone]}>3</Text>
            </Animated.View>
          </View>
        </View>
      </View>
      {/* Floating footer actions */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (interestStatus === 'accepted') && { backgroundColor: COLORS.success },
            ((interestStatus === 'pending' && isInterestSender)) && styles.actionButtonDisabled,
          ]}
          disabled={(interestStatus === 'pending' && isInterestSender) || (interestStatus === 'accepted')}
          onPress={async () => {
            // Block unapproved female users from sending requests
            try {
              let cu = currentUserProfile as any;
              if (!cu) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('gender, admin_approved')
                    .eq('user_id', user.id)
                    .single();
                  cu = profile as any;
                  if (profile) setCurrentUserProfile(profile as any);
                }
              }
              if (cu?.gender?.toLowerCase() === 'female' && cu?.admin_approved !== true) {
                setShowUnderReviewModal(true);
                return;
              }
            } catch {}

            // First, show the photo request info modal
            if (interestStatus === 'none') {
              setShowPhotoRequestInfoModal(true);
              return;
            }
            
            try {
              const current = await InterestsService.getStatusForTarget(userId);
              if (current.status === 'pending') {
                setInterestStatus('pending');
                setIsInterestSender(current.isSender);
                setInterestRecordId(current.record?.id || null);
                return;
              }
              if (current.status === 'accepted') {
                setInterestStatus('accepted');
                setIsInterestSender(current.isSender);
                setInterestRecordId(current.record?.id || null);
                return;
              }

              const res = await InterestsService.sendInterest(userId);
              setInterestStatus('pending');
              setIsInterestSender(true);
              setInterestRecordId(res?.id || null);
            } catch (e) {
              Alert.alert(t('common.error'), t('match_details.unable_send_interest'));
            }
          }}
        >
          <Image source={icons.heart} contentFit="contain" style={styles.actionIcon} />
          <Text style={[styles.actionText, ((interestStatus === 'pending' && isInterestSender)) && styles.actionTextDisabled]}>
            {(interestStatus === 'accepted') ? t('match_details.approved') : ((interestStatus === 'pending' && isInterestSender) ? t('match_details.requested') : t('match_details.ask_photo'))}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            (meetStatus === 'accepted') && { backgroundColor: COLORS.success },
            // Keep button active; no disabled style for preconditions
          ]}
          disabled={false}
          onPress={async () => {
            if (interestStatus !== 'accepted') { setShowVideoPreconditionModal(true); return; }
            if (meetStatus === 'accepted') { router.push('/(tabs)/meet-requests?tab=approved'); return; }
            if (meetStatus === 'pending') {
              Alert.alert(t('match_details.video_meet'), isMeetSender ? t('match_details.pending_meet_waiting') : t('match_details.pending_meet_approve_in_tab'));
              return;
            }
            // No meet request yet → show info modal first
            setShowVideoMeetInfoModal(true);
          }}
        >
          <Image source={icons.videoCamera2} contentFit="contain" style={styles.actionIcon} />
          <Text style={[styles.actionText]}>
            {(meetStatus === 'accepted') ? t('match_details.approved') : ((meetStatus === 'pending' && isMeetSender) ? t('match_details.requested') : t('match_details.video_meet'))}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            (messageStatus === 'accepted') && { backgroundColor: COLORS.success },
            (messageStatus === 'pending' && isMessageSender) && styles.actionButtonDisabled,
          ]}
          disabled={(messageStatus === 'pending' && isMessageSender)}
          onPress={() => {
            if (messageStatus === 'accepted') { router.push('/(tabs)/chats?tab=approved'); return; }
            setChatOathConfirmed(false);
            setShowChatInfoModal(true);
          }}
        >
          <Image source={icons.chat} contentFit="contain" style={styles.actionIcon} />
          <Text style={[
            styles.actionText,
            (messageStatus === 'pending' && isMessageSender) && styles.actionTextDisabled
          ]}>
            {messageStatus === 'accepted' ? t('match_details.approved') : (messageStatus === 'pending' && isMessageSender) ? t('match_details.requested') : t('match_details.message')}
          </Text>
        </TouchableOpacity>
      </View>
      {/* Photo Request Info Modal */}
      <Modal
        visible={showPhotoRequestInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoRequestInfoModal(false)}
      >
        <View style={styles.fullscreenContainer}>
          <View style={[styles.modalCard, { maxWidth: 340 }]}>
            <Text style={[styles.subtitle, { marginTop: 0, marginBottom: 12, textAlign: 'center', color: COLORS.primary }]}>{t('match_details.photo_request_process')}</Text>
            
            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>1</Text>
              </View>
              <Text style={styles.infoStepText}>{t('match_details.step_1_photo')}</Text>
            </View>
            
            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>2</Text>
              </View>
              <Text style={styles.infoStepText}>{t('match_details.step_2_photo')}</Text>
            </View>
            
            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>3</Text>
              </View>
              <Text style={styles.infoStepText}>{t('match_details.step_3_photo')}</Text>
            </View>
            
            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>4</Text>
              </View>
              <Text style={styles.infoStepText}>{t('match_details.step_4_photo')}</Text>
            </View>
            
            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>5</Text>
              </View>
              <Text style={styles.infoStepText}>{t('match_details.step_5_photo')}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity 
                style={[styles.infoButton, styles.cancelButton]} 
                onPress={() => setShowPhotoRequestInfoModal(false)}
              >
                <Text style={[styles.infoButtonText, { color: COLORS.primary }]}>{t('match_details.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.infoButton, styles.confirmButton]} 
                onPress={async () => {
                  setShowPhotoRequestInfoModal(false);
                  try {
                    // Block unapproved female users from sending requests
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        let cu = currentUserProfile as any;
                        if (!cu) {
                          const { data: profile } = await supabase
                            .from('user_profiles')
                            .select('gender, admin_approved')
                            .eq('user_id', user.id)
                            .single();
                          cu = profile as any;
                          if (profile) setCurrentUserProfile(profile as any);
                        }
                        if (cu?.gender?.toLowerCase() === 'female' && cu?.admin_approved !== true) {
                          setShowUnderReviewModal(true);
                          return;
                        }
                      }
                    } catch {}

                    const res = await InterestsService.sendInterest(userId);
                    setInterestStatus('pending');
                    setIsInterestSender(true);
                    setInterestRecordId(res?.id || null);
                  } catch (e) {
                    Alert.alert(t('common.error'), t('match_details.unable_send_photo_request'));
                  }
                }}
              >
                <Image source={icons.heart2} contentFit="contain" style={{ width: 18, height: 18, tintColor: COLORS.white, marginRight: 8 }} />
                <Text style={styles.infoButtonText}>{t('match_details.send')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Under Review Modal */}
      <Modal
        visible={showUnderReviewModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnderReviewModal(false)}
      >
        <View style={styles.fullscreenContainer}>
          <View style={[styles.modalCard, { maxWidth: 360 }]}> 
            <Text style={[styles.subtitle, { marginTop: 0, marginBottom: 12, textAlign: 'center', color: COLORS.primary }]}>
              {t('match_details.profile_under_review_title')}
            </Text>
            <Text style={[styles.infoStepText, { textAlign: 'center', marginBottom: 20 }]}>
              {t('match_details.profile_under_review_message')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
              <TouchableOpacity 
                style={[styles.infoButton, styles.confirmButton, { width: '100%' }]} 
                onPress={() => setShowUnderReviewModal(false)}
              >
                <Text style={styles.infoButtonText}>{t('match_details.noted')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Meet Precondition Modal */}
      <Modal
        visible={showVideoPreconditionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVideoPreconditionModal(false)}
      >
        <View style={styles.fullscreenContainer}>
          <View style={[styles.modalCard, { maxWidth: 360 }]}> 
            <Text style={[styles.subtitle, { marginTop: 0, marginBottom: 12, textAlign: 'center', color: COLORS.primary }]}>{t('match_details.video_meet_info')}</Text>
            {(interestStatus === 'pending' && isInterestSender) ? (
              <Text style={[styles.infoStepText, { textAlign: 'center' }]}>{t('match_details.pending_photo_request_message')}</Text>
            ) : (
              <>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}>
                    <Text style={styles.infoStepNumber}>1</Text>
                  </View>
                  <Text style={styles.infoStepText}>{t('match_details.step_1_video')}</Text>
                </View>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}>
                    <Text style={styles.infoStepNumber}>2</Text>
                  </View>
                  <Text style={styles.infoStepText}>{t('match_details.step_2_video')}</Text>
                </View>
              </>
            )}
            {/* See how it works link */}
            <TouchableOpacity onPress={() => {
              setReturnToModal('videoPre');
              setShowVideoPreconditionModal(false);
              setShowHowItWorksModal(true);
            }}>
              <Text style={styles.linkText}>{t('match_details.see_how_it_works')}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
              <TouchableOpacity 
                style={[styles.infoButton, styles.confirmButton, { width: '100%' }]} 
                onPress={() => setShowVideoPreconditionModal(false)}
              >
                <Text style={styles.infoButtonText}>{t('match_details.ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Meet Info Modal */}
      <Modal
        visible={showVideoMeetInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVideoMeetInfoModal(false)}
      >
        <View style={styles.fullscreenContainer}>
          <View style={[styles.modalCard, { maxWidth: 340 }]}>
            <Text style={[styles.subtitle, { marginTop: 0, marginBottom: 12, textAlign: 'center', color: COLORS.primary }]}>{t('match_details.video_meet_process')}</Text>
            
            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>1</Text>
              </View>
              <Text style={styles.infoStepText}>{t('match_details.step_1_meet')}</Text>
            </View>
            
            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>2</Text>
              </View>
              <Text style={styles.infoStepText}>{t('match_details.step_2_meet')}</Text>
            </View>
            
            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>3</Text>
              </View>
              <Text style={styles.infoStepText}>{t('match_details.step_3_meet')}</Text>
            </View>
            
            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>4</Text>
              </View>
              <Text style={styles.infoStepText}>{t('match_details.step_4_meet')}</Text>
            </View>
            
            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>5</Text>
              </View>
              <Text style={styles.infoStepText}>{t('match_details.step_5_meet')}</Text>
            </View>
            {/* See how it works link */}
            <TouchableOpacity onPress={() => {
              setReturnToModal('videoInfo');
              setShowVideoMeetInfoModal(false);
              setShowHowItWorksModal(true);
            }}>
              <Text style={styles.linkText}>{t('match_details.see_how_it_works')}</Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity 
                style={[styles.infoButton, styles.cancelButton]} 
                onPress={() => setShowVideoMeetInfoModal(false)}
              >
                <Text style={[styles.infoButtonText, { color: COLORS.primary }]}>{t('match_details.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.infoButton, styles.confirmButton]} 
                onPress={async () => {
                  // Get current user profile if not loaded
                  let userGender = currentUserProfile?.gender;
                  if (!userGender) {
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        const { data: profile } = await supabase
                          .from('user_profiles')
                          .select('gender')
                          .eq('user_id', user.id)
                          .single();
                        userGender = profile?.gender;
                      }
                    } catch (e) {
                      console.log('Error getting user profile:', e);
                    }
                  }
                  
                  // Check if male user has a package before allowing video scheduling
                  if (userGender?.toLowerCase() === 'male') {
                    const hasPackage = await checkUserPackage();
                    if (!hasPackage) {
                      setShowVideoMeetInfoModal(false);
                      setShowUpgradeModal(true);
                      return;
                    }
                  }
                  
                  setShowVideoMeetInfoModal(false);
                  setShowMeetModal(true);
                }}
              >
                <Image source={icons.videoCamera2} contentFit="contain" style={{ width: 18, height: 18, tintColor: COLORS.white, marginRight: 8 }} />
                <Text style={styles.infoButtonText}>{t('match_details.schedule')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Meet scheduling modal */}
      <Modal
        visible={showMeetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMeetModal(false)}
      >
        <View style={styles.fullscreenContainer}>
          <View style={styles.modalCard}>
            <Text style={[styles.subtitle, { marginTop: 0, marginBottom: 8 }]}>{t('match_details.schedule_video_meet')}</Text>
            
            {/* Timezone Information */}
            {(timeDifference || (currentUserProfile && userProfile)) && (
              <View style={styles.timezoneInfoContainer}>
                <View style={styles.timezoneInfoRow}>
                  <Image
                    source={icons.world}
                    contentFit="contain"
                    style={[styles.timezoneIcon, { tintColor: timeDifference?.isSignificant ? COLORS.red : COLORS.primary }]}
                  />
                  <Text style={[styles.timezoneText, { color: timeDifference?.isSignificant ? COLORS.red : COLORS.grayscale700 }]}>
                    {timeDifference
                      ? t(timeDifference.messageKey, { hours: timeDifference.hoursLabel })
                      : t('match_details.calculating_time_difference')}
                  </Text>
                </View>
                {timeDifference?.isSignificant && (
                  <Text style={styles.timezoneWarning}>
                    ⚠️ {t('match_details.time_difference_warning')}
                  </Text>
                )}

              </View>
            )}
            
            {/* Always show timezone reminder */}
            {!timeDifference && !currentUserProfile && (
              <View style={styles.timezoneReminderContainer}>
                <View style={styles.timezoneInfoRow}>
                  <Image
                    source={icons.clock}
                    contentFit="contain"
                    style={[styles.timezoneIcon, { tintColor: COLORS.primary }]}
                  />
                  <Text style={[styles.timezoneText, { color: COLORS.grayscale700 }]}>
                    {t('match_details.timezone_reminder')}
                  </Text>
                </View>
              </View>
            )}
            

            
            {Platform.OS === 'web' ? (
              // Two-step picker on web: date then time
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', marginBottom: 12 }}>
                  <input
                    type="date"
                    value={meetDate}
                    onChange={(e: any) => { setMeetDate(e.target.value); }}
                    min={todayDateStr}
                    style={{ width: '85%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #e9e9ef', display: 'block', margin: '0 auto' }}
                  />
                </div>
                {meetDate && (
                  <div style={{ width: '100%', marginBottom: 12 }}>
                    <input
                      type="time"
                      step={900}
                      value={meetTime}
                      onChange={(e: any) => { setMeetTime(e.target.value); }}
                      style={{ width: '85%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #e9e9ef', display: 'block', margin: '0 auto' }}
                    />
                  </div>
                )}
                
                {/* Show time in both timezones when both date and time are selected */}
                {meetDate && meetTime && timeDifference && timeDifference.hoursDifference > 0 && (
                  <div style={{ width: '100%', marginBottom: 12, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                    <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, textAlign: 'center', color: '#495057' }}>{t('match_details.meeting_time_comparison')}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#6c757d' }}>{t('match_details.your_time')}</div>
                        <div style={{ color: '#495057' }}>{meetTime}</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#6c757d' }}>{t('match_details.their_time')}</div>
                        <div style={{ color: '#495057' }}>
                          {(() => {
                            try {
                              const selectedDateTime = new Date(`${meetDate}T${meetTime}`);
                              const timeComparison = getLocalTimeForUser(
                                selectedDateTime,
                                currentUserProfile?.country,
                                userProfile?.country
                              );
                              return timeComparison?.otherUserTime || meetTime;
                            } catch {
                              return meetTime;
                            }
                          })()
                        }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <TextInput
                placeholder={t('match_details.datetime_placeholder')}
                value={scheduledAt}
                onChangeText={setScheduledAt}
                style={{ borderWidth: 1, borderColor: '#e9e9ef', borderRadius: 12, padding: 12, marginBottom: 12 }}
              />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => { setShowMeetModal(false); setScheduledAt(''); setMeetDate(''); setMeetTime(''); }}>
                <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>{t('match_details.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]} onPress={async () => {
                try {
                  let iso = '';
                  if (Platform.OS === 'web') {
                    if (!meetDate || !meetTime) { Alert.alert(t('match_details.select_time'), t('match_details.please_select_date_time')); return; }
                    // Block past dates (yesterday and earlier)
                    if (meetDate < todayDateStr) { Alert.alert(t('match_details.invalid_date'), t('match_details.select_today_future')); return; }
                    iso = new Date(`${meetDate}T${meetTime}`).toISOString();
                  } else {
                    iso = scheduledAt ? new Date(scheduledAt.replace(' ', 'T')).toISOString() : '';
                    if (!iso) { Alert.alert(t('match_details.select_time'), t('match_details.enter_date_time')); return; }
                    // Validate entered date is today or future
                    const datePart = scheduledAt.split(' ')[0];
                    if (datePart && datePart < todayDateStr) { Alert.alert(t('match_details.invalid_date'), t('match_details.select_today_future')); return; }
                  }
                  
                  await MeetService.sendRequest(userId, iso);
                  setMeetStatus('pending');
                  setIsMeetSender(true);
                  setMeetScheduledAt(iso);
                  setShowMeetModal(false);
                  setScheduledAt('');
                  setMeetDate('');
                  setMeetTime('');
                  Alert.alert(t('match_details.video_meet'), t('match_details.request_submitted'));
                } catch (error: any) {
                  // Check if it's a package upgrade error
                  if (error?.message?.includes('upgrade your package to Premium')) {
                    setShowMeetModal(false);
                    setShowUpgradeModal(true);
                  } else {
                    Alert.alert(t('common.error'), t('match_details.unable_send_meet_request'));
                  }
                }
              }}>
                <Text style={styles.tinyBtnText}>{t('match_details.send')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat Info Modal */}
      <Modal
        visible={showChatInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChatInfoModal(false)}
      >
        <View style={styles.fullscreenContainer}>
          <View style={[styles.modalCard, { maxWidth: 360 }]}> 
            <Text style={[styles.subtitle, { marginTop: 0, marginBottom: 12, textAlign: 'center', color: COLORS.primary }]}>{t('match_details.chat_request_process')}</Text>

            <View style={styles.infoStepContainer}>
              <View style={styles.infoStepNumberContainer}>
                <Text style={styles.infoStepNumber}>1</Text>
              </View>
              <Text style={styles.infoStepText}>
                {meetStatus === 'none'
                  ? t('match_details.need_meeting_first')
                  : (canMessage
                      ? t('match_details.swear_for_nikah')
                      : t('match_details.chat_after_meeting'))}
              </Text>
            </View>

            {!!meetScheduledAt && (
              <Text style={[styles.infoStepText, { textAlign: 'center', marginBottom: 12 }]}>{t('match_details.meeting_time')}: {formatMeetingDateShort(meetScheduledAt)}</Text>
            )}

            {meetStatus !== 'none' && !canMessage && (
              <>
                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}>
                    <Text style={styles.infoStepNumber}>2</Text>
                  </View>
                  <Text style={styles.infoStepText}>{t('match_details.swear_had_meeting')}</Text>
                </View>

                <View style={styles.infoStepContainer}>
                  <View style={styles.infoStepNumberContainer}>
                    <Text style={styles.infoStepNumber}>3</Text>
                  </View>
                  <Text style={styles.infoStepText}>{t('match_details.see_whatsapp')}</Text>
                </View>
              </>
            )}

            {canMessage && (
              <View style={styles.infoStepContainer}>
                <View style={styles.infoStepNumberContainer}>
                  <Text style={styles.infoStepNumber}>2</Text>
                </View>
                <Text style={styles.infoStepText}>{t('match_details.see_whatsapp_messages')}</Text>
              </View>
            )}
            {/* See how it works link */}
            <TouchableOpacity onPress={() => {
              setReturnToModal('chatInfo');
              setShowChatInfoModal(false);
              setShowHowItWorksModal(true);
            }}>
              <Text style={styles.linkText}>{t('match_details.see_how_it_works')}</Text>
            </TouchableOpacity>

            {canMessage && (
              <TouchableOpacity
                onPress={() => setChatOathConfirmed(prev => !prev)}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                  backgroundColor: chatOathConfirmed ? COLORS.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                  {chatOathConfirmed && (
                    <Text style={{ color: COLORS.white, fontFamily: 'bold', fontSize: 14 }}>✓</Text>
                  )}
                </View>
                <Text style={[styles.infoStepText, { flex: 1 }]}>{t('match_details.yes_i_swear')}</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity 
                style={[styles.infoButton, styles.cancelButton]} 
                onPress={() => setShowChatInfoModal(false)}
              >
                <Text style={[styles.infoButtonText, { color: COLORS.primary }]}>{t('match_details.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.infoButton,
                  styles.confirmButton,
                  (!canMessage || (canMessage && !chatOathConfirmed)) && { opacity: 0.6 }
                ]} 
                onPress={() => {
                  const disabled = (!canMessage) || (canMessage && !chatOathConfirmed);
                  if (disabled) return; // gate request until eligible time and oath confirmed
                  setShowChatInfoModal(false);
                  (async () => {
                    try {
                      await MessageRequestsService.send(userId);
                      Alert.alert(t('common.success'), t('match_details.chat_request_sent'));
                      router.push('/(tabs)/chats');
                    } catch (e) {
                      Alert.alert(t('common.error'), t('match_details.unable_send_chat_request'));
                    }
                  })();
                }}
              >
                <Image source={icons.chat} contentFit="contain" style={{ width: 18, height: 18, tintColor: COLORS.white, marginRight: 8 }} />
                <Text style={styles.infoButtonText}>{t('match_details.request')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Package Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.fullscreenContainer}>
          <View style={[styles.modalCard, { maxWidth: 340 }]}>
            <Text style={[styles.subtitle, { marginTop: 0, marginBottom: 16, textAlign: 'center', color: COLORS.primary }]}>{t('match_details.upgrade_required')}</Text>
            
            <Text style={[styles.infoStepText, { textAlign: 'center', marginBottom: 20 }]}>
              {t('match_details.need_premium')}
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <TouchableOpacity 
                style={[styles.infoButton, styles.cancelButton]} 
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={[styles.infoButtonText, { color: COLORS.primary }]}>{t('match_details.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.infoButton, styles.confirmButton]} 
                onPress={() => {
                  setShowUpgradeModal(false);
                  router.push('/membership');
                }}
              >
                <Text style={styles.infoButtonText}>{t('match_details.upgrade')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
        </View>
  );
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    infoStepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoStepNumberContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoStepNumber: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'bold',
    },
    infoStepText: {
        fontSize: 16,
        fontFamily: 'medium',
        color: COLORS.greyscale900,
        flex: 1,
    },
    infoButton: {
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        flexDirection: 'row',
        flex: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cancelButton: {
        backgroundColor: COLORS.tansparentPrimary,
        borderColor: COLORS.primary,
        borderWidth: 1,
        marginRight: 10,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        marginLeft: 10,
    },
    infoButtonText: {
        fontSize: 16,
        fontFamily: 'bold',
        color: COLORS.white,
    },
    headerContainer: {
        width: SIZES.width - 32,
        flexDirection: "row",
        justifyContent: "space-between",
        position: "absolute",
        top: 16,
        zIndex: 999,
        left: 16,
        right: 16
    },
    headerBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 4,
    },
    backIcon: {
        width: 26,
        height: 26,
        tintColor: COLORS.black
    },
    bookmarkIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.white
    },
    iconContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    footerContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: getResponsiveSpacing(120),
        backgroundColor: "white",
        borderTopRightRadius: 32,
        borderTopLeftRadius: 32,
        marginTop: -24,
        paddingVertical: 12
    },
    fullName: {
        fontSize: getResponsiveFontSize(28),
        fontFamily: "bold",
        color: COLORS.greyscale900,
        marginBottom: getResponsiveSpacing(8)
    },
    locationText: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: "medium",
        color: COLORS.grayscale700,
        marginBottom: getResponsiveSpacing(20)
    },
    positionText: {
        fontSize: getResponsiveFontSize(18),
        fontFamily: "medium",
        color: COLORS.grayscale700,
        marginRight: 16
    },
    viewView: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "rgba(150, 16, 255, 0.1)",
        borderRadius: 12
    },
    viewText: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: "medium",
        color: COLORS.primary
    },
    positionContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: getResponsiveSpacing(16)
    },
    subtitle: {
        fontSize: getResponsiveFontSize(20),
        fontFamily: "bold",
        color: COLORS.greyscale900,
        marginTop: getResponsiveSpacing(20),
        marginBottom: getResponsiveSpacing(12)
    },
    description: {
        fontSize: getResponsiveFontSize(17),
        fontFamily: "regular",
        color: COLORS.grayscale700,
        lineHeight: 22,
        marginBottom: getResponsiveSpacing(8)
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: getResponsiveSpacing(8)
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginVertical: 4,
        marginHorizontal: 4,
        alignItems: 'center'
    },
    buttonText: {
        fontSize: getResponsiveFontSize(14),
        color: COLORS.white,
        fontFamily: 'medium',
    },
    detailsContainer: {
        marginTop: getResponsiveSpacing(8),
        marginBottom: getResponsiveSpacing(8)
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: getResponsiveSpacing(8),
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.grayscale400
    },
    detailLabel: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: 'medium',
        color: COLORS.grayscale700,
        flex: 1
    },
    detailValue: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: 'regular',
        color: COLORS.black,
        flex: 1,
        textAlign: 'right'
    },
    loadingText: {
        marginTop: 12,
        fontSize: getResponsiveFontSize(18),
        fontFamily: 'regular',
        color: COLORS.gray,
    },
    errorText: {
        fontSize: getResponsiveFontSize(18),
        fontFamily: 'regular',
        color: COLORS.red,
        textAlign: 'center',
        marginBottom: 20
    },
    backButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25
    },
    backButtonText: {
        fontSize: getResponsiveFontSize(18),
        fontFamily: 'medium',
        color: COLORS.white
    },
    bottomSpacing: {
        height: getResponsiveSpacing(50)
    },
    cleanDetailText: {
        fontSize: getResponsiveFontSize(17),
        fontFamily: "medium", // Make the entire text (including data) bold
        color: COLORS.grayscale700,
        marginBottom: getResponsiveSpacing(8),
        lineHeight: 22
    },
    cleanDetailLabel: {
        fontSize: getResponsiveFontSize(17),
        fontFamily: "medium",
        color: COLORS.black
    },
    mediaScroll: {
        marginBottom: getResponsiveSpacing(20)
    },
    mediaItem: {
        marginRight: getResponsiveSpacing(12),
        borderRadius: 12,
        overflow: 'hidden'
    },
    mediaImage: {
        width: getResponsiveSpacing(100),
        height: getResponsiveSpacing(100),
        borderRadius: 12
    },
    videoIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
    },
    playIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    playIconText: {
        fontSize: getResponsiveFontSize(18),
        color: COLORS.primary,
        fontFamily: 'bold',
        marginLeft: 2, // Slight offset to center the triangle visually
    },
    thumbnailLoadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 12,
        zIndex: 1,
    },
    mediaImageError: {
        opacity: 0.3,
    },
    thumbnailErrorContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.grayscale200,
        borderRadius: 12,
        zIndex: 2,
    },
    thumbnailErrorText: {
        fontSize: getResponsiveFontSize(26),
        color: COLORS.grayscale700,
        fontFamily: 'bold',
    },

    // AutoSlider styles
    autoSliderContainer: {
        width: SIZES.width,
        height: SIZES.height * 0.5,
        position: 'relative',
    },
    autoSliderScroll: {
        flex: 1,
    },
    autoSliderContentContainer: {
        alignItems: 'center',
    },
    autoSliderImageContainer: {
        width: SIZES.width,
        height: SIZES.height * 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    autoSliderImage: {
        width: SIZES.width,
        height: SIZES.height * 0.5,
    },
    lockOverlayDetails: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockOverlayText: {
        color: COLORS.white,
        fontFamily: 'bold',
        fontSize: getResponsiveFontSize(16),
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 48,
        alignSelf: 'center',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 5,
    },
    // Floating footer actions
    fabBackdrop: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 36,
        height: 42, // exactly equal to button height
        backgroundColor: COLORS.white,
    },
    fabContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    // Steps indicator styles
    stepsContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 8, // place slightly below buttons
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        position: 'relative',
    },
    stepsBackdrop: {
        position: 'absolute',
        left: -16, // extend to full screen width (container has 16px margins)
        right: -16,
        bottom: -6,
        height: 44,
        borderRadius: 0,
        overflow: 'hidden',
    },
    stepsBackdropOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.98)'
    },
    // (connectors removed as requested)
    stepColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepItem: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleDone: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
    },
    stepCircleText: {
        fontFamily: 'bold',
        fontSize: getResponsiveFontSize(12),
        color: COLORS.primary,
    },
    stepCircleTextDone: {
        color: COLORS.white,
    },
    stepConnector: {
        flex: 1,
        height: 2,
        backgroundColor: COLORS.grayscale400,
        marginHorizontal: 6,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        height: 42,
        borderRadius: 10,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 3,
        elevation: 5,
        flex: 1,
    },
    actionIcon: {
        width: 18,
        height: 18,
        tintColor: COLORS.white,
    },
    actionText: {
        color: COLORS.white,
        fontFamily: 'semiBold',
        fontSize: getResponsiveFontSize(16),
    },
    actionButtonDisabled: {
        backgroundColor: 'rgba(150, 16, 255, 0.35)',
    },
    actionTextDisabled: {
        color: 'rgba(255,255,255,0.85)'
    },
    linkText: {
        color: COLORS.primary,
        fontFamily: 'medium',
        textAlign: 'center',
        marginTop: 8,
        textDecorationLine: 'underline'
    },
    tinyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    tinyBtnText: {
        fontSize: getResponsiveFontSize(12),
        color: COLORS.white,
        fontFamily: 'semiBold',
    },
    // Fullscreen modal styles
    fullscreenContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        width: Math.min(420, SIZES.width - 24),
        marginHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    fullscreenBackground: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImageWrapper: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    closeButtonText: {
        color: COLORS.white,
        fontSize: getResponsiveFontSize(16),
        fontFamily: 'semibold',
        textAlign: 'center',
    },
    timezoneInfoContainer: {
        backgroundColor: COLORS.tansparentPrimary,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    timezoneInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    timezoneIcon: {
        width: 16,
        height: 16,
        marginRight: 8,
    },
    timezoneText: {
        fontSize: getResponsiveFontSize(14),
        fontFamily: 'medium',
        flex: 1,
    },
    timezoneWarning: {
        fontSize: getResponsiveFontSize(12),
        fontFamily: 'regular',
        color: COLORS.red,
        fontStyle: 'italic',
        textAlign: 'center',
    },

    timezoneReminderContainer: {
        backgroundColor: COLORS.grayscale100,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.grayscale400,
    },
    
    // AutoSlider video indicator styles
    autoSliderVideoIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    autoSliderPlayIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    autoSliderPlayIconText: {
        fontSize: getResponsiveFontSize(22),
        color: COLORS.primary,
        fontFamily: 'bold',
        marginLeft: 2, // Slight offset to center the triangle visually
    }
})

export default MatchDetails