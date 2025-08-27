import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Modal, Dimensions } from 'react-native';
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



  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userMedia, setUserMedia] = useState<MediaReference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Fullscreen image viewer state
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');

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

      // Check cache first
      const isCacheFresh = cachedMatchDetails[targetUserId] && 
        (Date.now() - (matchDetailsLoadTime[targetUserId] || 0)) < MATCH_DETAILS_CACHE_TTL;

      if (isCacheFresh) {
        setUserProfile(cachedMatchDetails[targetUserId]);
        setUserMedia(cachedMatchMedia[targetUserId] || []);
        setIsLoading(false);
        return;
      }

      // Fetch ALL available user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*') // Get all columns
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error(`Failed to load user profile: ${profileError.message}`);
      }

      if (!profileData) {
        throw new Error('User profile not found or access denied');
      }

      // Fetch user media (photos and videos)
      const { data: mediaData, error: mediaError } = await supabase
        .from('media_references')
        .select(`
          id,
          external_url,
          thumbnail_url,
          is_profile_picture,
          media_order,
          media_type
        `)
        .eq('user_id', targetUserId)
        .in('media_type', ['photo', 'video'])
        .in('visibility_level', ['public', 'matched_only'])
        .order('is_profile_picture', { ascending: false })
        .order('media_order', { ascending: true });

      const media = mediaData || [];

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

  const openFullscreenImage = (imageUri: string) => {
    setSelectedImageUri(imageUri);
    setShowFullscreenImage(true);
  };

  const closeFullscreenImage = () => {
    setShowFullscreenImage(false);
    setSelectedImageUri('');
  };

  const getSliderImages = () => {
    // Filter to only photos for the main slider (videos work better in the gallery)
    const userPhotos = userMedia.filter(media => media.media_type === 'photo');
    
    console.log('🖼️ Debug Match Details Images:', {
      userPhotosCount: userPhotos.length,
      hasProfilePicture: !!userProfile?.profile_picture_url,
      gender: userProfile?.gender,
      userMediaLength: userMedia.length
    });
    
    if (userPhotos.length > 0) {
      console.log('✅ Using real user photos');
      return userPhotos.map(photo => ({ uri: photo.external_url }));
    }
    
    // If no photos but user has profile picture, use that
    if (userProfile?.profile_picture_url) {
      console.log('✅ Using profile picture URL');
      return [{ uri: userProfile.profile_picture_url }];
    }
    
    // Fallback to gender-specific silhouette if no real photos exist
    const isFemale = userProfile?.gender?.toLowerCase() === 'female';
    const silhouetteImage = isFemale ? images.femaleSilhouette : images.maleSilhouette;
    console.log('✅ Using gender silhouette:', isFemale ? 'female' : 'male');
    return [silhouetteImage];
  };

  // Custom AutoSlider component with tap functionality
  const renderAutoSlider = () => {
    const sliderImages = getSliderImages();
    
    return (
      <View style={styles.autoSliderContainer}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.autoSliderScroll}
        >
          {sliderImages.map((image, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => openFullscreenImage(image.uri)}
              style={styles.autoSliderImageContainer}
            >
              <Image
                source={image}
                style={styles.autoSliderImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
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
        <TouchableOpacity style={styles.backButton} onPress={() => safeGoBack(navigation, router, '/(tabs)/match')}>
          <Text style={styles.backButtonText}>Go Back</Text>
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

                          {/* Photos Gallery Section (Photos only) */}
         {userMedia && userMedia.filter(media => media.media_type === 'photo').length > 0 && (
           <>
             <Text style={[styles.subtitle, { color: COLORS.primary }]}>Photos</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
               {userMedia.filter(media => media.media_type === 'photo').map((media, index) => (
                            <TouchableOpacity
                   key={media.id} 
                   style={styles.mediaItem}
                   onPress={() => openFullscreenImage(media.external_url)}
                 >
                   <Image
                     source={{ uri: media.thumbnail_url || media.external_url }}
                     style={styles.mediaImage}
                     contentFit="cover"
                     cachePolicy="memory-disk"
                     transition={200}
                   />
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

      {/* Fullscreen Image Modal */}
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
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.fullscreenImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
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

    // AutoSlider styles
    autoSliderContainer: {
        width: SIZES.width,
        height: SIZES.height * 0.58,
    },
    autoSliderScroll: {
        flex: 1
    },
    autoSliderImageContainer: {
        width: SIZES.width,
        height: SIZES.height * 0.58,
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
    }
})

export default MatchDetails