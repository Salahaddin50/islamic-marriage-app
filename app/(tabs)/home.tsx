 import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, FlatList, useWindowDimensions, ScrollView, Alert, Modal } from 'react-native';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, images, SIZES } from '@/constants';
import { getResponsiveWidth, getResponsiveFontSize, getResponsiveSpacing, isMobileWeb, isDesktopWeb } from '@/utils/responsive';
import { useNavigation, useRouter } from 'expo-router';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { menbers } from '@/data';
import { supabase } from '@/src/config/supabase';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import MatchCard from '@/components/MatchCard';
import GalleryView from '@/components/GalleryView';
import GridView from '@/components/GridView';
import HomeListSkeleton from '@/components/HomeListSkeleton';
import { Database } from '@/src/types/database.types';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useMatchStore } from '@/src/store';
import { InterestsService, InterestStatus } from '@/src/services/interests';
import { FlatGrid } from 'react-native-super-grid';
import { imageCache } from '@/utils/imageCache';
import { useNotifications } from '@/src/contexts/NotificationContext';
import DesktopMobileNotice from '@/components/DesktopMobileNotice';
import { OptimizedProfilesService } from '@/src/services/optimized-profiles.service';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { trackEvent, trackPageView } from '@/src/utils/analytics';
import { authCache } from '@/src/utils/auth-cache';

