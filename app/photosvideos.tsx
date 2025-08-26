import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import { DEFAULT_VIDEO_THUMBNAIL } from '../constants/defaultThumbnails';
import Header from '../components/Header';
import { router } from 'expo-router';
import Button from '../components/Button';
import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { launchMediaPicker } from '../utils/ImagePickerHelper';
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '../utils/responsive';
  import { PhotosVideosAPI } from '../src/api/photos-videos.api';
  import { PhotoVideoItem } from '../src/services/photos-videos.service';
  import { clearProfilePictureCache } from '../hooks/useProfilePicture';

// Cache for media items to prevent reloading
let cachedMediaData: { photos: PhotoVideoItem[], videos: PhotoVideoItem[] } | null = null;
let mediaLoadTime = 0;
const MEDIA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const PhotosVideos = () => {
  const [selectedTab, setSelectedTab] = useState<'photos' | 'videos'>('photos');
  const [photos, setPhotos] = useState<PhotoVideoItem[]>([]);
  const [videos, setVideos] = useState<PhotoVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});

  // Load media items on component mount
  useEffect(() => {
    loadMediaItems();
  }, []);

  const loadMediaItems = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      
      // Check cache first unless force refresh
      if (!forceRefresh && cachedMediaData && (Date.now() - mediaLoadTime) < MEDIA_CACHE_TTL) {
        setPhotos(cachedMediaData.photos);
        setVideos(cachedMediaData.videos);
        setLoading(false);
        return;
      }
      
      const result = await PhotosVideosAPI.getMyMedia();
      
      if (result.success && result.data) {
        // Cache the data
        cachedMediaData = {
          photos: result.data.photos,
          videos: result.data.videos
        };
        mediaLoadTime = Date.now();
        
        setPhotos(result.data.photos);
        setVideos(result.data.videos);
      } else {
        Alert.alert('Error', result.error || 'Failed to load media');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const pickMedia = async (type: 'photo' | 'video') => {
    try {
      setUploading(true);
      const mediaResult = await launchMediaPicker(type);
      
      if (!mediaResult) {
        setUploading(false);
        return;
      }

// Media picked for upload

      // Convert URI to File/Blob for upload
      const response = await fetch(mediaResult.uri);
      let blob = await response.blob();
      
      // Create blob with correct MIME type
      if (mediaResult.mimeType) {
        blob = new Blob([blob], { type: mediaResult.mimeType });
      }
      
      let result;
      if (type === 'photo') {
        result = await PhotosVideosAPI.uploadPhoto(blob, {
          visibility: 'private'
        });
      } else {
        result = await PhotosVideosAPI.uploadVideo(blob, {
          visibility: 'private'
        });
      }

      if (result.success && result.data) {
        // Refresh the media list with force refresh
        await loadMediaItems(true);
        Alert.alert('Success', `${type === 'photo' ? 'Photo' : 'Video'} uploaded successfully!`);
      } else {
        Alert.alert('Error', result.error || 'Upload failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  // Separate function to handle the actual deletion process
  const handleDeleteMedia = async (id: string, type: 'photo' | 'video') => {
    try {
      // Show loading indicator
      setLoading(true);
      
      // Call the API to delete the media
      const result = await PhotosVideosAPI.deleteMedia(id);
      
      if (result.success) {
        // Refresh the list to show updated data with force refresh
        await loadMediaItems(true);
        Alert.alert('Success', `${type === 'photo' ? 'Photo' : 'Video'} deleted successfully!`);
        
        // If this was a profile picture, clear the cache
        if (type === 'photo') {
          clearProfilePictureCache();
        }
      } else {
        Alert.alert('Error', result.error || 'Delete failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete media');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to show the delete confirmation dialog
  const deleteMedia = async (id: string, type: 'photo' | 'video') => {    
    // Ensure we have a valid ID
    if (!id) {
      Alert.alert('Error', 'Invalid media ID');
      return;
    }
    
    Alert.alert(
      'Delete Media',
      `Are you sure you want to delete this ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Call the actual delete handler
            handleDeleteMedia(id, type);
          }
        }
      ]
    );
  };

  const setAsAvatar = async (id: string) => {
    Alert.alert(
      'Set as Avatar',
      'Do you want to set this photo as your profile avatar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set as Avatar',
          onPress: async () => {
            try {
              // Show loading indicator
              setLoading(true);
              const result = await PhotosVideosAPI.setProfilePicture(id);
              
              if (result.success) {
                await loadMediaItems(true); // Refresh the list with force refresh
                Alert.alert('Success', 'Photo set as profile avatar! The avatar will be updated across the app.');
                
                // Clear profile picture cache to force refresh
                clearProfilePictureCache();
              } else {
                Alert.alert('Error', result.error || 'Failed to set avatar');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to set profile avatar');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderTabButton = (tab: 'photos' | 'videos', label: string, icon: any) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === tab && styles.tabButtonActive
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <Image
        source={icon}
        contentFit="contain"
        style={[
          styles.tabIcon,
          { tintColor: selectedTab === tab ? COLORS.white : COLORS.gray }
        ]}
      />
      <Text style={[
        styles.tabText,
        selectedTab === tab && styles.tabTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const showPhotoOptions = (item: PhotoVideoItem) => {
    Alert.alert(
      'Photo Options',
      'What would you like to do with this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set as Avatar',
          onPress: () => setAsAvatar(item.id)
        },
        {
          text: 'Delete Photo',
          style: 'destructive',
          onPress: () => deleteMedia(item.id, 'photo')
        }
      ]
    );
  };

  const renderPhotoItem = ({ item }: { item: PhotoVideoItem }) => {
    // Try direct Spaces URL first (more reliable than CDN)
    const getDirectUrl = (url: string) => {
      if (url && url.includes('.cdn.')) {
        return url.replace('.cdn.digitaloceanspaces.com', '.digitaloceanspaces.com');
      }
      return url;
    };

    const imageUrl = getDirectUrl(item.external_url);

    const handleImageError = (error: any) => {
      // Image load error handled
    };

    return (
      <View style={styles.mediaItem}>
        <TouchableOpacity 
          style={styles.imageContainer}
          onLongPress={() => showPhotoOptions(item)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: imageUrl }}
            contentFit="cover"
            style={styles.photoItem}
            cachePolicy="memory-disk"
            transition={200}
            onError={handleImageError}
            onLoad={() => {}}
          />
        </TouchableOpacity>
      
      {/* Set as Main Button */}
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => {
          // Set photo as avatar directly
          try {
            setLoading(true);
            
            // Removed test code to fix the error
            
            PhotosVideosAPI.setProfilePicture(item.id)
              .then(result => {
                if (result.success) {
                  // Clear cache and trigger refresh
                  clearProfilePictureCache();
                  loadMediaItems(true).then(() => {
                    Alert.alert('Success', 'Photo set as profile avatar!');
                    // Trigger profile picture refresh across the app
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('profilePictureUpdated'));
                    }
                  });
                } else {
                  Alert.alert('Error', result.error || 'Failed to set avatar');
                }
              })
              .catch(err => {
                Alert.alert('Error', 'Failed to set profile avatar');
              })
              .finally(() => {
                setLoading(false);
              });
          } catch (error) {
            setLoading(false);
          }
        }}
        activeOpacity={0.5}
      >
        <Text style={styles.buttonText}>Main</Text>
      </TouchableOpacity>
      
      {/* Delete Button */}
      <TouchableOpacity
        style={[styles.deleteButton, { zIndex: 99 }]}
        onPress={() => {
          handleDeleteMedia(item.id, 'photo');
        }}
        activeOpacity={0.5}
      >
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
      
      {/* Profile Badge */}
      {item.is_profile_picture && (
        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>Current Avatar</Text>
        </View>
      )}
    </View>
    );
  };

  const renderVideoItem = ({ item }: { item: PhotoVideoItem }) => {
    // Try direct Spaces URL first (more reliable than CDN)
    const getDirectUrl = (url: string) => {
      if (url && url.includes('.cdn.')) {
        return url.replace('.cdn.digitaloceanspaces.com', '.digitaloceanspaces.com');
      }
      return url;
    };

    const videoThumbnailUrl = getDirectUrl(item.thumbnail_url || item.external_url);

    const handleVideoImageError = (error: any) => {
      setThumbnailErrors(prev => ({ ...prev, [item.id]: true }));
    };

    return (
      <View style={styles.mediaItem}>
        <TouchableOpacity style={styles.videoContainer}>
          <Image
            source={thumbnailErrors[item.id] ? { uri: DEFAULT_VIDEO_THUMBNAIL } : { uri: videoThumbnailUrl }}
            contentFit="cover"
            style={styles.videoItem}
            cachePolicy="memory-disk"
            transition={200}
            onError={handleVideoImageError}
            onLoad={() => {}}
          />
          <View style={styles.playButton}>
            <Text style={[styles.playButtonText, { color: COLORS.white }]}>Play</Text>
          </View>
        </TouchableOpacity>
        
        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { zIndex: 99 }]} 
          onPress={() => {
            handleDeleteMedia(item.id, 'video');
          }}
          activeOpacity={0.5}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = (type: 'photo' | 'video') => (
    <View style={styles.emptyState}>
      <Image
        source={type === 'photo' ? icons.image : icons.videoCamera}
        contentFit="contain"
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No {type} yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your first {type} to get started
      </Text>
      <Button
        title={`Add ${type === 'photo' ? 'Photo' : 'Video'}`}
        onPress={() => pickMedia(type)}
        style={styles.emptyButton}
        textColor={COLORS.white}
        filled
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header 
          title="My Photos and Videos" 
          onBackPress={() => router.back()}
        />
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton('photos', 'Photos', icons.image)}
          {renderTabButton('videos', 'Videos', icons.videoCamera)}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your media...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
          {selectedTab === 'photos' ? (
            <View style={styles.contentContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Photos ({photos.length})</Text>
                <TouchableOpacity 
                  style={[styles.addButton, uploading && styles.addButtonDisabled]}
                  onPress={() => !uploading && pickMedia('photo')}
                  disabled={uploading}
                >
                  {uploading && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                  <Text style={styles.addButtonText}>
                    {uploading ? 'Uploading...' : 'Add Photo'}
                  </Text>
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
                renderEmptyState('photo')
              )}
            </View>
          ) : (
            <View style={styles.contentContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Videos ({videos.length})</Text>
                <TouchableOpacity 
                  style={[styles.addButton, uploading && styles.addButtonDisabled]}
                  onPress={() => !uploading && pickMedia('video')}
                  disabled={uploading}
                >
                  {uploading && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                  <Text style={styles.addButtonText}>
                    {uploading ? 'Uploading...' : 'Add Video'}
                  </Text>
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
              ) : (
                renderEmptyState('video')
              )}
            </View>
          )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    padding: getResponsiveSpacing(16),
    backgroundColor: COLORS.white
  },
  scrollContainer: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.grayscale200,
    borderRadius: 25,
    padding: getResponsiveSpacing(4),
    marginBottom: getResponsiveSpacing(20),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing(12),
    paddingHorizontal: getResponsiveSpacing(16),
    borderRadius: 21,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabIcon: {
    width: isMobileWeb() ? 16 : 20,
    height: isMobileWeb() ? 16 : 20,
    marginRight: getResponsiveSpacing(8),
  },
  tabText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.white,
    fontFamily: 'semibold',
  },
  contentContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(16),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'bold',
    color: COLORS.black,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'medium',
    color: COLORS.primary,
    marginLeft: getResponsiveSpacing(4),
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
    width: (SIZES.width - 56) / 2, // Adjusted for better spacing
    marginHorizontal: getResponsiveSpacing(4),
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  photoItem: {
    width: '100%',
    height: (SIZES.width - 56) / 2, // Square aspect ratio for photos
    borderRadius: 12,
    backgroundColor: COLORS.grayscale200,
  },
  videoContainer: {
    position: 'relative',
  },
  videoItem: {
    width: '100%',
    height: ((SIZES.width - 56) / 2) * 0.75, // 4:3 aspect ratio for videos
    borderRadius: 12,
    backgroundColor: COLORS.grayscale200,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: getResponsiveSpacing(4),
    right: getResponsiveSpacing(4),
    paddingHorizontal: getResponsiveSpacing(8), // Smaller horizontal padding
    height: 24, // Smaller height
    borderRadius: 12, // Matching border radius
    backgroundColor: '#ff3b30', // Bright red for better visibility
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1, // Thinner border
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 999, // Ensure button is above all other elements
    pointerEvents: 'auto', // Ensure touch events are captured
  },
  avatarButton: {
    position: 'absolute',
    top: getResponsiveSpacing(4),
    left: getResponsiveSpacing(4),
    paddingHorizontal: getResponsiveSpacing(8), // Smaller horizontal padding
    height: 24, // Smaller height
    borderRadius: 12, // Matching border radius
    backgroundColor: '#34c759', // Bright green for better visibility
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1, // Thinner border
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 999, // Ensure button is above other elements
  },
  buttonText: {
    fontSize: getResponsiveFontSize(10), // Smaller text for tiny buttons
    fontFamily: 'semiBold',
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  playButtonText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'semibold',
    color: COLORS.white,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing(60),
  },
  emptyIcon: {
    width: isMobileWeb() ? 60 : 80,
    height: isMobileWeb() ? 60 : 80,
    tintColor: COLORS.gray,
    marginBottom: getResponsiveSpacing(20),
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'bold',
    color: COLORS.black,
    marginBottom: getResponsiveSpacing(8),
  },
  emptySubtitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(24),
    lineHeight: 22,
  },
  emptyButton: {
    width: 200,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(60),
  },
  loadingText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'medium',
    color: COLORS.gray,
    marginTop: getResponsiveSpacing(16),
  },
});

export default PhotosVideos;
