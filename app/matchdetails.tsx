import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Modal, Dimensions, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { COLORS, icons, images, SIZES } from '@/constants';
// import AutoSlider from '@/components/AutoSlider'; // Removed to ensure we only use custom implementation
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { supabase } from '@/src/config/supabase';
import { getResponsiveFontSize, getResponsiveSpacing, safeGoBack } from '@/utils/responsive';

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

  console.log('🆔 MatchDetails component initialized with:', {
    allParams: params,
    userId: userId,
    userIdType: typeof userId,
    userIdLength: userId?.length
  });



  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userMedia, setUserMedia] = useState<MediaReference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<{ [key: string]: boolean }>({});
  const [thumbnailLoading, setThumbnailLoading] = useState<{ [key: string]: boolean }>({});
  const [silhouetteFailedToLoad, setSilhouetteFailedToLoad] = useState<{ [key: string]: boolean }>({});
  
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

  const loadUserDetails = async (targetUserId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // console.log('🔍 DEBUG: Loading user details for userId:', targetUserId);

      // Check cache first - TEMPORARILY DISABLED FOR DEBUGGING
      const isCacheFresh = false; // cachedMatchDetails[targetUserId] && 
        // (Date.now() - (matchDetailsLoadTime[targetUserId] || 0)) < MATCH_DETAILS_CACHE_TTL;

      if (isCacheFresh) {
        console.log('📦 Using cached data for user:', targetUserId);
        setUserProfile(cachedMatchDetails[targetUserId]);
        setUserMedia(cachedMatchMedia[targetUserId] || []);
        setIsLoading(false);
        return;
      } else {
        console.log('🔄 Cache disabled/expired, fetching fresh data for user:', targetUserId);
      }

      // Load profile (non-blocking if missing)
      let profileData: UserProfile | null = null;
      const { data: profileByUserId, error: profileErrorByUserId } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();
      if (!profileErrorByUserId && profileByUserId) profileData = profileByUserId as any;

      // Fetch user media (photos and videos) directly by match id (user_id)
      let { data: mediaData, error: mediaError } = await supabase
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
        .order('media_order', { ascending: true });

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
      cachedMatchDetails[targetUserId] = profileData;
      cachedMatchMedia[targetUserId] = media;
      matchDetailsLoadTime[targetUserId] = Date.now();

      setUserProfile(profileData);
      setUserMedia(media);

    } catch (error) {
      setError('Failed to load user details');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const formatEnumValue = (value?: string) => {
    if (!value) return 'Not specified';
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const parseIslamicQuestionnaire = (data?: any) => {
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
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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

  // Smart thumbnail URL resolver with fallbacks
  const getThumbnailUrl = (media: MediaReference) => {
    // Priority 1: Use thumbnail_url if it exists and is valid
    if (media.thumbnail_url && media.thumbnail_url.trim() !== '') {
      console.log('🎯 Using thumbnail_url:', media.thumbnail_url);
      return media.thumbnail_url;
    }
    
    // Priority 2: For videos, try to generate thumbnail from external_url
    if (media.media_type === 'video' && media.external_url) {
      // Try to create a thumbnail URL by adding parameters
      const videoUrl = media.external_url;
      if (videoUrl.includes('cloudinary')) {
        // Cloudinary: add thumbnail transformation
        const thumbnailUrl = videoUrl.replace('/video/upload/', '/video/upload/so_0,w_400,h_300,c_fill,q_auto/');
        console.log('🎯 Generated Cloudinary thumbnail:', thumbnailUrl);
        return thumbnailUrl;
      } else if (videoUrl.includes('digitalocean') || videoUrl.includes('do-spaces')) {
        // DigitalOcean: try to add thumbnail parameter
        // PROPER SOLUTION: The server should generate and store thumbnails during upload
        // rather than trying to generate them on the fly
        const thumbnailUrl = `${videoUrl}?thumbnail=true&w=400&h=300`;
        console.log('🎯 Generated DigitalOcean thumbnail:', thumbnailUrl);
        return thumbnailUrl;
      }
    }
    
    // Priority 3: Fallback to external_url (original media)
    console.log('🎯 Using external_url as fallback:', media.external_url);
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

      // Sort photos by media_order asc
      const sortedPhotos = [...photos].sort((a, b) => (a.media_order || 0) - (b.media_order || 0));

      // Add profile picture from profile first if exists and not duplicated
      if (userProfile?.profile_picture_url && userProfile.profile_picture_url.trim() !== '') {
        const profilePicUrl = userProfile.profile_picture_url;
        const alreadyInPhotos = sortedPhotos.some(p => p.external_url === profilePicUrl);
        if (!alreadyInPhotos && (profilePicUrl.startsWith('http') || profilePicUrl.startsWith('data:'))) {
          sliderImages.push({ uri: profilePicUrl, type: 'photo', id: 'profile_picture' });
        }
      }

      // Add all photos
      sliderImages.push(
        ...sortedPhotos.map(photo => ({ uri: photo.external_url, type: 'photo' as const, id: photo.id }))
      );

      // Add only ONE video at the end (first by media_order) with its thumbnail
      if (videos.length > 0) {
        const sortedVideos = [...videos].sort((a, b) => (a.media_order || 0) - (b.media_order || 0));
        const video = sortedVideos[0];
        sliderImages.push({
          uri: getThumbnailUrl(video),
          type: 'video',
          id: video.id,
          videoUrl: video.external_url,
        });
      }

      console.log('🖼️ Prepared slider images (photos first, video last if any):', sliderImages.length);
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
    
    // AutoSlider debug (removed for cleaner output)
    
    return (
      <View style={styles.autoSliderContainer}>
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
                console.log('🎯 Slider item clicked:', { type: media.type, id: media.id });
                if (media.type === 'video') {
                  // Open video in fullscreen modal
                  openFullscreenImage(media.videoUrl, 'video');
                } else {
                  // Open photo in fullscreen modal
                  openFullscreenImage(media.uri);
                }
              }}
              style={styles.autoSliderImageContainer}
            >
              <Image
                source={{ 
                  uri: silhouetteFailedToLoad[media.id] && media.fallbackUri 
                    ? media.fallbackUri 
                    : media.uri 
                }}
                style={styles.autoSliderImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                onLoadStart={() => {/* Image loading started */}}
                onLoad={() => {/* Image loaded successfully */}}
                onError={(error) => {
                  console.log('❌ Image error:', error);
                  // If this is a silhouette image that failed, try fallback
                  if (media.id === 'silhouette' && media.fallbackUri && !silhouetteFailedToLoad[media.id]) {
                    console.log('🔄 Silhouette image failed to load from DigitalOcean CDN, trying fallback');
                    setSilhouetteFailedToLoad(prev => ({ ...prev, [media.id]: true }));
                  }
                }}
              />
              
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
        <TouchableOpacity onPress={() => safeGoBack(navigation, router, '/(tabs)/match')}>
                    <Image
                        source={icons.back}
            contentFit="contain"
                        style={styles.backIcon}
                    />
                </TouchableOpacity>

                <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
                        <Image
                            source={isFavorite ? icons.heart2 : icons.heart2Outline}
              contentFit="contain" 
                            style={styles.bookmarkIcon}
                        />
                    </TouchableOpacity>
                </View>
            </View>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.area, { backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !userProfile) {
    return (
      <View style={[styles.area, { backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>{error || 'User not found'}</Text>
        
        {/* Button to go back */}
        <TouchableOpacity style={styles.backButton} onPress={() => safeGoBack(navigation, router, '/(tabs)/match')}>
          <Text style={styles.backButtonText}>Go Back</Text>
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
          <Text style={styles.backButtonText}>Try Different User</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${userProfile.first_name} ${userProfile.last_name}`.trim();
  const age = userProfile.age || calculateAge(userProfile.date_of_birth);
  const location = [userProfile.city, userProfile.country].filter(Boolean).join(', ');
  const islamicData = parseIslamicQuestionnaire(userProfile.islamic_questionnaire);

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
             <Text style={[styles.subtitle, { color: COLORS.primary }]}>Photos & Videos</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
               {userMedia.map((media, index) => (
                            <TouchableOpacity
                   key={media.id} 
                   style={styles.mediaItem}
                   onPress={() => openFullscreenImage(media.external_url, media.media_type)}
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
         <Text style={[styles.subtitle, { color: COLORS.primary }]}>About Me</Text>
         <Text style={[styles.description, { color: COLORS.grayscale700 }]}>
           {userProfile.about_me || userProfile.bio || 'No information provided'}
         </Text>

        {/* Physical Details Section - Clean UI without lines */}
        <Text style={[styles.subtitle, { color: COLORS.primary }]}>Physical Details</Text>
        {userProfile.height_cm && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>Height: </Text>{userProfile.height_cm} cm
          </Text>
        )}
        {userProfile.weight_kg && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>Weight: </Text>{userProfile.weight_kg} kg
          </Text>
        )}
        {userProfile.eye_color && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>Eye Color: </Text>{userProfile.eye_color}
          </Text>
        )}
        {userProfile.hair_color && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>Hair Color: </Text>{userProfile.hair_color}
          </Text>
        )}
        {userProfile.skin_tone && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>Skin Tone: </Text>{userProfile.skin_tone}
          </Text>
        )}
        {userProfile.body_type && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>Body Type: </Text>{userProfile.body_type}
          </Text>
        )}

                                 {/* Lifestyle & Work Section - Always show and clean UI */}
         <Text style={[styles.subtitle, { color: COLORS.primary }]}>Lifestyle & Work</Text>
        
        {/* Education Level - Always show */}
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>Education Level: </Text>{userProfile.education_level || 'Not specified'}
        </Text>
        
        {/* Languages Spoken */}
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>Languages Spoken: </Text>
          {userProfile.languages_spoken && userProfile.languages_spoken.length > 0 
            ? userProfile.languages_spoken.join(', ') 
            : 'Not specified'}
        </Text>

        {/* Gender-specific work information */}
        {userProfile.gender === 'male' && (
          <>
            <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
              <Text style={styles.cleanDetailLabel}>Occupation: </Text>{userProfile.occupation || 'Not specified'}
            </Text>
            {userProfile.monthly_income && (
              <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
                <Text style={styles.cleanDetailLabel}>Monthly Income: </Text>{userProfile.monthly_income}
              </Text>
            )}
            <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
              <Text style={styles.cleanDetailLabel}>Social Condition: </Text>
              {userProfile.social_condition ? formatEnumValue(userProfile.social_condition) : 'Not specified'}
            </Text>
          </>
        )}
        
        {userProfile.gender === 'female' && (
          <>
            <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
              <Text style={styles.cleanDetailLabel}>Work Status: </Text>
              {userProfile.work_status ? formatEnumValue(userProfile.work_status) : 'Not specified'}
            </Text>
            {(userProfile.work_status === 'working' || userProfile.occupation) && (
              <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
                <Text style={styles.cleanDetailLabel}>Occupation: </Text>{userProfile.occupation || 'Not specified'}
              </Text>
            )}
          </>
        )}

        {/* Housing Type - Always show */}
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>Housing Type: </Text>{userProfile.housing_type || 'Not specified'}
        </Text>
        
        {/* Living Condition - Always show */}
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>Living Condition: </Text>
          {userProfile.living_condition ? formatEnumValue(userProfile.living_condition) : 'Not specified'}
        </Text>

                                 {/* Religious Commitment Section - Clean UI */}
         <Text style={[styles.subtitle, { color: COLORS.primary }]}>Religious Commitment</Text>
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>Religious Level: </Text>
          {islamicData?.religious_level || 'Not specified'}
        </Text>
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>Prayer Frequency: </Text>
          {islamicData?.prayer_frequency || 'Not specified'}
        </Text>
        <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
          <Text style={styles.cleanDetailLabel}>Quran Reading Level: </Text>
          {islamicData?.quran_reading_level || 'Not specified'}
        </Text>
        {userProfile.gender === 'female' && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>Covering Level: </Text>
            {islamicData?.covering_level || 'Not specified'}
          </Text>
        )}
        {userProfile.gender === 'male' && (
          <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
            <Text style={styles.cleanDetailLabel}>Beard Practice: </Text>
            {islamicData?.beard_practice || 'Not specified'}
          </Text>
        )}

                                   {/* Marriage Intentions Section - Gender-specific filtering */}
         <Text style={[styles.subtitle, { color: COLORS.primary }]}>Marriage Intentions</Text>
         
         {/* For Males ONLY: Show seeking_wife_number */}
         {userProfile.gender === 'male' && (
           <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
             <Text style={styles.cleanDetailLabel}>Looking for which wife: </Text>
             {islamicData?.seeking_wife_number ? 
               (islamicData.seeking_wife_number === '1' ? '1st Wife' :
                islamicData.seeking_wife_number === '2' ? '2nd Wife' : 
                islamicData.seeking_wife_number === '3' ? '3rd Wife' : 
                islamicData.seeking_wife_number === '4' ? '4th Wife' : 
                `${islamicData.seeking_wife_number} Wife`) 
               : 'Not specified'}
           </Text>
         )}
         
         {/* For Females ONLY: Show accepted_wife_positions */}
         {userProfile.gender === 'female' && (
           <Text style={[styles.cleanDetailText, { color: COLORS.grayscale700 }]}>
             <Text style={styles.cleanDetailLabel}>Accepted wife positions: </Text>
             {islamicData?.accepted_wife_positions && Array.isArray(islamicData.accepted_wife_positions) && islamicData.accepted_wife_positions.length > 0 ?
               islamicData.accepted_wife_positions.map((position: string) => 
                 position === '1' ? '1st Wife' :
                 position === '2' ? '2nd Wife' : 
                 position === '3' ? '3rd Wife' : 
                 position === '4' ? '4th Wife' : 
                 `${position} Wife`
               ).join(', ')
               : 'Not specified'}
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
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
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
    headerContainer: {
        width: SIZES.width - 32,
        flexDirection: "row",
        justifyContent: "space-between",
        position: "absolute",
        top: 32,
        zIndex: 999,
        left: 16,
        right: 16
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.white
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
        paddingBottom: 24,
        backgroundColor: "white",
        borderTopRightRadius: 32,
        borderTopLeftRadius: 32,
        marginTop: -32,
        paddingVertical: 16
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
        fontSize: getResponsiveFontSize(16),
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
        fontSize: getResponsiveFontSize(14),
        fontFamily: "medium",
        color: COLORS.primary
    },
    positionContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: getResponsiveSpacing(16)
    },
    subtitle: {
        fontSize: getResponsiveFontSize(18),
        fontFamily: "bold",
        color: COLORS.greyscale900,
        marginTop: getResponsiveSpacing(20),
        marginBottom: getResponsiveSpacing(12)
    },
    description: {
        fontSize: getResponsiveFontSize(15),
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
        fontSize: getResponsiveFontSize(12),
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
        fontSize: getResponsiveFontSize(14),
        fontFamily: 'medium',
        color: COLORS.grayscale700,
        flex: 1
    },
    detailValue: {
        fontSize: getResponsiveFontSize(14),
        fontFamily: 'regular',
        color: COLORS.black,
        flex: 1,
        textAlign: 'right'
    },
    loadingText: {
        marginTop: 12,
        fontSize: getResponsiveFontSize(16),
        fontFamily: 'regular',
        color: COLORS.gray,
    },
    errorText: {
        fontSize: getResponsiveFontSize(16),
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
        fontSize: getResponsiveFontSize(16),
        fontFamily: 'medium',
        color: COLORS.white
    },
    bottomSpacing: {
        height: getResponsiveSpacing(50)
    },
    cleanDetailText: {
        fontSize: getResponsiveFontSize(15),
        fontFamily: "medium", // Make the entire text (including data) bold
        color: COLORS.grayscale700,
        marginBottom: getResponsiveSpacing(8),
        lineHeight: 22
    },
    cleanDetailLabel: {
        fontSize: getResponsiveFontSize(15),
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
        fontSize: getResponsiveFontSize(16),
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
        fontSize: getResponsiveFontSize(24),
        color: COLORS.grayscale700,
        fontFamily: 'bold',
    },

    // AutoSlider styles
    autoSliderContainer: {
        width: SIZES.width,
        height: SIZES.height * 0.58,
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
        height: SIZES.height * 0.58,
        justifyContent: 'center',
        alignItems: 'center',
    },
    autoSliderImage: {
        width: SIZES.width,
        height: SIZES.height * 0.58,
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
    // Fullscreen modal styles
    fullscreenContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
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
        fontSize: getResponsiveFontSize(14),
        fontFamily: 'semibold',
        textAlign: 'center',
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
        fontSize: getResponsiveFontSize(20),
        color: COLORS.primary,
        fontFamily: 'bold',
        marginLeft: 2, // Slight offset to center the triangle visually
    }
})

export default MatchDetails