// Cached profile image to prevent reloading
let cachedProfileImageUrl: string | null = null;
let profileImageLoadTime = 0;
const PROFILE_IMAGE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Age calculation utility
const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

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
// In-memory session flag: resets on full page reload (web) or app restart (native)
let didForceRefreshThisSession = false;

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
  const { t } = useLanguage();
  // Larger touch area for smoother mobile dragging on sliders
  const sliderTouchDims = React.useMemo(() => ({ height: 56, width: 56, borderRadius: 28, slipDisplacement: 60 }), []);
  // Temporarily silence console noise on this screen
  useEffect(() => {
    // Track home screen view (web only)
    trackPageView('/home');
    trackEvent({ name: 'home_open' });

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
  const navigation = useNavigation<NavigationProp<any>>();
  const [totalUnreadCount, setTotalUnreadCount] = React.useState(0);
  // Aggregate unread count from conversations table in realtime
  React.useEffect(() => {
    let isMounted = true;

    const computeTotal = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;
        
        // Try cache first for instant display
        const cacheKey = `messenger_unread_${user.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { count, timestamp } = JSON.parse(cached);
          // Use cache if less than 1 minute old
          if (Date.now() - timestamp < 60000) {
            setTotalUnreadCount(count);
          }
        }
        
        const { data, error } = await supabase
          .from('conversations')
          .select('user_a,user_b,messages,last_read_at_user_a,last_read_at_user_b');
        if (error || !isMounted) return;
        
        const total = (data || []).reduce((acc: number, row: any) => {
          const isA = row.user_a === user.id;
          const myLastRead = isA ? row.last_read_at_user_a : row.last_read_at_user_b;
          const unread = (row.messages || []).filter((m: any) => 
            m.message_type === 'text' && 
            m.sender_id !== user.id && 
            (m.status === 'approved') && // Count only approved
            (!myLastRead || m.created_at > myLastRead)
          ).length;
          return acc + unread;
        }, 0);
        
        if (isMounted) {
          setTotalUnreadCount(total);
          // Cache the result
          localStorage.setItem(cacheKey, JSON.stringify({ count: total, timestamp: Date.now() }));
        }
      } catch (e) {
        console.error('Failed to compute messenger unread count:', e);
      }
    };

    // Initial load
    computeTotal();

    // Real-time updates with immediate callback
    const channel = supabase
      .channel('conversations-unread-total')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations' 
      }, (payload) => {
        // Immediate update without waiting for full recompute
        setTimeout(computeTotal, 0);
      })
      .subscribe();
      
    // Also poll every 30 seconds as fallback
    const interval = setInterval(computeTotal, 30000);
    
    return () => { 
      isMounted = false; 
      try { supabase.removeChannel(channel); } catch {} 
      clearInterval(interval);
    };
  }, []);
  const { unreadCount, refreshNotifications } = useNotifications();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfileWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12; // Reduced for faster initial load
  const [filterLoading, setFilterLoading] = useState(false);
  const refRBSheet = useRef<any>(null);
  const imagePreloadRef = useRef(new Set<string>());
  const [showIncompleteProfileModal, setShowIncompleteProfileModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const [ageRange, setAgeRange] = useState([20, 50]); // Initial age range values
  const [selectedAgeBuckets, setSelectedAgeBuckets] = useState<number[]>([]);
  const [formState, dispatchFormState] = useReducer(reducer, initialState);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Physical filters
  const [heightRange, setHeightRange] = useState([150, 200]); // Height in cm
  const [selectedHeightBuckets, setSelectedHeightBuckets] = useState<number[]>([]);
  const [weightRange, setWeightRange] = useState([40, 120]); // Weight in kg
  const [selectedWeightBuckets, setSelectedWeightBuckets] = useState<number[]>([]);
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
  const [isGalleryView, setIsGalleryView] = useState(true);
  // Total public profiles count (respects filters)
  const [totalPublicCount, setTotalPublicCount] = useState<number | null>(null);

  const [crownColor, setCrownColor] = useState<string>('#666666');
  const [currentPackage, setCurrentPackage] = useState<string | null>(null);
  const [isMale, setIsMale] = useState<boolean | null>(null);
  const { isLoading: profileLoading } = useProfilePicture(refreshTrigger);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const refCrownSheet = useRef<any>(null);
  
  // Professional layout system with proper spacing
  const CONTAINER_PADDING = 16; // Base container padding
  const GALLERY_SIDE_GAP = 16; // Side gaps for gallery view centering
  const GALLERY_CARD_MARGIN = 12; // Vertical margin between gallery cards
  
  // Determine desktop columns
  const desktopColumns = isDesktopWeb() ? 4 : 2;
  const isDesktop = isDesktopWeb();
  
  // Grid view dimensions (matching skeleton) - adjust for desktop columns
  const gridAvailableWidth = windowWidth - (CONTAINER_PADDING * 2);
  const gridSpacing = Math.floor(gridAvailableWidth * 0.04);
  const gridCardWidth = Math.floor((gridAvailableWidth - gridSpacing * (desktopColumns - 1)) / desktopColumns);
  const gridCardHeight = 220;

  // Gallery view dimensions with proper centering
  const galleryAvailableWidth = windowWidth - (GALLERY_SIDE_GAP * 2);
  const galleryCardWidth = Math.floor(galleryAvailableWidth * 0.94); // Slightly narrower for better centering
  const galleryCardHeight = 280;

  // Dynamic dimensions based on view mode
  const cardWidth = isGalleryView ? galleryCardWidth : gridCardWidth;
  const cardHeight = isGalleryView ? galleryCardHeight : gridCardHeight;

  // Options arrays (matching database enums)
  const eyeColorOptions = ['Brown', 'Black', 'Hazel', 'Green', 'Blue', 'Gray', 'Amber'];
  const hairColorOptions = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Red', 'Gray', 'White'];
  const skinToneOptions = ['Very Fair', 'Fair', 'Medium', 'Olive', 'Brown', 'Dark Brown', 'Very Dark'];
  const bodyTypeOptions = ['Slim', 'Average', 'Athletic', 'Curvy', 'Heavy Set', 'Plus Size'];
  const educationOptions = ['High School', 'Some College', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD/Doctorate', 'Islamic Studies', 'Professional Certification', 'Other'];
  
  // Helper function to get education translation key
  const getEducationTranslationKey = (option: string) => {
    const keyMap: { [key: string]: string } = {
      'High School': 'high_school',
      'Some College': 'some_college',
      'Bachelor\'s Degree': 'bachelors_degree',
      'Master\'s Degree': 'masters_degree',
      'PhD/Doctorate': 'phd_doctorate',
      'Islamic Studies': 'islamic_studies',
      'Professional Certification': 'professional_certification',
      'Other': 'other'
    };
    return keyMap[option] || option.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };
  
  // Helper function to get work status translation key
  const getWorkStatusTranslationKey = (option: string) => {
    return option; // 'working' and 'not_working' are already clean keys
  };

  // Helper functions for all filter options
  const getEyeColorTranslationKey = (option: string) => {
    return option.toLowerCase().replace(/\s+/g, '_');
  };

  const getHairColorTranslationKey = (option: string) => {
    return option.toLowerCase().replace(/\s+/g, '_');
  };

  const getSkinToneTranslationKey = (option: string) => {
    return option.toLowerCase().replace(/\s+/g, '_');
  };

  const getBodyTypeTranslationKey = (option: string) => {
    return option.toLowerCase().replace(/\s+/g, '_');
  };

  const getLanguageTranslationKey = (option: string) => {
    return option.toLowerCase().replace(/\s+/g, '_');
  };

  const getHousingTranslationKey = (option: string) => {
    return option.toLowerCase().replace(/\s+/g, '_');
  };

  const getLivingConditionTranslationKey = (option: string) => {
    return option; // Already in snake_case
  };

  const getSocialConditionTranslationKey = (option: string) => {
    return option; // Already in snake_case
  };

  const getReligiousLevelTranslationKey = (option: string) => {
    // Map translated values back to keys
    const reverseMap: { [key: string]: string } = {
      [t('profile_setup.options.religious_level.very_religious')]: 'very_religious',
      [t('profile_setup.options.religious_level.religious')]: 'religious',
      [t('profile_setup.options.religious_level.moderate')]: 'moderately_religious',
      [t('profile_setup.options.religious_level.somewhat')]: 'somewhat_religious',
      [t('profile_setup.options.religious_level.learning')]: 'learning',
    };
    return reverseMap[option] || option.toLowerCase().replace(/\s+/g, '_');
  };

  const getPrayerFrequencyTranslationKey = (option: string) => {
    // Map translated values back to keys
    const reverseMap: { [key: string]: string } = {
      [t('profile_setup.options.prayer_frequency.all_5')]: 'all_5_daily_prayers',
      [t('profile_setup.options.prayer_frequency.most')]: 'most_prayers',
      [t('profile_setup.options.prayer_frequency.some')]: 'some_prayers',
      [t('profile_setup.options.prayer_frequency.friday')]: 'friday_only',
      [t('profile_setup.options.prayer_frequency.occasionally')]: 'occasionally',
      [t('profile_setup.options.prayer_frequency.learning')]: 'learning_to_pray',
    };
    return reverseMap[option] || option.toLowerCase().replace(/\s+/g, '_');
  };

  const getQuranReadingTranslationKey = (option: string) => {
    // Map translated values back to keys
    const reverseMap: { [key: string]: string } = {
      [t('profile_setup.options.quran.memorized')]: 'memorized_significant_portions',
      [t('profile_setup.options.quran.fluent')]: 'read_fluently',
      [t('profile_setup.options.quran.with_help')]: 'read_with_help',
      [t('profile_setup.options.quran.learning')]: 'learning_to_read',
      [t('profile_setup.options.quran.cannot_read')]: 'cannot_read_arabic',
    };
    return reverseMap[option] || option.toLowerCase().replace(/\s+/g, '_');
  };

  // Cross-language variants for values saved in DB (profiles may be saved in different UI languages)
  const RELIGIOUS_LEVEL_VARIANTS: Record<string, string[]> = {
    very_religious: ['Very Religious','Çok Dindar','متدين جداً','Très religieux','Очень религиозный'],
    religious: ['Religious','Dindar','متدين','Religieux','Религиозный'],
    // Include Arabic UI variants from profile setup and home filters
    moderately_religious: ['Moderately Religious','Orta Derece Dindar','متدين بشكل معتدل','متوسط التدين','Modérément religieux','Умеренно религиозный'],
    somewhat_religious: ['Somewhat Religious','Biraz Dindar','متدين نوعاً ما','قليل التدين','Quelque peu religieux','Несколько религиозный'],
    learning: ['Learning','Öğreniyor','يتعلم','في طور التعلم','Apprenant','Изучает']
  };
  const PRAYER_FREQUENCY_VARIANTS: Record<string, string[]> = {
    // Add both profile_setup and home filter Turkish variants
    all_5_daily_prayers: ['All 5 Daily Prayers','Günün 5 Vakti','Günde 5 Vakit Namaz','كل الصلوات الخمس','Les 5 prières quotidiennes','Все 5 ежедневных молитв'],
    most_prayers: ['Most Prayers','Çoğu Vakit','Çoğu Namaz','أغلب الصلوات','La plupart des prières','Большинство молитв'],
    some_prayers: ['Some Prayers','Bazı Vakitler','Bazı Namazlar','بعض الصلوات','Quelques prières','Некоторые молитвы'],
    friday_only: ['Friday Only','Sadece Cuma','الجمعة فقط','Vendredi seulement','Только в пятницу'],
    occasionally: ['Occasionally','Ara sıra','Ara Sıra','أحياناً','Occasionnellement','Иногда'],
    learning_to_pray: ['Learning to Pray','Namaz Kılmayı Öğreniyor','Namaz Öğreniyor','يتعلم الصلاة','Apprend à prier','Учится молиться']
  };
  const QURAN_READING_VARIANTS: Record<string, string[]> = {
    memorized_significant_portions: ['Memorized Significant Portions','Önemli Bölümleri Ezberlemiş','حفظ أجزاء كبيرة','Mémorisé des portions importantes','Выучил значительные части'],
    read_fluently: ['Read Fluently','Akıcı Okuyor','يقرأ بطلاقة','Lit couramment','Читает свободно'],
    read_with_help: ['Read with Help','Yardımla Okuyor','يقرأ بمساعدة','Lit avec aide','Читает с помощью'],
    learning_to_read: ['Learning to Read','Okumayı Öğreniyor','يتعلم القراءة','Apprend à lire','Учится читать'],
    cannot_read_arabic: ['Cannot Read Arabic','Arapça Okuyamıyor','لا يستطيع قراءة العربية','Ne peut pas lire l\'arabe','Не может читать по-арабски']
  };
  const COVERING_LEVEL_VARIANTS: Record<string, string[]> = {
    will_cover: ['Will Cover','Örtünecek','ستتحجب','Se couvrira','Будет покрываться'],
    hijab: ['Hijab','Başörtüsü','حجاب','Hijab','Хиджаб'],
    niqab: ['Niqab','Peçe','نقاب','Niqab','Никаб']
  };
  const BEARD_PRACTICE_VARIANTS: Record<string, string[]> = {
    full_beard: ['Full Beard','Tam Sakal','لحية كاملة','Barbe complète','Полная борода'],
    trimmed_beard: ['Trimmed Beard','Kırpılmış Sakal','لحية مهذبة','Barbe taillée','Подстриженная борода'],
    mustache_only: ['Mustache Only','Sadece Bıyık','شارب فقط','Moustache seulement','Только усы'],
    clean_shaven: ['Clean Shaven','Temiz Tıraşlı','حليق','Rasé de près','Чисто выбрит']
  };

  const buildInListFromKeys = (keys: string[], variants: Record<string,string[]>) => {
    const vals = keys.flatMap(k => [k, ...(variants[k] || [])]);
    // De-duplicate and escape quotes
    const uniq = Array.from(new Set(vals)).map(v => v.replace(/"/g,'\"'));
    return `("${uniq.join('","')}")`;
  };

  const getCoveringLevelTranslationKey = (option: string) => {
    // Map translated values back to keys
    const reverseMap: { [key: string]: string } = {
      [t('profile_setup.options.covering.will_cover')]: 'will_cover',
      [t('profile_setup.options.covering.hijab')]: 'hijab',
      [t('profile_setup.options.covering.niqab')]: 'niqab',
    };
    return reverseMap[option] || option.toLowerCase().replace(/\s+/g, '_');
  };

  const getBeardPracticeTranslationKey = (option: string) => {
    // Map translated values back to keys
    const reverseMap: { [key: string]: string } = {
      [t('profile_setup.options.beard.full')]: 'full_beard',
      [t('profile_setup.options.beard.trimmed')]: 'trimmed_beard',
      [t('profile_setup.options.beard.mustache')]: 'mustache_only',
      [t('profile_setup.options.beard.clean')]: 'clean_shaven',
    };
    return reverseMap[option] || option.toLowerCase().replace(/\s+/g, '_');
  };

  const getWifeNumberTranslationKey = (option: string) => {
    return option; // Numbers are already clean
  };
  const languageOptions = ['Arabic', 'English', 'Turkish', 'Russian', 'Spanish', 'French', 'Urdu'];
  const housingOptions = ['own_house', 'rent_house', 'own_apartment', 'rent_apartment', 'family_home', 'shared_accommodation', 'other'];
  const livingConditionOptions = ['living_with_parents', 'living_alone', 'living_with_children'];
  const socialConditionOptions = ['sufficient', 'rich', 'very_rich'];
  const workStatusOptions = ['working', 'not_working'];
  // Religious options - use the same translated values that are saved in DB
  const religiousLevelOptions = [
    t('profile_setup.options.religious_level.very_religious'),
    t('profile_setup.options.religious_level.religious'),
    t('profile_setup.options.religious_level.moderate'),
    t('profile_setup.options.religious_level.somewhat'),
    t('profile_setup.options.religious_level.learning'),
  ];
  const prayerFrequencyOptions = [
    t('profile_setup.options.prayer_frequency.all_5'),
    t('profile_setup.options.prayer_frequency.most'),
    t('profile_setup.options.prayer_frequency.some'),
    t('profile_setup.options.prayer_frequency.friday'),
    t('profile_setup.options.prayer_frequency.occasionally'),
    t('profile_setup.options.prayer_frequency.learning'),
  ];
  const quranReadingOptions = [
    t('profile_setup.options.quran.memorized'),
    t('profile_setup.options.quran.fluent'),
    t('profile_setup.options.quran.with_help'),
    t('profile_setup.options.quran.learning'),
    t('profile_setup.options.quran.cannot_read'),
  ];
  // Covering level options - use the same translated values that are saved in DB
  const coveringLevelOptions = [
    t('profile_setup.options.covering.will_cover'),
    t('profile_setup.options.covering.hijab'),
    t('profile_setup.options.covering.niqab'),
  ];
  // Beard practice options - use the same translated values that are saved in DB
  const beardPracticeOptions = [
    t('profile_setup.options.beard.full'),
    t('profile_setup.options.beard.trimmed'),
    t('profile_setup.options.beard.mustache'),
    t('profile_setup.options.beard.clean'),
  ];
  const acceptedWifeOptions = ['2', '3', '4'];

  // Predefined range buckets for multi-select filters
  const ageBuckets = [
    { label: '18-22', min: 18, max: 22 },
    { label: '22-25', min: 22, max: 25 },
    { label: '25-30', min: 25, max: 30 },
    { label: '30-35', min: 30, max: 35 },
    { label: '35-42', min: 35, max: 42 },
    { label: '42-47', min: 42, max: 47 },
    { label: '47-55', min: 47, max: 55 },
  ];

  const heightBuckets = [
    { label: '145-155', min: 145, max: 155 },
    { label: '155-161', min: 155, max: 161 },
    { label: '161-165', min: 161, max: 165 },
    { label: '165-170', min: 165, max: 170 },
    { label: '170-175', min: 170, max: 175 },
    { label: '175-181', min: 175, max: 181 },
    { label: '181-185', min: 181, max: 185 },
    { label: '185-195', min: 185, max: 195 },
    { label: '195-210', min: 195, max: 210 },
  ];

  const weightBuckets = [
    { label: '40-55', min: 40, max: 55 },
    { label: '55-65', min: 55, max: 65 },
    { label: '65-75', min: 65, max: 75 },
    { label: '75-85', min: 75, max: 85 },
    { label: '85-95', min: 85, max: 95 },
    { label: '95-110', min: 95, max: 110 },
    { label: '110-130', min: 110, max: 130 },
  ];

  // Check if user profile is complete
  const checkProfileCompleteness = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If we couldn't reliably load the profile (e.g., transient network/RLS), do not force redirect
      if (profileError) {
        console.warn('Profile load error while checking completeness:', profileError.message);
        return;
      }

      if (!profile) {
        console.log('No profile found, auto-redirecting to setup');
        router.push('/profile-setup');
        return;
      }

      // Check mandatory fields
      const missingFields = [];
      
      // Basic info
      if (!profile.first_name) missingFields.push('First Name');
      if (!profile.gender) missingFields.push('Gender');
      if (!profile.date_of_birth) missingFields.push('Date of Birth');
      if (!profile.country) missingFields.push('Country');
      if (!profile.city) missingFields.push('City');
      
      // Physical details
      if (!profile.height_cm) missingFields.push('Height');
      if (!profile.weight_kg) missingFields.push('Weight');
      if (!profile.eye_color) missingFields.push('Eye Color');
      if (!profile.hair_color) missingFields.push('Hair Color');
      if (!profile.skin_tone) missingFields.push('Skin Tone');
      if (!profile.body_type) missingFields.push('Body Type');
      
      // Lifestyle details
      if (!profile.education_level) missingFields.push('Education Level');
      if (!profile.languages_spoken || profile.languages_spoken.length === 0) missingFields.push('Languages Spoken');
      if (!profile.housing_type) missingFields.push('Housing Type');
      if (!profile.living_condition) missingFields.push('Living Condition');
      // Gender-specific lifestyle
      if (profile.gender === 'male') {
        // For male, social_condition is expected; work_status is optional
        if (!profile.social_condition) missingFields.push('Social Condition');
      }
      if (profile.gender === 'female') {
        // For female, work_status is expected; social_condition is optional
        if (!profile.work_status) missingFields.push('Work Status');
      }
      
      // Religious details (check islamic_questionnaire JSON)
      const questionnaire = profile.islamic_questionnaire;
      if (!questionnaire || typeof questionnaire !== 'object') {
        missingFields.push('Religious Information');
      } else {
        if (!questionnaire.religious_level) missingFields.push('Religious Level');
        if (!questionnaire.prayer_frequency) missingFields.push('Prayer Frequency');
        if (!questionnaire.quran_reading_level) missingFields.push('Quran Reading Level');
        
        // Gender-specific religious fields
        if (profile.gender === 'female') {
          // Females: covering_level expected; beard not applicable
          if (!questionnaire.covering_level) missingFields.push('Covering Level');
        }
        if (profile.gender === 'male') {
          // Males: beard_practice expected; covering not applicable
          if (!questionnaire.beard_practice) missingFields.push('Beard Practice');
        }
        
        // Polygamy preferences
        if (profile.gender === 'male') {
          if (!questionnaire.seeking_wife_number) missingFields.push('Marriage Intentions');
        }
        if (profile.gender === 'female') {
          const positions = questionnaire.accepted_wife_positions;
          if (!Array.isArray(positions) || positions.length === 0) missingFields.push('Marriage Intentions');
        }
      }

      // Check for photos (minimum 3 required)
      const { count: photoCount, error: photoCountError } = await supabase
        .from('media_references')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('media_type', 'photo');

      // Only enforce the photo requirement if count successfully loaded
      if (!photoCountError && typeof photoCount === 'number') {
        if (photoCount < 3) {
        missingFields.push('Photos (minimum 3 required)');
        }
      }

      if (missingFields.length > 0) {
        console.log('Missing mandatory fields:', missingFields);
        setShowIncompleteProfileModal(true);
        setRedirectCountdown(5);
      }
    } catch (error) {
      console.error('Error checking profile completeness:', error);
    }
  };

  // Remove auto-navigation. If needed, show info-only modal.

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
    // Clamp values to enforced bounds in case of library edge cases
    const minAge = 16;
    const maxAge = 60;
    const clamped = [
      Math.max(minAge, Math.min(maxAge, values[0])),
      Math.max(minAge, Math.min(maxAge, values[1]))
    ];
    setAgeRange(clamped);
  };

  const toggleBucket = (index: number, setter: (fn: any) => void) => {
    setter((prev: number[]) => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  // Derive consolidated ranges from selected buckets
  const deriveRangeFromBuckets = (buckets: { min: number; max: number }[], selected: number[], fallback: [number, number]): [number, number] => {
    if (!selected || selected.length === 0) return fallback;
    let min = Infinity;
    let max = -Infinity;
    selected.forEach(i => {
      const b = buckets[i];
      if (!b) return;
      if (b.min < min) min = b.min;
      if (b.max > max) max = b.max;
    });
    if (!isFinite(min) || !isFinite(max)) return fallback;
    return [min, max];
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
    if (filters.ageRange) {
      const [a, b] = filters.ageRange;
      const minAge = 16;
      const maxAge = 60;
      setAgeRange([
        Math.max(minAge, Math.min(maxAge, a || 20)),
        Math.max(minAge, Math.min(maxAge, b || 50))
      ]);
    } else {
      setAgeRange([20, 50]);
    }
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
    
  // Age range or age buckets (default: [20, 50])
  if (selectedAgeBuckets.length > 0 || ageRange[0] !== 20 || ageRange[1] !== 50) count++;
    
  // Height range or height buckets (default: [150, 200])
  if (selectedHeightBuckets.length > 0 || heightRange[0] !== 150 || heightRange[1] !== 200) count++;
    
  // Weight range or weight buckets (default: [40, 120])
  if (selectedWeightBuckets.length > 0 || weightRange[0] !== 40 || weightRange[1] !== 120) count++;
    
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
    setSelectedAgeBuckets([]);
    setHeightRange([150, 200]);
    setSelectedHeightBuckets([]);
    setWeightRange([40, 120]);
    setSelectedWeightBuckets([]);
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

  // Cache current user data to avoid repeated queries
  const [currentUserData, setCurrentUserData] = useState<{user: any, gender: string | null} | null>(null);
  
  // Keep oppositeGender in sync with current user's gender regardless of fetch path
  useEffect(() => {
    const g = currentUserData?.gender ? String(currentUserData.gender).toLowerCase() : null;
    if (g === 'male') {
      setOppositeGender('female');
    } else if (g === 'female') {
      setOppositeGender('male');
    }
  }, [currentUserData?.gender]);
  
  // Initialize current user data once using auth cache
  const initializeCurrentUser = useCallback(async () => {
    if (currentUserData) return currentUserData;
    
    try {
      // Try to get from cache first for instant access
      const cachedData = authCache.getCachedUserData();
      if (cachedData && cachedData.user && cachedData.profile) {
        const userData = {
          user: cachedData.user,
          gender: cachedData.profile?.gender || null
        };
        setCurrentUserData(userData);
        return userData;
      }
      
      // Fallback to fresh fetch if not cached
      const freshData = await authCache.getCurrentUserData();
      if (freshData && freshData.user) {
        const userData = {
          user: freshData.user,
          gender: freshData.profile?.gender || null
        };
        setCurrentUserData(userData);
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to initialize current user:', error);
      return null;
    }
  }, [currentUserData]);

  const loadTotalCount = React.useCallback(async () => {
    try {
      // Use the same user data source as profile fetching for consistency
      const userData = await initializeCurrentUser();
      const currentUserGender = userData?.gender;
      // Ensure oppositeGender is set even when using optimized flow
      if (currentUserGender) {
        const og = String(currentUserGender).toLowerCase() === 'male' ? 'female' : 'male';
        setOppositeGender(og);
      }
      
      if (!currentUserGender) {
        setTotalPublicCount(null);
        return;
      }

      // Build minimal filters object matching current UI state
      // Use bucket-derived ranges so count matches list filtering
      const bucketAgeRange = deriveRangeFromBuckets(ageBuckets, selectedAgeBuckets, ageRange as [number, number]);
      const bucketHeightRange = deriveRangeFromBuckets(heightBuckets, selectedHeightBuckets, heightRange as [number, number]);
      const bucketWeightRange = deriveRangeFromBuckets(weightBuckets, selectedWeightBuckets, weightRange as [number, number]);

      const filters: any = {
        selectedCountry,
        selectedCity,
        ageRange: bucketAgeRange,
        heightRange: bucketHeightRange,
        weightRange: bucketWeightRange,
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

      // Use fast filtered count for exact total
      const total = await OptimizedProfilesService.getFilteredCount(filters, currentUserGender);
      setTotalPublicCount(total);
    } catch {
      setTotalPublicCount(null);
    }
  }, [
    initializeCurrentUser,
    selectedCountry,
    selectedCity,
    ageRange,
    heightRange,
    weightRange,
    selectedAgeBuckets,
    selectedHeightBuckets,
    selectedWeightBuckets,
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
  ]);

  // Load count on mount and whenever filters change
  React.useEffect(() => {
    loadTotalCount();
  }, [loadTotalCount]);

  // Optimized fetch using materialized view for maximum performance
  const fetchUserProfiles = async (ignoreFilters: boolean = false, isFilter: boolean = false, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setIsFetchingMore(true);
      } else if (isFilter) {
        setFilterLoading(true);
      } else {
      setLoading(true);
      }
      
      // Get current user data (cached)
      const userData = await initializeCurrentUser();
      const currentUserGender = userData?.gender;
      const currentUserId = userData?.user?.id;

      // Try to use optimized materialized view first for maximum performance
      try {
        const shouldApplyFilters = !ignoreFilters;
        const filters = shouldApplyFilters ? {
          selectedCountry,
          selectedCity,
          ageRange: deriveRangeFromBuckets(ageBuckets, selectedAgeBuckets, ageRange as [number, number]),
          heightRange: deriveRangeFromBuckets(heightBuckets, selectedHeightBuckets, heightRange as [number, number]),
          weightRange: deriveRangeFromBuckets(weightBuckets, selectedWeightBuckets, weightRange as [number, number]),
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
          selectedSeekingWifeNumber
        } : {};
        
        const currentPage = isLoadMore ? page + 1 : 0;
        const optimizedResult = await OptimizedProfilesService.fetchOptimizedProfiles(
          currentPage,
          filters,
          currentUserGender
        );
        
        if (optimizedResult.profiles.length > 0) {
          // Use optimized result - convert to expected format
          const optimizedProfiles = optimizedResult.profiles.map(profile => ({
            id: profile.id,
            user_id: profile.user_id,
            first_name: profile.name,
            date_of_birth: null, // Age is pre-computed
            height_cm: profile.height ? parseInt(profile.height.replace('cm', '')) : null,
            weight_kg: profile.weight ? parseInt(profile.weight.replace('kg', '')) : null,
            city: profile.city,
            country: profile.country,
            gender: currentUserGender === 'male' ? 'female' : 'male',
            profile_picture_url: profile.image?.uri || null,
            islamic_questionnaire: null,
            age: profile.age // Pre-computed age
          }));
          
          // Process and update state with optimized data
          const processedUsers = await Promise.all(
            optimizedProfiles.map(async (profile: any) => {
              const age = profile.age || (profile.date_of_birth ? calculateAge(profile.date_of_birth) : null);
              return {
                ...profile,
                name: profile.first_name || 'Member', // Ensure name field is available for mappedData
                age,
                image: profile.profile_picture_url ? 
                  { uri: imageCache.getCachedImage(profile.profile_picture_url) } : 
                  (profile.gender === 'female' ? images.femaleSilhouette : images.maleSilhouette)
              };
            })
          );
          
          if (isLoadMore) {
            setUsers(prev => [...prev, ...processedUsers]);
            setPage(prev => prev + 1);
            setHasMore(optimizedResult.hasMore);
          } else {
            setUsers(processedUsers);
            setPage(0);
            setHasMore(optimizedResult.hasMore);
            cachedUsers = processedUsers;
            cachedAt = Date.now();
            
            // Update count to match actual results when using optimized service
            if (optimizedResult.total !== undefined) {
              setTotalPublicCount(optimizedResult.total);
            } else if (processedUsers.length < PAGE_SIZE) {
              // If no total provided and we got less than a full page, update count
              setTotalPublicCount(processedUsers.length);
            }
          }
          
          // Preload next batch of images in background
          const nextImageUrls = processedUsers
            .slice(0, 8)
            .map(user => user.profile_picture_url)
            .filter(Boolean);
          if (nextImageUrls.length > 0) {
            imageCache.preloadBatch(nextImageUrls).catch(() => {});
          }
          
          return; // Successfully used optimized service
        }
      } catch (optimizedError) {
        console.log('Optimized service failed, falling back to regular query:', optimizedError);
      }
      
      // Fallback to original query if optimized service fails
      const start = isLoadMore ? (page + 1) * PAGE_SIZE : 0;
      const end = start + PAGE_SIZE - 1;

      // Optimized query with minimal field selection for speed
      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          first_name,
          date_of_birth,
          height_cm,
          weight_kg,
          city,
          country,
          gender,
          profile_picture_url,
          islamic_questionnaire
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(start, end);

      // Exclude current user if exists
      if (currentUserId) {
        query = query.neq('user_id', currentUserId);
      }

      // Apply gender filter based on current user's gender to show opposite gender
      if (currentUserGender) {
        const og = String(currentUserGender).toLowerCase() === 'male' ? 'female' : 'male';
        setOppositeGender(og);
        query = query.eq('gender', og);
        // Additional rule: male users should not see unapproved female profiles
        if (currentUserGender?.toLowerCase() === 'male' && og === 'female') {
          query = query.eq('admin_approved', true);
        }
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

      // Apply physical filters (only when user deviates from defaults)
      const bucketAgeRange = deriveRangeFromBuckets(ageBuckets, selectedAgeBuckets, ageRange as [number, number]);
      const bucketHeightRange = deriveRangeFromBuckets(heightBuckets, selectedHeightBuckets, heightRange as [number, number]);
      const bucketWeightRange = deriveRangeFromBuckets(weightBuckets, selectedWeightBuckets, weightRange as [number, number]);

      const isDefaultHeight = Array.isArray(bucketHeightRange) && bucketHeightRange[0] === 150 && bucketHeightRange[1] === 200;
      const isDefaultWeight = Array.isArray(bucketWeightRange) && bucketWeightRange[0] === 40 && bucketWeightRange[1] === 120;
      const isDefaultAge = Array.isArray(bucketAgeRange) && bucketAgeRange[0] === 20 && bucketAgeRange[1] === 50;

      if (shouldApplyFilters && bucketHeightRange && bucketHeightRange[0] && bucketHeightRange[1] && !isDefaultHeight) {
        query = query.gte('height_cm', bucketHeightRange[0]).lte('height_cm', bucketHeightRange[1]);
      }
      // Weight filter will be enforced on the mapped result set to avoid overconstraining server query
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
      if (shouldApplyFilters && selectedSocialCondition.length && oppositeGender === 'male') {
        query = query.in('social_condition', selectedSocialCondition);
      }
      if (shouldApplyFilters && selectedWorkStatus.length) {
        query = query.in('work_status', selectedWorkStatus);
      }

      // Apply religious filters (from islamic_questionnaire JSON)
      if (shouldApplyFilters && selectedReligiousLevel.length) {
        console.log('🔍 Filtering by religious_level:', selectedReligiousLevel);
        const keys = selectedReligiousLevel.map(getReligiousLevelTranslationKey);
        const list = buildInListFromKeys(keys, RELIGIOUS_LEVEL_VARIANTS);
        query = query.filter('islamic_questionnaire->>religious_level', 'in', list);
      }
      if (shouldApplyFilters && selectedPrayerFrequency.length) {
        console.log('🔍 Filtering by prayer_frequency:', selectedPrayerFrequency);
        const keys = selectedPrayerFrequency.map(getPrayerFrequencyTranslationKey);
        const list = buildInListFromKeys(keys, PRAYER_FREQUENCY_VARIANTS);
        query = query.filter('islamic_questionnaire->>prayer_frequency', 'in', list);
      }
      if (shouldApplyFilters && selectedQuranReading.length) {
        console.log('🔍 Filtering by quran_reading_level:', selectedQuranReading);
        const keys = selectedQuranReading.map(getQuranReadingTranslationKey);
        const list = buildInListFromKeys(keys, QURAN_READING_VARIANTS);
        query = query.filter('islamic_questionnaire->>quran_reading_level', 'in', list);
      }
      // Apply gender-specific filters
      if (oppositeGender === 'female') {
        if (shouldApplyFilters && selectedCoveringLevel.length) {
          console.log('🔍 Filtering by covering_level:', selectedCoveringLevel);
          const keys = selectedCoveringLevel.map(getCoveringLevelTranslationKey);
          const list = buildInListFromKeys(keys, COVERING_LEVEL_VARIANTS);
          if (selectedCoveringLevel.length === 3) {
            query = query.or(`islamic_questionnaire->>covering_level.in.${list},islamic_questionnaire->>covering_level.is.null,islamic_questionnaire.is.null`);
          } else {
            query = query.filter('islamic_questionnaire->>covering_level', 'in', list);
          }
        }
        if (shouldApplyFilters && selectedAcceptedWifePositions.length) {
          console.log('🔍 Filtering by accepted_wife_positions:', selectedAcceptedWifePositions);
          // Match ANY of the selected positions using OR of individual contains checks
          const orExpr = selectedAcceptedWifePositions
            .map(p => `islamic_questionnaire->accepted_wife_positions.cs.[\"${p}\"]`)
            .join(',');
          // @ts-ignore supabase-js or
          query = (query as any).or(orExpr);
        }
        if (shouldApplyFilters && selectedWorkStatus.length) {
          query = query.in('work_status', selectedWorkStatus);
        }
      }
      if (oppositeGender === 'male') {
        if (shouldApplyFilters && selectedBeardPractice.length) {
          console.log('🔍 Filtering by beard_practice:', selectedBeardPractice);
          const keys = selectedBeardPractice.map(getBeardPracticeTranslationKey);
          const list = buildInListFromKeys(keys, BEARD_PRACTICE_VARIANTS);
          if (selectedBeardPractice.length === 4) {
            query = query.or(`islamic_questionnaire->>beard_practice.in.${list},islamic_questionnaire->>beard_practice.is.null,islamic_questionnaire.is.null`);
          } else {
            query = query.filter('islamic_questionnaire->>beard_practice', 'in', list);
          }
        }
        if (shouldApplyFilters && selectedSeekingWifeNumber.length) {
          console.log('🔍 Filtering by seeking_wife_number:', selectedSeekingWifeNumber);
          // If all wife number options are selected, include null/missing values too
          if (selectedSeekingWifeNumber.length === 3) {
            query = query.or(`islamic_questionnaire->>seeking_wife_number.in.("${selectedSeekingWifeNumber.join('","')}"),islamic_questionnaire->>seeking_wife_number.is.null,islamic_questionnaire.is.null`);
          } else {
            query = query.filter('islamic_questionnaire->>seeking_wife_number', 'in', `("${selectedSeekingWifeNumber.join('","')}")`);
          }
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

      // Optimized fallback for profile pictures - only query if needed
      let userIdToProfilePic: Record<string, string> = {};
      if (profilesData && profilesData.length > 0) {
        const missingUserIds = profilesData
          .filter((p: any) => !p.profile_picture_url)
          .map((p: any) => p.user_id);

        if (missingUserIds.length > 0) {
          try {
            // More efficient query with only essential fields
            const { data: mediaRows } = await supabase
              .from('media_references')
              .select('user_id, do_spaces_cdn_url, do_spaces_url, external_url')
              .in('user_id', missingUserIds)
              .eq('is_profile_picture', true)
              .eq('media_type', 'photo')
              .limit(missingUserIds.length); // Limit to exact number needed

            mediaRows?.forEach((row: any) => {
              const url = row.do_spaces_cdn_url || row.do_spaces_url || row.external_url;
              if (url) {
                userIdToProfilePic[row.user_id] = url;
              }
            });
          } catch (e) {
            // Silent error handling for media references
          }
        }
      }

      if (profilesData && profilesData.length > 0) {
        // Optimized batch loading for interests (single query instead of 3)
        let pendingIncomingFrom: Set<string> = new Set();
        let approvedWith: Set<string> = new Set();
        try {
          const interests = await InterestsService.loadAllInterestsForUser();
          pendingIncomingFrom = interests.pendingIncoming;
          approvedWith = interests.approved;
        } catch (error) {
          console.error('Failed to load interests:', error);
        }

        // Pre-calculate current date for age calculations (performance optimization)
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const currentDate = new Date().getDate();

        const usersWithMedia = profilesData.map((profile) => {
          // Optimized age calculation using pre-calculated values
          const birthDate = new Date(profile.date_of_birth);
          const birthYear = birthDate.getFullYear();
          const birthMonth = birthDate.getMonth();
          const birthDay = birthDate.getDate();
          
          const age = currentYear - birthYear - 
                     ((currentMonth < birthMonth || 
                      (currentMonth === birthMonth && currentDate < birthDay)) ? 1 : 0);

          // Apply age filter early for performance
          if (shouldApplyFilters && !isDefaultAge && (age < bucketAgeRange[0] || age > bucketAgeRange[1])) {
            return null;
          }

          // Apply weight filter client-side (exclude missing weight when filter active)
          if (shouldApplyFilters && !isDefaultWeight) {
            const w = (profile as any).weight_kg as number | null | undefined;
            if (typeof w !== 'number' || w < bucketWeightRange[0] || w > bucketWeightRange[1]) {
              return null;
            }
          }

          // Optimized image URL selection
          const imageUrl = (profile as any).profile_picture_url || userIdToProfilePic[(profile as any).user_id];

          // Simplified gender check
          const isFemale = (profile as any).gender?.toLowerCase() === 'female';

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
          
          // Update count based on actual results for better accuracy
          // This helps when the optimized count service gives different results
          if (usersWithMedia.length < PAGE_SIZE && totalPublicCount !== usersWithMedia.length) {
            setTotalPublicCount(usersWithMedia.length);
          }
          
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
        // Refresh notifications when screen becomes active
        try {
          await refreshNotifications();
        } catch (error) {
          console.log('Failed to refresh notifications on focus:', error);
        }

        // Instant loading: Render from cache immediately without await
        const loadFromCache = async () => {
        try {
          const stored = await Storage.getItem(HOME_CACHE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.users?.length) {
              setUsers(parsed.users as UserProfileWithMedia[]);
              setLoading(false);
                
                // Preload images from cached profiles
                const imageUrls = parsed.users
                  .slice(0, 8)
                  .map((user: any) => user.profile_picture_url)
                  .filter(Boolean);
                if (imageUrls.length > 0) {
                  imageCache.preloadBatch(imageUrls).catch(() => {});
                }
            }
          }
        } catch {}
        };
        
        // Start cache loading immediately (non-blocking)
        loadFromCache();

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
        // If this is a full refresh (page reload) and we haven't forced once this session, reset filters
        if (!didForceRefreshThisSession && typeof window !== 'undefined' && window.performance && performance.getEntriesByType) {
          const navs = performance.getEntriesByType('navigation') as any[];
          const isReload = Array.isArray(navs) && navs[0] && navs[0].type === 'reload';
          if (isReload) {
            await resetAllFilters();
            await fetchUserProfiles(true);
            didForceRefreshThisSession = true;
            return;
          }
        }
        
        const isFresh = cachedUsers && (Date.now() - cachedAt) < CACHE_TTL_MS;
        if (isFresh) {
          setUsers(cachedUsers as UserProfileWithMedia[]);
          setLoading(false);
          // Check profile completeness to show modal (no auto-redirect)
          await checkProfileCompleteness();
          return;
        }
        await fetchUserProfiles();
        // Check profile completeness to show modal (no auto-redirect)
        await checkProfileCompleteness();
      };
      
      initializeScreen();
  }, [refreshNotifications])
  );

  // Add a manual refresh function for testing
  const handleRefresh = () => {
    // Reset and refetch from page 0
    setPage(0);
    setHasMore(true);
    fetchUserProfiles(false, false, false);
  };

  // Load user crown color based on package (matching membership page logic)
  const loadCrownColor = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch payment records to determine current package (same logic as membership page)
      const { data: paymentRecords, error } = await supabase
        .from('payment_records')
        .select('package_type, status, payment_details, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('loadCrownColor error:', error.message);
        setCrownColor('#666666');
        return;
      }

      // Find the latest completed payment (matching membership page logic)
      let currentPackage: string | null = null;
      if (paymentRecords && paymentRecords.length > 0) {
        let latestTarget = { pkg: null as string | null, ts: 0 };
        
        for (const record of paymentRecords) {
          if (record.status === 'completed') {
            const ts = new Date(record.created_at).getTime();
            let target: string | null = null;
            
            // Check payment_details for target_package
            if (Array.isArray(record.payment_details)) {
              for (const event of record.payment_details) {
                if (event?.target_package) {
                  target = event.target_package;
                  break;
                }
              }
            }
            
            // Fallback to package_type
            if (!target) {
              target = record.package_type;
            }
            
            if (target && ts >= latestTarget.ts) {
              latestTarget = { pkg: target, ts };
            }
          }
        }
        currentPackage = latestTarget.pkg;
      }

      if (currentPackage) {
        // Map to app colors (Premium Purple, VIP Green, Golden Dark Gold)
        const colors: Record<string, string> = {
          premium: '#6A1B9A',
          vip_premium: '#34A853',
          golden_premium: '#B8860B',
        };
        setCrownColor(colors[currentPackage] || '#666666');
        setCurrentPackage(currentPackage);
      } else {
        setCrownColor('#666666');
        setCurrentPackage(null);
      }
    } catch (e) {
      console.log('Error loading crown color:', e);
      setCrownColor('#666666');
    }
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
            .select('first_name,last_name,profile_picture_url,gender')
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
        // Set gender flag for crown visibility
        if (profile?.gender) {
          const g = String(profile.gender).toLowerCase();
          setIsMale(g === 'male');
        }
        } catch (profileError) {
          console.log('Error in profile data fetch:', profileError);
          // Fallback to email username if profile fetch fails
          if (user.email) {
            setDisplayName(user.email.split('@')[0]);
          }
        }
        
        // Load crown color
        loadCrownColor();
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
          <View style={styles.viewNameContainer}>
            <Text style={styles.greeeting}>Salam Aleykoum 👋</Text>
            <Text style={[styles.title, {
              color: COLORS.greyscale900
            }]}>{(displayName || 'Welcome').slice(0, 15)}{(displayName && displayName.length > 15) ? '…' : ''}</Text>
          </View>
        </View>
        <View style={styles.viewRight}>
          {/* Premium Crown Icon - links to membership packages (male only) */}
          {isMale && (
            <TouchableOpacity
              onPress={() => refCrownSheet.current?.open()}
              style={styles.notifButton}
            >
              <Image
                source={icons.crown2}
                resizeMode='contain'
                style={[styles.bellIcon, { tintColor: crownColor || '#666666' }]}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('notifications')}
            style={styles.notifButton}
          >
            <Image
              source={icons.notificationBell}
              resizeMode='contain'
              style={[styles.bellIcon, { tintColor: COLORS.greyscale900 }]}
            />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Messenger icon between notifications and upgrade */}
          <TouchableOpacity
            onPress={() => navigation.navigate('messenger')}
            style={styles.notifButton}
          >
            <View style={{ position: 'relative' }}>
              <Image
                source={icons.chatBubble2Outline}
                resizeMode='contain'
                style={styles.bellIcon}
              />
              {/* Unread badge overlay */}
              {totalUnreadCount > 0 && (
                <View style={styles.headerUnreadBadge}>
                  <Text style={styles.headerUnreadBadgeText}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsGalleryView(!isGalleryView)}
            style={[styles.galleryButton, isDesktopWeb() && { display: 'none' }]}>
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
            <View style={{ position: 'relative' }}>
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
                <Text style={styles.filterBadgeText}>{t('home.filters.filters_active_count', { count: getActiveFiltersCount() })}</Text>
              </View>
            )}
            </View>
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

  // Memoized navigation handler to prevent recreating functions
  const handleCardPress = React.useCallback((userId: string) => {
    navigation.navigate('matchdetails', { userId });
  }, [navigation]);

  const mappedData = React.useMemo(() => {
    return users.map((u, index) => {
      const isSilhouette = !u.image?.uri || u.image === images.femaleSilhouette || u.image === images.maleSilhouette;
      return {
        id: u.id,
        user_id: u.user_id, // Keep user_id for navigation
        name: u.name,
        age: u.age,
        image: u.image,
        height: u.height,
        weight: u.weight,
        country: u.country,
        city: u.city,
        locked: !u.unlocked && !isSilhouette,
        index
      };
    });
  }, [users]);

  // Optimized getItemLayout for gallery view (single column)
  const getGalleryItemLayout = React.useCallback((_: any, index: number) => {
    const itemHeight = galleryCardHeight + GALLERY_CARD_MARGIN;
    const offset = 16 + index * itemHeight; // paddingTop = 16
    return { length: itemHeight, offset, index };
  }, [galleryCardHeight, GALLERY_CARD_MARGIN]);

  // Optimized getItemLayout for grid view (multi-column)
  const getGridItemLayout = React.useCallback((_: any, index: number) => {
    const rowIndex = Math.floor(index / desktopColumns);
    const itemHeight = gridCardHeight + gridSpacing;
    const offset = rowIndex * itemHeight;
    return { length: itemHeight, offset, index };
  }, [gridCardHeight, gridSpacing, desktopColumns]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}> 
        <View style={[styles.container, { backgroundColor: COLORS.white }]}> 
          {renderHeader()} 
          <HomeListSkeleton isGalleryView={isGalleryView} numItems={8} />
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
            <Text style={styles.loadingText}>{t('home.empty.no_matches')}</Text>
            <Text style={[styles.loadingText, { fontSize: 14, marginTop: 8, opacity: 0.7 }]}>
              {t('home.empty.adjust_filters')}
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
            <View style={styles.filterHeaderRow}>
              <Text style={[styles.bottomTitle, {
                color: COLORS.greyscale900
              }]}>Filter</Text>
              {typeof totalPublicCount === 'number' && (
                <View style={[styles.totalBadge, { marginLeft: 8 }]}>
                  <Text style={styles.totalBadgeText}>{t('home.badges.total_profiles', { count: totalPublicCount })}</Text>
                </View>
              )}
            </View>
            <View style={styles.separateLine} />
            <ScrollView style={{ flex: 1, maxHeight: windowHeight * 0.9 - 150 }} showsVerticalScrollIndicator={false}>
            <View style={{ marginHorizontal: 16 }}>
              {/* Country first */}
              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
              }]}>{t('home.filters.title_country')}</Text>
              <SearchableDropdown
                data={countriesData.map(country => ({ label: country.name, value: country.name }))}
                onSelect={(item: any) => handleCountrySelect(item.value)}
                placeholder={t('home.filters.select_country')}
                selectedValue={selectedCountry}
              />
              
              {selectedCountry && (
                <>
                  <Text style={[styles.subtitle, {
                    color: COLORS.greyscale900,
                    marginTop: 16,
                  }]}>{t('home.filters.title_city')}</Text>
                  <SearchableDropdown
                    data={availableCities.map(city => ({ label: city, value: city }))}
                    onSelect={(item: any) => handleCitySelect(item.value)}
                    placeholder={t('home.filters.select_city')}
                    selectedValue={selectedCity}
                  />
                </>
              )}

              {/* Age after location */}
              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
              }]}>{t('home.filters.title_age')}</Text>
              <View style={styles.pillContainer}>
                {ageBuckets.map((b, i) => {
                  const active = selectedAgeBuckets.includes(i);
                  return (
                    <TouchableOpacity
                      key={`age-bucket-${i}`}
                      onPress={() => toggleBucket(i, setSelectedAgeBuckets)}
                      style={[styles.multiSelectPill, active ? styles.multiSelectPillActive : styles.multiSelectPillInactive]}
                    >
                      <Text style={[styles.multiSelectPillText, active ? styles.multiSelectPillTextActive : null]}>{b.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Physical Characteristics */}
              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
                marginTop: 16,
              }]}>{t('home.filters.title_height')}</Text>
              <View style={styles.pillContainer}>
                {heightBuckets.map((b, i) => {
                  const active = selectedHeightBuckets.includes(i);
                  return (
                    <TouchableOpacity
                      key={`height-bucket-${i}`}
                      onPress={() => toggleBucket(i, setSelectedHeightBuckets)}
                      style={[styles.multiSelectPill, active ? styles.multiSelectPillActive : styles.multiSelectPillInactive]}
                    >
                      <Text style={[styles.multiSelectPillText, active ? styles.multiSelectPillTextActive : null]}>{b.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
                marginTop: 16,
              }]}>{t('home.filters.title_weight_range')}</Text>
              <View style={styles.pillContainer}>
                {weightBuckets.map((b, i) => {
                  const active = selectedWeightBuckets.includes(i);
                  return (
                    <TouchableOpacity
                      key={`weight-bucket-${i}`}
                      onPress={() => toggleBucket(i, setSelectedWeightBuckets)}
                      style={[styles.multiSelectPill, active ? styles.multiSelectPillActive : styles.multiSelectPillInactive]}
                    >
                      <Text style={[styles.multiSelectPillText, active ? styles.multiSelectPillTextActive : null]}>{b.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_eye_color')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {eyeColorOptions.map((option: string) => {
                  const selected = selectedEyeColor.includes(option);
                  const translationKey = getEyeColorTranslationKey(option);
                  const translatedLabel = t(`home.filters.eye_color_options.${translationKey}`) || option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.optionChip, selected && styles.optionChipSelected]}
                      onPress={() => toggleSelection(option, selectedEyeColor, setSelectedEyeColor)}
                    >
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
                marginTop: 16,
              }]}>{t('home.filters.title_hair_color')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {hairColorOptions.map((option: string) => {
                  const selected = selectedHairColor.includes(option);
                  const translationKey = getHairColorTranslationKey(option);
                  const translatedLabel = t(`home.filters.hair_color_options.${translationKey}`) || option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.optionChip, selected && styles.optionChipSelected]}
                      onPress={() => toggleSelection(option, selectedHairColor, setSelectedHairColor)}
                    >
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
                marginTop: 16,
              }]}>{t('home.filters.title_skin_tone')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {skinToneOptions.map((option: string) => {
                  const selected = selectedSkinTone.includes(option);
                  const translationKey = getSkinToneTranslationKey(option);
                  const translatedLabel = t(`home.filters.skin_tone_options.${translationKey}`) || option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.optionChip, selected && styles.optionChipSelected]}
                      onPress={() => toggleSelection(option, selectedSkinTone, setSelectedSkinTone)}
                    >
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
                marginTop: 16,
              }]}>{t('home.filters.title_body_type')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {bodyTypeOptions.map((option: string) => {
                  const selected = selectedBodyType.includes(option);
                  const translationKey = getBodyTypeTranslationKey(option);
                  const translatedLabel = t(`home.filters.body_type_options.${translationKey}`) || option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.optionChip, selected && styles.optionChipSelected]}
                      onPress={() => toggleSelection(option, selectedBodyType, setSelectedBodyType)}
                    >
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
                marginTop: 16,
              }]}>{t('home.filters.title_education')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {educationOptions.map((option: string) => {
                  const selected = selectedEducation.includes(option);
                  const translationKey = getEducationTranslationKey(option);
                  const translatedLabel = t(`home.filters.education_options.${translationKey}`) || option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.optionChip, selected && styles.optionChipSelected]}
                      onPress={() => toggleSelection(option, selectedEducation, setSelectedEducation)}
                    >
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Languages */}
              <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_languages')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {languageOptions.map((option: string) => {
                  const selected = selectedLanguages.includes(option);
                  const translationKey = getLanguageTranslationKey(option);
                  const translatedLabel = t(`home.filters.language_options.${translationKey}`) || option;
                  return (
                    <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedLanguages, setSelectedLanguages)}>
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Housing Type */}
              <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_housing_type')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {housingOptions.map((option: string) => {
                  const selected = selectedHousingType.includes(option);
                  const translationKey = getHousingTranslationKey(option);
                  const translatedLabel = t(`home.filters.housing_options.${translationKey}`) || option;
                  return (
                    <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedHousingType, setSelectedHousingType)}>
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Living Condition / Social / Work are gender-specific – still selectable here, but applied conditionally in query */}
              <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_living_condition')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {livingConditionOptions.map((option: string) => {
                  const translationKey = getLivingConditionTranslationKey(option);
                  const translatedLabel = t(`home.filters.living_condition_options.${translationKey}`) || formatLabel(option);
                  const selected = selectedLivingCondition.includes(option);
                  return (
                    <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedLivingCondition, setSelectedLivingCondition)}>
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {oppositeGender === 'male' && (
                <>
                  <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_social_condition')}</Text>
                  <View style={styles.horizontalMultiSelect}>
                    {socialConditionOptions.map((option: string) => {
                      const translationKey = getSocialConditionTranslationKey(option);
                      const translatedLabel = t(`home.filters.social_condition_options.${translationKey}`) || formatLabel(option);
                      const selected = selectedSocialCondition.includes(option);
                      return (
                        <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedSocialCondition, setSelectedSocialCondition)}>
                          <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_work')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {workStatusOptions.map((option: string) => {
                  const translationKey = getWorkStatusTranslationKey(option);
                  const translatedLabel = t(`home.filters.work_options.${translationKey}`) || formatLabel(option);
                  const selected = selectedWorkStatus.includes(option);
                  return (
                    <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedWorkStatus, setSelectedWorkStatus)}>
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
                marginTop: 16,
              }]}>{t('home.filters.title_religious_level')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {religiousLevelOptions.map((option: string) => {
                  const selected = selectedReligiousLevel.includes(option);
                  const translationKey = getReligiousLevelTranslationKey(option);
                  const translatedLabel = t(`home.filters.religious_level_options.${translationKey}`) || option;
                  return (
                    <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedReligiousLevel, setSelectedReligiousLevel)}>
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
                marginTop: 16,
              }]}>{t('home.filters.title_prayer_frequency')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {prayerFrequencyOptions.map((option: string) => {
                  const selected = selectedPrayerFrequency.includes(option);
                  const translationKey = getPrayerFrequencyTranslationKey(option);
                  const translatedLabel = t(`home.filters.prayer_frequency_options.${translationKey}`) || option;
                  return (
                    <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedPrayerFrequency, setSelectedPrayerFrequency)}>
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quran Reading Level */}
              <Text style={[styles.subtitle, {
                color: COLORS.greyscale900,
                marginTop: 16,
              }]}>{t('home.filters.title_quran_reading')}</Text>
              <View style={styles.horizontalMultiSelect}>
                {quranReadingOptions.map((option: string) => {
                  const selected = selectedQuranReading.includes(option);
                  const translationKey = getQuranReadingTranslationKey(option);
                  const translatedLabel = t(`home.filters.quran_reading_options.${translationKey}`) || option;
                  return (
                    <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedQuranReading, setSelectedQuranReading)}>
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Gender-specific: Covering Level or Beard Practice */}
              {oppositeGender === 'female' && (
                <>
                  <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_covering_level')}</Text>
                  <View style={styles.horizontalMultiSelect}>
                    {coveringLevelOptions.map((option: string) => {
                      const selected = selectedCoveringLevel.includes(option);
                      const translationKey = getCoveringLevelTranslationKey(option);
                      const translatedLabel = t(`home.filters.covering_level_options.${translationKey}`) || formatLabel(option);
                      return (
                        <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedCoveringLevel, setSelectedCoveringLevel)}>
                          <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
              {oppositeGender === 'male' && (
                <>
                  <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_beard_practice')}</Text>
                  <View style={styles.horizontalMultiSelect}>
                    {beardPracticeOptions.map((option: string) => {
                      const selected = selectedBeardPractice.includes(option);
                      const translationKey = getBeardPracticeTranslationKey(option);
                      const translatedLabel = t(`home.filters.beard_practice_options.${translationKey}`) || option;
                      return (
                        <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedBeardPractice, setSelectedBeardPractice)}>
                          <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Male Seeking Wife Preferences (show when filtering male profiles) */}
              {oppositeGender === 'male' && (
                <>
                  <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_looking_for_wife')}</Text>
                  <View style={styles.horizontalMultiSelect}>
                    {acceptedWifeOptions.map((option: string) => {
                      const selected = selectedSeekingWifeNumber.includes(option);
                      const translationKey = getWifeNumberTranslationKey(option);
                      const translatedLabel = t(`home.filters.wife_number_options.${translationKey}`) || option;
                      return (
                        <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedSeekingWifeNumber, setSelectedSeekingWifeNumber)}>
                          <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Female Accepted Wife Positions (show when filtering female profiles) */}
              {oppositeGender === 'female' && (
                <>
                  <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_accepted_positions')}</Text>
                  <View style={styles.horizontalMultiSelect}>
                    {acceptedWifeOptions.map((option: string) => {
                      const selected = selectedAcceptedWifePositions.includes(option);
                      const translationKey = getWifeNumberTranslationKey(option);
                      const translatedLabel = t(`home.filters.wife_number_options.${translationKey}`) || option;
                      return (
                        <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedAcceptedWifePositions, setSelectedAcceptedWifePositions)}>
                          <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
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
                title={t('home.filters.reset')}
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
                title={t('home.filters.apply')}
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

          {/* Crown Menu Bottom Sheet (also available in empty state) */}
          <RBSheet
            ref={refCrownSheet}
            closeOnPressMask={true}
            height={120}
            customStyles={{
              wrapper: {
                backgroundColor: "rgba(0,0,0,0.5)",
              },
              draggableIcon: {
                backgroundColor: COLORS.grayscale200,
                height: 4
              },
              container: {
                borderTopRightRadius: 32,
                borderTopLeftRadius: 32,
                height: 120,
                backgroundColor: COLORS.white
              }
            }}
          >
            <View style={styles.crownMenuContainer}>
              <View style={styles.crownMenuContent}>
                <Image
                  source={icons.crown2}
                  resizeMode='contain'
                  style={[styles.crownMenuIcon, { tintColor: crownColor }]}
                />
                <Text style={styles.crownMenuPackage}>
                  {currentPackage 
                    ? t(`home.crown_menu.package_names.${currentPackage}`)
                    : t('home.crown_menu.no_package')}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => {
                  if (currentPackage !== 'golden_premium') {
                    refCrownSheet.current?.close();
                    navigation.navigate('membership' as never);
                  }
                }}
                disabled={currentPackage === 'golden_premium'}
                style={[
                  styles.upgradeButton,
                  currentPackage === 'golden_premium' && styles.upgradeButtonDisabled
                ]}
              >
                <Text style={[
                  styles.upgradeButtonText,
                  currentPackage === 'golden_premium' && styles.upgradeButtonTextDisabled
                ]}>
                  {currentPackage === 'golden_premium' 
                    ? t('home.crown_menu.max_level') 
                    : t('home.crown_menu.upgrade')}
                </Text>
              </TouchableOpacity>
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
        <DesktopMobileNotice />
        <View style={{ flex: 1 }}>
        {isGalleryView && !isDesktop ? (
          <GalleryView
            data={mappedData.map(item => ({
              ...item,
              onPress: () => handleCardPress(item.user_id)
            }))}
            cardWidth={galleryCardWidth}
            cardHeight={galleryCardHeight}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={10}
            removeClippedSubviews={false}
            onEndReachedThreshold={0.2}
            onEndReached={() => {
              if (!isFetchingMore && hasMore && users.length >= PAGE_SIZE) {
                fetchUserProfiles(false, false, true);
              }
            }}
            // getItemLayout disabled to avoid edge-case virtualization glitches when returning from details
            footer={isFetchingMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null}
          />
        ) : (
          <GridView
            data={mappedData.map(item => ({
              ...item,
              onPress: () => handleCardPress(item.user_id)
            }))}
            cardWidth={gridCardWidth}
            cardHeight={gridCardHeight}
            spacing={gridSpacing}
            numColumns={desktopColumns}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={10}
            removeClippedSubviews={false}
            onEndReachedThreshold={0.2}
            onEndReached={() => {
              if (!isFetchingMore && hasMore && users.length >= PAGE_SIZE) {
                fetchUserProfiles(false, false, true);
              }
            }}
            // getItemLayout disabled to avoid edge-case virtualization glitches when returning from details
            footer={isFetchingMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null}
          />
        )}
          {typeof totalPublicCount === 'number' && (
            <View style={styles.totalBadgeContainer} pointerEvents="none">
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>{t('home.badges.total_profiles', { count: totalPublicCount })}</Text>
              </View>
            </View>
          )}
          {filterLoading && (
            <View style={styles.filterLoadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.filterLoadingText}>Applying filters...</Text>
            </View>
          )}
        </View>

        {/* Incomplete Profile Modal */}
        <Modal
          visible={showIncompleteProfileModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.fullscreenContainer}>
            <View style={[styles.modalCard, { maxWidth: 380 }]}>
              <Text style={[styles.subtitle, { marginTop: 0, marginBottom: 16, textAlign: 'center', color: COLORS.primary }]}>
                {t('home.incomplete_profile.title')}
              </Text>
              <Text style={[styles.modalText, { textAlign: 'center' }]}> 
                {t('home.incomplete_profile.line1')}
              </Text>
              <Text style={[styles.modalText, { textAlign: 'center', marginBottom: 20 }]}>
                {t('home.incomplete_profile.line2')}
              </Text>
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => { setShowIncompleteProfileModal(false); router.push('/profile-setup'); }}
                  style={[styles.modalPrimaryButton]}
                >
                  <Text style={styles.modalPrimaryButtonText}>{t('profile_setup.complete_registration')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
          <View style={styles.filterHeaderRow}>
            <Text style={[styles.bottomTitle, {
              color: COLORS.greyscale900
            }]}>Filter</Text>
            {typeof totalPublicCount === 'number' && (
              <View style={[styles.totalBadge, { marginLeft: 8, alignSelf: 'flex-end' }]}>
                <Text style={styles.totalBadgeText}>{t('home.badges.total_profiles', { count: totalPublicCount })}</Text>
              </View>
            )}
          </View>
          <View style={styles.separateLine} />
          
          
          <ScrollView style={{ flex: 1, maxHeight: windowHeight * 0.9 - 160 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginHorizontal: 16 }}>
            {/* Country first */}
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
            }]}>{t('home.filters.title_country')}</Text>
            <SearchableDropdown
              data={countriesData.map(country => ({ label: country.name, value: country.name }))}
              onSelect={(item: any) => handleCountrySelect(item.value)}
              placeholder={t('home.filters.select_country')}
              selectedValue={selectedCountry}
            />
            
            {selectedCountry && (
              <>
                <Text style={[styles.subtitle, {
                  color: COLORS.greyscale900,
                  marginTop: 16,
                }]}>{t('home.filters.title_city')}</Text>
                <SearchableDropdown
                  data={availableCities.map(city => ({ label: city, value: city }))}
                  onSelect={(item: any) => handleCitySelect(item.value)}
                  placeholder={t('home.filters.select_city')}
                  selectedValue={selectedCity}
                />
              </>
            )}

            {/* Age after location */}
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
            }]}>{t('home.filters.title_age')}</Text>
            <View style={styles.pillContainer}>
              {ageBuckets.map((b, i) => {
                const active = selectedAgeBuckets.includes(i);
                return (
                  <TouchableOpacity
                    key={`age-bucket-${i}`}
                    onPress={() => toggleBucket(i, setSelectedAgeBuckets)}
                    style={[styles.multiSelectPill, active ? styles.multiSelectPillActive : styles.multiSelectPillInactive]}
                  >
                    <Text style={[styles.multiSelectPillText, active ? styles.multiSelectPillTextActive : null]}>{b.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Physical Characteristics */}
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>{t('home.filters.title_height')}</Text>
            <View style={styles.pillContainer}>
              {heightBuckets.map((b, i) => {
                const active = selectedHeightBuckets.includes(i);
                return (
                  <TouchableOpacity
                    key={`height-bucket-${i}`}
                    onPress={() => toggleBucket(i, setSelectedHeightBuckets)}
                    style={[styles.multiSelectPill, active ? styles.multiSelectPillActive : styles.multiSelectPillInactive]}
                  >
                    <Text style={[styles.multiSelectPillText, active ? styles.multiSelectPillTextActive : null]}>{b.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>{t('home.filters.title_weight_range')}</Text>
            <View style={styles.pillContainer}>
              {weightBuckets.map((b, i) => {
                const active = selectedWeightBuckets.includes(i);
                return (
                  <TouchableOpacity
                    key={`weight-bucket-${i}`}
                    onPress={() => toggleBucket(i, setSelectedWeightBuckets)}
                    style={[styles.multiSelectPill, active ? styles.multiSelectPillActive : styles.multiSelectPillInactive]}
                  >
                    <Text style={[styles.multiSelectPillText, active ? styles.multiSelectPillTextActive : null]}>{b.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_eye_color')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {eyeColorOptions.map((option: string) => {
                const selected = selectedEyeColor.includes(option);
                const translationKey = getEyeColorTranslationKey(option);
                const translatedLabel = t(`home.filters.eye_color_options.${translationKey}`) || option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => toggleSelection(option, selectedEyeColor, setSelectedEyeColor)}
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
          </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>{t('home.filters.title_hair_color')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {hairColorOptions.map((option: string) => {
                const selected = selectedHairColor.includes(option);
                const translationKey = getHairColorTranslationKey(option);
                const translatedLabel = t(`home.filters.hair_color_options.${translationKey}`) || option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => toggleSelection(option, selectedHairColor, setSelectedHairColor)}
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>{t('home.filters.title_skin_tone')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {skinToneOptions.map((option: string) => {
                const selected = selectedSkinTone.includes(option);
                const translationKey = getSkinToneTranslationKey(option);
                const translatedLabel = t(`home.filters.skin_tone_options.${translationKey}`) || option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => toggleSelection(option, selectedSkinTone, setSelectedSkinTone)}
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>{t('home.filters.title_body_type')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {bodyTypeOptions.map((option: string) => {
                const selected = selectedBodyType.includes(option);
                const translationKey = getBodyTypeTranslationKey(option);
                const translatedLabel = t(`home.filters.body_type_options.${translationKey}`) || option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => toggleSelection(option, selectedBodyType, setSelectedBodyType)}
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>{t('home.filters.title_education')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {educationOptions.map((option: string) => {
                const selected = selectedEducation.includes(option);
                const translationKey = getEducationTranslationKey(option);
                const translatedLabel = t(`home.filters.education_options.${translationKey}`) || option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => toggleSelection(option, selectedEducation, setSelectedEducation)}
                  >
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Languages */}
            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_languages')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {languageOptions.map((option: string) => {
                const selected = selectedLanguages.includes(option);
                const translationKey = getLanguageTranslationKey(option);
                const translatedLabel = t(`home.filters.language_options.${translationKey}`) || option;
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedLanguages, setSelectedLanguages)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Housing Type */}
            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_housing_type')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {housingOptions.map((option: string) => {
                const selected = selectedHousingType.includes(option);
                const translationKey = getHousingTranslationKey(option);
                const translatedLabel = t(`home.filters.housing_options.${translationKey}`) || option;
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedHousingType, setSelectedHousingType)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Living Condition / Social / Work are gender-specific – still selectable here, but applied conditionally in query */}
            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_living_condition')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {livingConditionOptions.map((option: string) => {
                const translationKey = getLivingConditionTranslationKey(option);
                const translatedLabel = t(`home.filters.living_condition_options.${translationKey}`) || formatLabel(option);
                const selected = selectedLivingCondition.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedLivingCondition, setSelectedLivingCondition)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {oppositeGender === 'male' && (
              <>
                <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_social_condition')}</Text>
                <View style={styles.horizontalMultiSelect}>
                  {socialConditionOptions.map((option: string) => {
                    const translationKey = getSocialConditionTranslationKey(option);
                    const translatedLabel = t(`home.filters.social_condition_options.${translationKey}`) || formatLabel(option);
                    const selected = selectedSocialCondition.includes(option);
                    return (
                      <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedSocialCondition, setSelectedSocialCondition)}>
                        <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_work')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {workStatusOptions.map((option: string) => {
                const translationKey = getWorkStatusTranslationKey(option);
                const translatedLabel = t(`home.filters.work_options.${translationKey}`) || formatLabel(option);
                const selected = selectedWorkStatus.includes(option);
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedWorkStatus, setSelectedWorkStatus)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>{t('home.filters.title_religious_level')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {religiousLevelOptions.map((option: string) => {
                const selected = selectedReligiousLevel.includes(option);
                const translationKey = getReligiousLevelTranslationKey(option);
                const translatedLabel = t(`home.filters.religious_level_options.${translationKey}`) || option;
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedReligiousLevel, setSelectedReligiousLevel)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>{t('home.filters.title_prayer_frequency')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {prayerFrequencyOptions.map((option: string) => {
                const selected = selectedPrayerFrequency.includes(option);
                const translationKey = getPrayerFrequencyTranslationKey(option);
                const translatedLabel = t(`home.filters.prayer_frequency_options.${translationKey}`) || option;
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedPrayerFrequency, setSelectedPrayerFrequency)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quran Reading Level */}
            <Text style={[styles.subtitle, {
              color: COLORS.greyscale900,
              marginTop: 16,
            }]}>{t('home.filters.title_quran_reading')}</Text>
            <View style={styles.horizontalMultiSelect}>
              {quranReadingOptions.map((option: string) => {
                const selected = selectedQuranReading.includes(option);
                const translationKey = getQuranReadingTranslationKey(option);
                const translatedLabel = t(`home.filters.quran_reading_options.${translationKey}`) || option;
                return (
                  <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedQuranReading, setSelectedQuranReading)}>
                    <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Gender-specific: Covering Level or Beard Practice */}
            {oppositeGender === 'female' && (
              <>
                <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_covering_level')}</Text>
                <View style={styles.horizontalMultiSelect}>
                  {coveringLevelOptions.map((option: string) => {
                    const selected = selectedCoveringLevel.includes(option);
                    const translationKey = getCoveringLevelTranslationKey(option);
                    const translatedLabel = t(`home.filters.covering_level_options.${translationKey}`) || formatLabel(option);
                    return (
                      <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedCoveringLevel, setSelectedCoveringLevel)}>
                        <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
            {oppositeGender === 'male' && (
              <>
                <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_beard_practice')}</Text>
                <View style={styles.horizontalMultiSelect}>
                  {beardPracticeOptions.map((option: string) => {
                    const selected = selectedBeardPractice.includes(option);
                    const translationKey = getBeardPracticeTranslationKey(option);
                    const translatedLabel = t(`home.filters.beard_practice_options.${translationKey}`) || option;
                    return (
                      <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedBeardPractice, setSelectedBeardPractice)}>
                        <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Male Seeking Wife Preferences (show when filtering male profiles) */}
            {oppositeGender === 'male' && (
              <>
                <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_looking_for_wife')}</Text>
                <View style={styles.horizontalMultiSelect}>
                  {acceptedWifeOptions.map((option: string) => {
                    const selected = selectedSeekingWifeNumber.includes(option);
                    const translationKey = getWifeNumberTranslationKey(option);
                    const translatedLabel = t(`home.filters.wife_number_options.${translationKey}`) || option;
                    return (
                      <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedSeekingWifeNumber, setSelectedSeekingWifeNumber)}>
                        <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Female Accepted Wife Positions (show when filtering female profiles) */}
            {oppositeGender === 'female' && (
              <>
                <Text style={[styles.subtitle, { color: COLORS.greyscale900, marginTop: 16 }]}>{t('home.filters.title_accepted_positions')}</Text>
                <View style={styles.horizontalMultiSelect}>
                  {acceptedWifeOptions.map((option: string) => {
                    const selected = selectedAcceptedWifePositions.includes(option);
                    const translationKey = getWifeNumberTranslationKey(option);
                    const translatedLabel = t(`home.filters.wife_number_options.${translationKey}`) || option;
                    return (
                      <TouchableOpacity key={option} style={[styles.optionChip, selected && styles.optionChipSelected]} onPress={() => toggleSelection(option, selectedAcceptedWifePositions, setSelectedAcceptedWifePositions)}>
                        <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{translatedLabel}</Text>
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
              title={t('home.filters.reset')}
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
              title={t('home.filters.apply')}
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

        {/* Crown Menu Bottom Sheet */}
        <RBSheet
          ref={refCrownSheet}
          closeOnPressMask={true}
          height={120}
          customStyles={{
            wrapper: {
              backgroundColor: "rgba(0,0,0,0.5)",
            },
            draggableIcon: {
              backgroundColor: COLORS.grayscale200,
              height: 4
            },
            container: {
              borderTopRightRadius: 32,
              borderTopLeftRadius: 32,
              height: 120,
              backgroundColor: COLORS.white
            }
          }}
        >
          <View style={styles.crownMenuContainer}>
            <View style={styles.crownMenuContent}>
              <Image
                source={icons.crown2}
                resizeMode='contain'
                style={[styles.crownMenuIcon, { tintColor: crownColor }]}
              />
              <Text style={styles.crownMenuPackage}>
                {currentPackage 
                  ? t(`home.crown_menu.package_names.${currentPackage}`)
                  : t('home.crown_menu.no_package')}
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => {
                if (currentPackage !== 'golden_premium') {
                  refCrownSheet.current?.close();
                  navigation.navigate('membership' as never);
                }
              }}
              disabled={currentPackage === 'golden_premium'}
              style={[
                styles.upgradeButton,
                currentPackage === 'golden_premium' && styles.upgradeButtonDisabled
              ]}
            >
              <Text style={[
                styles.upgradeButtonText,
                currentPackage === 'golden_premium' && styles.upgradeButtonTextDisabled
              ]}>
                {currentPackage === 'golden_premium' 
                  ? t('home.crown_menu.max_level') 
                  : t('home.crown_menu.upgrade')}
              </Text>
            </TouchableOpacity>
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
  totalBadgeContainer: {
    position: 'absolute',
    bottom: 64,
    width: '100%',
    alignItems: 'center'
  },
  totalBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2
  },
  totalBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'semibold',
    fontSize: 12,
    letterSpacing: 0.2
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 60
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: "center",
    flexWrap: 'wrap',
    gap: 4
  },
  notifButton: {
    padding: 4,
    marginRight: 4,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.red,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: 'bold',
    textAlign: 'center',
  },
  bellIcon: {
    height: 20,
    width: 20,
    tintColor: COLORS.black,
    marginRight: 0
  },
  headerUnreadBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerUnreadBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: 'bold',
    textAlign: 'center',
  },
  bookmarkIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black
  },
  gridListContainer: {
    paddingBottom: isMobileWeb() ? 160 : 140,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  galleryListContainer: {
    paddingBottom: isMobileWeb() ? 160 : 140,
    paddingTop: 16,
    paddingHorizontal: 16, // Base padding for the container
  },
  galleryCardWrapper: {
    alignItems: 'center',
    marginBottom: 12, // Vertical spacing between gallery cards
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardContainer: {
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
    padding: 4,
  },
  galleryButton: {
    padding: 4,
    marginRight: 4,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: getResponsiveSpacing(10),
    minWidth: getResponsiveSpacing(18),
    height: getResponsiveSpacing(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: getResponsiveFontSize(10),
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
  // Modal styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.greyscale900,
    lineHeight: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.white,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  // Crown Menu Styles
  crownMenuContainer: {
    padding: 20,
    alignItems: 'center',
  },
  crownMenuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  crownMenuIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  crownMenuPackage: {
    fontSize: 18,
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonDisabled: {
    backgroundColor: COLORS.grayscale400,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.white,
    textAlign: 'center',
  },
  upgradeButtonTextDisabled: {
    color: COLORS.white,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  multiSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.greyscale300,
    backgroundColor: COLORS.white,
    marginRight: 8,
    marginBottom: 8,
  },
  multiSelectPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  multiSelectPillInactive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.greyscale300,
  },
  multiSelectPillText: {
    fontSize: 14,
    color: COLORS.black,
    fontFamily: 'medium',
  },
  multiSelectPillTextActive: {
    color: COLORS.white,
    fontFamily: 'semiBold',
  },
  modalPrimaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 180,
  },
  modalPrimaryButtonText: {
    color: COLORS.white,
    fontFamily: 'semiBold',
    fontSize: 16,
    textAlign: 'center',
  },
})

export default HomeScreen