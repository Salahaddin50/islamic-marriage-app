import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons } from '../constants';
import Header from '../components/Header';
import { router } from 'expo-router';
import Button from '../components/Button';
import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { launchMediaPicker } from '../utils/ImagePickerHelper';
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from '../utils/responsive';
import { PhotosVideosAPI } from '../src/api/photos-videos.api';
import { PhotoVideoItem } from '../src/services/photos-videos.service';

const PhotosVideos = () => {
  const [selectedTab, setSelectedTab] = useState<'photos' | 'videos'>('photos');
  const [photos, setPhotos] = useState<PhotoVideoItem[]>([]);
  const [videos, setVideos] = useState<PhotoVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load media items on component mount
  useEffect(() => {
    loadMediaItems();
  }, []);

  const loadMediaItems = async () => {
    try {
      setLoading(true);
      console.log('Loading media items...');
      const result = await PhotosVideosAPI.getMyMedia();
      console.log('Load media result:', result);
      
      if (result.success && result.data) {
        console.log('Photos:', result.data.photos.length, 'Videos:', result.data.videos.length);
        console.log('Photo URLs:', result.data.photos.map(p => p.external_url));
        setPhotos(result.data.photos);
        setVideos(result.data.videos);
      } else {
        console.log('Load media failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to load media');
      }
    } catch (error) {
      console.error('Load media error:', error);
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

      console.log('Picked media:', mediaResult);

      // Convert URI to File/Blob for upload
      const response = await fetch(mediaResult.uri);
      let blob = await response.blob();
      
      // Create blob with correct MIME type
      if (mediaResult.mimeType) {
        blob = new Blob([blob], { type: mediaResult.mimeType });
      }
      
      console.log('Blob ready for upload - type:', blob.type, 'size:', blob.size);
      
      let result;
      if (type === 'photo') {
        console.log('Uploading photo...');
        result = await PhotosVideosAPI.uploadPhoto(blob, {
          visibility: 'private'
        });
      } else {
        console.log('Uploading video...');
        result = await PhotosVideosAPI.uploadVideo(blob, {
          visibility: 'private'
        });
      }

      console.log('Upload result:', result);

      if (result.success && result.data) {
        console.log('Upload successful, refreshing media list...');
        // Refresh the media list
        await loadMediaItems();
        Alert.alert('Success', `${type === 'photo' ? 'Photo' : 'Video'} uploaded successfully!`);
      } else {
        console.log('Upload failed:', result.error);
        Alert.alert('Error', result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Media picker error:', error);
      Alert.alert('Error', 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (id: string, type: 'photo' | 'video') => {
    Alert.alert(
      'Delete Media',
      `Are you sure you want to delete this ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await PhotosVideosAPI.deleteMedia(id);
              if (result.success) {
                await loadMediaItems(); // Refresh the list
                Alert.alert('Success', `${type === 'photo' ? 'Photo' : 'Video'} deleted successfully!`);
              } else {
                Alert.alert('Error', result.error || 'Delete failed');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete media');
            }
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
              const result = await PhotosVideosAPI.setProfilePicture(id);
              if (result.success) {
                await loadMediaItems(); // Refresh the list
                Alert.alert('Success', 'Photo set as profile avatar!');
              } else {
                Alert.alert('Error', result.error || 'Failed to set avatar');
              }
            } catch (error) {
              console.error('Set avatar error:', error);
              Alert.alert('Error', 'Failed to set profile avatar');
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
      console.log('Image load error for (direct URL):', imageUrl, error);
    };

    return (
      <TouchableOpacity 
        style={styles.mediaItem}
        onLongPress={() => showPhotoOptions(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: imageUrl }}
          contentFit="cover"
          style={styles.photoItem}
          onError={handleImageError}
          onLoad={() => console.log('Image loaded:', imageUrl)}
        />
      
      {/* Set as Main Button */}
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setAsAvatar(item.id)}
      >
        <Text style={styles.buttonText}>Main</Text>
      </TouchableOpacity>
      
      {/* Delete Button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteMedia(item.id, 'photo')}
      >
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
      
      {/* Profile Badge */}
      {item.is_profile_picture && (
        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>Current Avatar</Text>
        </View>
      )}
    </TouchableOpacity>
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
      console.log('Video thumbnail load error for (direct URL):', videoThumbnailUrl, error);
    };

    return (
      <View style={styles.mediaItem}>
        <View style={styles.videoContainer}>
          <Image
            source={{ uri: videoThumbnailUrl }}
            contentFit="cover"
            style={styles.videoItem}
            onError={handleVideoImageError}
            onLoad={() => console.log('Video thumbnail loaded:', videoThumbnailUrl)}
          />
          <View style={styles.playButton}>
            <Text style={[styles.playButtonText, { color: COLORS.white }]}>Play</Text>
          </View>
        </View>
        
        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteMedia(item.id, 'video')}
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
          onBackPress={() => router.push('/(tabs)/profile')}
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
    top: getResponsiveSpacing(8),
    right: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(16), // More horizontal padding
    height: 32, // Taller buttons for better visibility
    borderRadius: 16, // Matching border radius
    backgroundColor: '#ff3b30', // Bright red for better visibility
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  avatarButton: {
    position: 'absolute',
    top: getResponsiveSpacing(8),
    left: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(16), // More horizontal padding
    height: 32, // Taller buttons for better visibility
    borderRadius: 16, // Matching border radius
    backgroundColor: '#34c759', // Bright green for better visibility
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  buttonText: {
    fontSize: getResponsiveFontSize(14), // Larger text for better visibility
    fontFamily: 'semibold',
    color: COLORS.white,
    textAlign: 'center',
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
