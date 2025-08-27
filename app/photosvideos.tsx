import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, ActivityIndicator, Modal, Dimensions } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
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
  import { generateMultipleVideoThumbnails } from '../utils/videoThumbnailGenerator';

// Cache for media items to prevent reloading
let cachedMediaData: { photos: PhotoVideoItem[], videos: PhotoVideoItem[] } | null = null;
let mediaLoadTime = 0;
const MEDIA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PhotosVideos = () => {
  const [selectedTab, setSelectedTab] = useState<'photos' | 'videos'>('photos');
  const [photos, setPhotos] = useState<PhotoVideoItem[]>([]);
  const [videos, setVideos] = useState<PhotoVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Record<string, string>>({});
  const [thumbnailGenerationProgress, setThumbnailGenerationProgress] = useState<{completed: number, total: number}>({completed: 0, total: 0});
  
  // Full screen modal states
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenItem, setFullScreenItem] = useState<PhotoVideoItem | null>(null);
  const [fullScreenType, setFullScreenType] = useState<'photo' | 'video'>('photo');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper function to get direct URL
  const getDirectUrl = (url: string) => {
    if (url && url.includes('.cdn.')) {
      return url.replace('.cdn.digitaloceanspaces.com', '.digitaloceanspaces.com');
    }
    return url;
  };

  // Open full screen modal
  const openFullScreen = (item: PhotoVideoItem, type: 'photo' | 'video') => {
    setFullScreenItem(item);
    setFullScreenType(type);
    setFullScreenVisible(true);
    setIsVideoPlaying(false);
  };

  // Close full screen modal
  const closeFullScreen = () => {
    setFullScreenVisible(false);
    setFullScreenItem(null);
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Play video
  const playVideo = () => {
    setIsVideoPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Pause video
  const pauseVideo = () => {
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Debug media data to identify thumbnail issues
  useEffect(() => {
    if (videos.length > 0) {
      console.log('🔍 Debug Videos Data:', {
        videoCount: videos.length,
        videoDetails: videos.map(v => ({
          id: v.id,
          external_url: v.external_url,
          thumbnail_url: v.thumbnail_url,
          hasThumbnail: !!v.thumbnail_url,
          thumbnailLength: v.thumbnail_url?.length || 0
        }))
      });
    }
  }, [videos]);

  // Generate thumbnails for videos when videos change - improved batch processing
  useEffect(() => {
    if (videos.length > 0) {
      // Filter videos that need thumbnail generation (always generate for videos since DB thumbnails are not images)
      const videosNeedingThumbnails = videos.filter(video => 
        video.external_url && 
        !generatedThumbnails[video.id] && 
        !thumbnailErrors[video.id]
      );

      if (videosNeedingThumbnails.length > 0) {
        console.log(`🔄 Generating thumbnails for ${videosNeedingThumbnails.length} videos (no database thumbnails)...`);
        
        // Set initial progress
        setThumbnailGenerationProgress({completed: 0, total: videosNeedingThumbnails.length});

        // Prepare video data for batch processing
        const videoData = videosNeedingThumbnails.map(video => ({
          id: video.id,
          url: getDirectUrl(video.external_url)
        }));

        // Use batch thumbnail generation with progress callback
        generateMultipleVideoThumbnails(
          videoData,
          DEFAULT_VIDEO_THUMBNAIL,
          {
            time: 3, // Use 3 seconds as requested
            width: 400,
            height: 600, // Increased height for better vertical video display
            quality: 0.8,
            retries: 2 // Reduce retries for faster processing
          },
          (completed, total, videoId, thumbnail) => {
            // Progress callback - update state as each thumbnail is generated
            setThumbnailGenerationProgress({completed, total});
            
            if (thumbnail !== DEFAULT_VIDEO_THUMBNAIL) {
              setGeneratedThumbnails(prev => ({ ...prev, [videoId]: thumbnail }));
            } else {
              setThumbnailErrors(prev => ({ ...prev, [videoId]: true }));
            }
          }
        ).then(results => {
          console.log('✅ Batch thumbnail generation completed:', Object.keys(results).length, 'thumbnails generated');
          
          // Update all results at once for any that weren't updated via progress callback
          setGeneratedThumbnails(prev => ({ ...prev, ...results }));
          
          // Mark any failed ones as errors
          Object.entries(results).forEach(([videoId, thumbnail]) => {
            if (thumbnail === DEFAULT_VIDEO_THUMBNAIL) {
              setThumbnailErrors(prev => ({ ...prev, [videoId]: true }));
            }
          });
          
          // Reset progress
          setThumbnailGenerationProgress({completed: 0, total: 0});
        }).catch(error => {
          console.error('❌ Batch thumbnail generation failed:', error);
          // Mark all videos as errored if batch fails
          videosNeedingThumbnails.forEach(video => {
            setThumbnailErrors(prev => ({ ...prev, [video.id]: true }));
          });
          setThumbnailGenerationProgress({completed: 0, total: 0});
        });
      } else {
        console.log('✅ All videos have database thumbnails, no generation needed');
      }
    }
  }, [videos, generatedThumbnails, thumbnailErrors]); // Added dependencies to prevent unnecessary re-runs

  // Load media items on component mount
  useEffect(() => {
    console.log('🚀 PhotosVideos component mounted, loading media...');
    loadMediaItems();
  }, []);

  // Debug state changes
  useEffect(() => {
    console.log('📊 State updated:', {
      photosCount: photos.length,
      videosCount: videos.length,
      loading,
      thumbnailErrors: Object.keys(thumbnailErrors).length,
      generatedThumbnails: Object.keys(generatedThumbnails).length
    });
  }, [photos, videos, loading, thumbnailErrors, generatedThumbnails]);

  const loadMediaItems = async (forceRefresh: boolean = false) => {
    try {
      console.log('🔄 Loading media items...', { forceRefresh, hasCache: !!cachedMediaData });
      setLoading(true);
      
      // Check cache first unless force refresh
      if (!forceRefresh && cachedMediaData && (Date.now() - mediaLoadTime) < MEDIA_CACHE_TTL) {
        console.log('✅ Using cached media data');
        setPhotos(cachedMediaData.photos);
        setVideos(cachedMediaData.videos);
        setLoading(false);
        return;
      }
      
      console.log('📡 Calling PhotosVideosAPI.getMyMedia()...');
      const result = await PhotosVideosAPI.getMyMedia();
      console.log('📡 API result:', result);
      
      if (result.success && result.data) {
        // Debug the fetched data
        console.log('🔍 Loaded media from database:', {
          photosCount: result.data.photos.length,
          videosCount: result.data.videos.length,
          photos: result.data.photos.map(p => ({
            id: p.id,
            external_url: p.external_url,
            thumbnail_url: p.thumbnail_url,
            hasThumbnail: !!p.thumbnail_url
          })),
          videos: result.data.videos.map(v => ({
            id: v.id,
            external_url: v.external_url,
            thumbnail_url: v.thumbnail_url,
            hasThumbnail: !!v.thumbnail_url
          }))
        });
        
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
        
        // For video uploads, force a page refresh for better user experience
        if (type === 'video') {
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
        
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
          text: 'View Full Screen',
          onPress: () => openFullScreen(item, 'photo')
        },
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
    // For photos, use thumbnail_url if it's an actual image, otherwise use external_url
    const getPhotoUrl = () => {
      if (item.thumbnail_url && (
        item.thumbnail_url.includes('.jpg') || 
        item.thumbnail_url.includes('.jpeg') || 
        item.thumbnail_url.includes('.png') || 
        item.thumbnail_url.includes('.webp')
      )) {
        console.log('✅ Using photo thumbnail:', item.thumbnail_url);
        return getDirectUrl(item.thumbnail_url);
      } else {
        console.log('✅ Using photo external URL:', item.external_url);
        return getDirectUrl(item.external_url);
      }
    };

    const imageUrl = getPhotoUrl();

    // Debug photo data
    console.log('🖼️ Rendering photo:', {
      id: item.id,
      external_url: item.external_url,
      thumbnail_url: item.thumbnail_url,
      hasThumbnail: !!item.thumbnail_url,
      imageUrl: imageUrl,
      finalUrl: imageUrl
    });

    const handleImageError = (error: any) => {
      console.log('❌ Photo load error:', {
        id: item.id,
        url: imageUrl,
        error: error
      });
    };

    return (
      <View style={styles.mediaItem}>
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => openFullScreen(item, 'photo')} // Single tap to open full screen
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
            onLoad={() => {
              console.log('✅ Photo loaded successfully:', { id: item.id, url: imageUrl });
            }}
            onLoadStart={() => {
              console.log('🔄 Photo loading started:', { id: item.id, url: imageUrl });
            }}
          />
          
          {/* Debug overlay - show URL info */}
          <View style={styles.debugOverlay}>
            <Text style={styles.debugText}>ID: {item.id}</Text>
            <Text style={styles.debugText}>URL: {imageUrl.substring(0, 30)}...</Text>
          </View>
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
    // Get the thumbnail URL with proper handling - PRIORITIZE DATABASE THUMBNAILS
    const getVideoThumbnail = () => {
      console.log('🎯 Getting thumbnail for video:', {
        id: item.id,
        hasDatabaseThumbnail: !!item.thumbnail_url,
        databaseThumbnail: item.thumbnail_url,
        hasGeneratedThumbnail: !!generatedThumbnails[item.id],
        generatedThumbnail: generatedThumbnails[item.id]
      });

      // Priority 1: Use locally generated thumbnail if available (most reliable)
      if (generatedThumbnails[item.id]) {
        console.log('✅ Using generated thumbnail:', generatedThumbnails[item.id]);
        return generatedThumbnails[item.id];
      }
      
      // Priority 2: Check if database thumbnail is actually an image (not video with params)
      if (item.thumbnail_url && item.thumbnail_url.trim() !== '') {
        const thumbnailUrl = item.thumbnail_url;
        // Check if it's a real thumbnail image or just a video with parameters
        if (thumbnailUrl.includes('.jpg') || thumbnailUrl.includes('.jpeg') || 
            thumbnailUrl.includes('.png') || thumbnailUrl.includes('.webp') ||
            (thumbnailUrl.includes('thumbnail') && !thumbnailUrl.includes('.mp4'))) {
          console.log('✅ Using database thumbnail image:', thumbnailUrl);
          const url = getDirectUrl(thumbnailUrl);
          const timestamp = Date.now();
          return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
        } else {
          console.log('⚠️ Database thumbnail is video URL, not image - will generate locally');
        }
      }
      
      // Priority 3: Fallback to default thumbnail
      console.log('⚠️ No valid thumbnail available, using default');
      return DEFAULT_VIDEO_THUMBNAIL;
    };

    const videoThumbnailUrl = getVideoThumbnail();

    const handleVideoImageError = (error: any) => {
      console.log('Video thumbnail error for ID:', item.id);
      setThumbnailErrors(prev => ({ ...prev, [item.id]: true }));
    };

    return (
      <View style={styles.mediaItem}>
        <TouchableOpacity 
          style={styles.videoContainer}
          activeOpacity={0.8}
          onPress={() => openFullScreen(item, 'video')} // Single tap to open full screen
        >
          {/* Loading state for video thumbnails */}
          {!generatedThumbnails[item.id] && !thumbnailErrors[item.id] && (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.videoLoadingText}>Generating...</Text>
            </View>
          )}
          <Image
            source={thumbnailErrors[item.id] ? { uri: DEFAULT_VIDEO_THUMBNAIL } : { uri: videoThumbnailUrl }}
            contentFit="cover"
            style={styles.videoItem}
            cachePolicy="none" // Disable cache to ensure fresh thumbnails
            transition={200}
            onError={handleVideoImageError}
            onLoad={() => {
              console.log('✅ Video thumbnail loaded successfully:', { 
                id: item.id, 
                url: videoThumbnailUrl,
                source: thumbnailErrors[item.id] ? 'default' : 'actual'
              });
            }}
            onLoadStart={() => {
              console.log('🔄 Video thumbnail loading started:', { 
                id: item.id, 
                url: videoThumbnailUrl,
                source: thumbnailErrors[item.id] ? 'default' : 'actual'
              });
            }}
            placeholder={{ uri: DEFAULT_VIDEO_THUMBNAIL }}
          />
          <View style={styles.playButton}>
            <Text style={styles.playButtonText}>Play</Text>
          </View>
        </TouchableOpacity>
        
        {/* Removed progress overlay - no longer needed */}
        
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

  // Full Screen Modal Component
  const renderFullScreenModal = () => {
    if (!fullScreenItem) return null;

    const mediaUrl = getDirectUrl(fullScreenItem.external_url);

    return (
      <Modal
        visible={fullScreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreen}
        statusBarTranslucent
      >
        <View style={styles.fullScreenContainer}>
          {/* Header with close button */}
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity onPress={closeFullScreen} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Media Content */}
          <View style={styles.fullScreenContent}>
            {fullScreenType === 'photo' ? (
              <Image
                source={{ uri: mediaUrl }}
                contentFit="contain"
                style={styles.fullScreenImage}
              />
            ) : (
              <View style={styles.fullScreenVideoContainer}>
                {isVideoPlaying ? (
                  // HTML5 Video Player for web
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <video
                      ref={videoRef}
                      src={mediaUrl}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        backgroundColor: 'black'
                      }}
                      controls
                      autoPlay
                      onPause={pauseVideo}
                      onEnded={() => setIsVideoPlaying(false)}
                    />
                  </div>
                ) : (
                  // Thumbnail with play button
                  <TouchableOpacity 
                    style={styles.videoThumbnailContainer}
                    onPress={playVideo}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: generatedThumbnails[fullScreenItem.id] || DEFAULT_VIDEO_THUMBNAIL }}
                      contentFit="contain"
                      style={styles.fullScreenVideo}
                    />
                    <View style={styles.fullScreenPlayButton}>
                      <View style={styles.playButtonBackground}>
                        <Text style={styles.fullScreenPlayText}>Play</Text>
                      </View>
                    </View>
                    <Text style={styles.videoPlayText}>Tap to play video</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Footer with actions */}
          <View style={styles.fullScreenFooter}>
            {fullScreenType === 'photo' && (
              <TouchableOpacity 
                style={styles.fullScreenAction}
                onPress={() => {
                  closeFullScreen();
                  setAsAvatar(fullScreenItem.id);
                }}
              >
                <View style={styles.actionButtonBackground}>
                  <Text style={styles.fullScreenActionButtonText}>Main</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.fullScreenAction}
              onPress={() => {
                closeFullScreen();
                deleteMedia(fullScreenItem.id, fullScreenType);
              }}
            >
              <View style={styles.actionButtonBackground}>
                <Text style={styles.fullScreenActionButtonText}>Delete</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header 
          title="My Photos and Videos" 
          fallbackRoute="/(tabs)/profile"
        />
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton('photos', 'Photos', icons.image)}
          {renderTabButton('videos', 'Videos', icons.videoCamera)}
        </View>

        {/* Removed progress bar - no longer needed */}

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

      {/* Full Screen Modal */}
      {renderFullScreenModal()}
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
  progressBarContainer: {
    marginBottom: getResponsiveSpacing(16),
    padding: getResponsiveSpacing(12),
    backgroundColor: COLORS.grayscale100,
    borderRadius: 8,
  },
  progressBarText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'medium',
    color: COLORS.gray,
    marginBottom: getResponsiveSpacing(8),
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.grayscale200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -40,
    width: 80,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  progressText: {
    fontSize: getResponsiveFontSize(10),
    fontFamily: 'medium',
    color: COLORS.white,
    marginTop: 4,
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
    height: ((SIZES.width - 56) / 2) * 1.4, // Increased height for vertical videos (5:7 ratio)
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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.5)',
    elevation: 5,
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
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)',
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
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)',
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
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'semibold',
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
  // Full Screen Modal Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1000,
  },
  closeButton: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'semibold',
    color: COLORS.white,
    textAlign: 'center',
  },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  fullScreenImage: {
    width: screenWidth - 20,
    height: screenHeight * 0.7,
    borderRadius: 8,
  },
  fullScreenVideoContainer: {
    width: screenWidth - 20,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnailContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreenVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  fullScreenPlayButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fullScreenPlayText: {
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  videoPlayText: {
    position: 'absolute',
    bottom: 30,
    fontSize: getResponsiveFontSize(18),
    color: COLORS.white,
    fontFamily: 'medium',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  fullScreenFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullScreenAction: {
    alignItems: 'center',
    padding: 10,
  },
  actionButtonBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  fullScreenActionText: {
    color: COLORS.white,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'medium',
    textAlign: 'center',
  },
  fullScreenActionButtonText: {
    color: COLORS.white,
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'semibold',
    textAlign: 'center',
  },
  debugOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  debugText: {
    color: COLORS.white,
    fontSize: getResponsiveFontSize(10),
    fontFamily: 'medium',
    textAlign: 'center',
    marginVertical: 2,
  },
  videoLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    borderRadius: 8,
  },
  videoLoadingText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'medium',
    color: COLORS.primary,
    marginTop: 8,
  }
});

export default PhotosVideos;