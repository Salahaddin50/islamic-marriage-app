import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AdminProfilesService, { UserProfile, MediaReference, ProfileFilters } from '../../src/services/admin-profiles.service';

const { width } = Dimensions.get('window');

interface FilterOptions {
  countries: string[];
  cities: string[];
  ageRange: { min: number; max: number };
}

const MaleProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [filters, setFilters] = useState<ProfileFilters>({ gender: 'male' });
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    countries: [],
    cities: [],
    ageRange: { min: 18, max: 80 }
  });

  // Profile details modal
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileMedia, setProfileMedia] = useState<MediaReference[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);

  // Selection for bulk actions
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    loadProfiles(true);
    loadFilterOptions();
  }, [filters]);

  const loadProfiles = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const result = await AdminProfilesService.getProfiles(filters, currentPage, 20);

      if (result.success && result.data) {
        if (reset) {
          setProfiles(result.data.profiles);
        } else {
          setProfiles(prev => [...prev, ...result.data!.profiles]);
        }
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
        
        if (!reset) {
          setPage(prev => prev + 1);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to load profiles');
      }

    } catch (error) {
      console.error('Load profiles error:', error);
      Alert.alert('Error', 'Failed to load profiles');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const result = await AdminProfilesService.getFilterOptions();
      if (result.success && result.data) {
        setFilterOptions(result.data);
      }
    } catch (error) {
      console.error('Load filter options error:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfiles(true);
  }, [filters]);

  const loadMore = () => {
    if (!loadingMore && page <= totalPages) {
      loadProfiles(false);
    }
  };

  const handleApprove = async (profileId: string) => {
    try {
      const result = await AdminProfilesService.approveProfile(profileId);
      if (result.success) {
        setProfiles(prev => prev.map(p => 
          p.id === profileId ? { ...p, admin_approved: true } : p
        ));
        Alert.alert('Success', 'Profile approved successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to approve profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to approve profile');
    }
  };

  const handleReject = async (profileId: string) => {
    Alert.alert(
      'Reject Profile',
      'Are you sure you want to reject this profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AdminProfilesService.rejectProfile(profileId);
              if (result.success) {
                setProfiles(prev => prev.map(p => 
                  p.id === profileId ? { ...p, admin_approved: false } : p
                ));
                Alert.alert('Success', 'Profile rejected');
              } else {
                Alert.alert('Error', result.error || 'Failed to reject profile');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to reject profile');
            }
          }
        }
      ]
    );
  };

  const handleViewProfile = async (profile: UserProfile) => {
    setSelectedProfile(profile);
    setMediaLoading(true);
    setShowProfileModal(true);

    try {
      const result = await AdminProfilesService.getUserMedia(profile.user_id);
      if (result.success) {
        setProfileMedia(result.data || []);
      }
    } catch (error) {
      console.error('Load profile media error:', error);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    Alert.alert(
      'Delete Media',
      'Are you sure you want to delete this media item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AdminProfilesService.deleteMedia(mediaId);
              if (result.success) {
                setProfileMedia(prev => prev.filter(m => m.id !== mediaId));
                Alert.alert('Success', 'Media deleted successfully');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete media');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete media');
            }
          }
        }
      ]
    );
  };

  const toggleProfileSelection = (profileId: string) => {
    const newSelection = new Set(selectedProfiles);
    if (newSelection.has(profileId)) {
      newSelection.delete(profileId);
    } else {
      newSelection.add(profileId);
    }
    setSelectedProfiles(newSelection);
  };

  const handleBulkApprove = async () => {
    if (selectedProfiles.size === 0) return;

    Alert.alert(
      'Bulk Approve',
      `Approve ${selectedProfiles.size} selected profiles?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const result = await AdminProfilesService.bulkApproveProfiles(Array.from(selectedProfiles));
              if (result.success && result.results) {
                Alert.alert('Success', `Approved ${result.results.success} profiles`);
                setSelectedProfiles(new Set());
                setBulkMode(false);
                loadProfiles(true);
              }
            } catch (error) {
              Alert.alert('Error', 'Bulk approve failed');
            }
          }
        }
      ]
    );
  };

  const handleBulkReject = async () => {
    if (selectedProfiles.size === 0) return;

    Alert.alert(
      'Bulk Reject',
      `Reject ${selectedProfiles.size} selected profiles?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AdminProfilesService.bulkRejectProfiles(Array.from(selectedProfiles));
              if (result.success && result.results) {
                Alert.alert('Success', `Rejected ${result.results.success} profiles`);
                setSelectedProfiles(new Set());
                setBulkMode(false);
                loadProfiles(true);
              }
            } catch (error) {
              Alert.alert('Error', 'Bulk reject failed');
            }
          }
        }
      ]
    );
  };

  const getApprovalStatus = (approved: boolean | null) => {
    if (approved === null) return { text: 'Pending', color: '#F59E0B', icon: 'time' };
    if (approved === true) return { text: 'Approved', color: '#10B981', icon: 'checkmark-circle' };
    return { text: 'Rejected', color: '#EF4444', icon: 'close-circle' };
  };

  const renderProfileItem = ({ item }: { item: UserProfile }) => {
    const status = getApprovalStatus(item.admin_approved);
    const isSelected = selectedProfiles.has(item.id);

    return (
      <View style={[styles.profileCard, isSelected && styles.profileCardSelected]}>
        {bulkMode && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleProfileSelection(item.id)}
          >
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={24}
              color={isSelected ? '#667eea' : '#9CA3AF'}
            />
          </TouchableOpacity>
        )}

        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={styles.profileEmail}>{item.email}</Text>
            <View style={styles.profileDetails}>
              <Text style={styles.profileDetail}>Age: {item.age}</Text>
              <Text style={styles.profileDetail}>
                {item.city}, {item.country}
              </Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Ionicons name={status.icon as any} size={16} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.profileActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewProfile(item)}
          >
            <Ionicons name="eye" size={18} color="#667eea" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>

          {item.admin_approved === null && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(item.id)}
              >
                <Ionicons name="checkmark" size={18} color="#10B981" />
                <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                  Approve
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(item.id)}
              >
                <Ionicons name="close" size={18} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                  Reject
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filtersModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Profiles</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersContent}>
            <Text style={styles.filterLabel}>Approval Status</Text>
            <Picker
              selectedValue={filters.admin_approved}
              onValueChange={(value) => setFilters(prev => ({ ...prev, admin_approved: value }))}
              style={styles.picker}
            >
              <Picker.Item label="All Statuses" value={undefined} />
              <Picker.Item label="Pending" value={null} />
              <Picker.Item label="Approved" value={true} />
              <Picker.Item label="Rejected" value={false} />
            </Picker>

            <Text style={styles.filterLabel}>Country</Text>
            <Picker
              selectedValue={filters.country || ''}
              onValueChange={(value) => setFilters(prev => ({ ...prev, country: value || undefined }))}
              style={styles.picker}
            >
              <Picker.Item label="All Countries" value="" />
              {filterOptions.countries.map(country => (
                <Picker.Item key={country} label={country} value={country} />
              ))}
            </Picker>

            <Text style={styles.filterLabel}>Search</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              value={filters.search || ''}
              onChangeText={(text) => setFilters(prev => ({ ...prev, search: text || undefined }))}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setFilters({ gender: 'male' });
                setShowFilters(false);
              }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderProfileModal = () => (
    <Modal
      visible={showProfileModal}
      animationType="slide"
      onRequestClose={() => setShowProfileModal(false)}
    >
      <SafeAreaView style={styles.profileModalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Profile Details</Text>
          <TouchableOpacity onPress={() => setShowProfileModal(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {selectedProfile && (
          <ScrollView style={styles.profileModalContent}>
            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>
                    {selectedProfile.first_name} {selectedProfile.last_name}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{selectedProfile.email}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Age</Text>
                  <Text style={styles.infoValue}>{selectedProfile.age}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>
                    {selectedProfile.city}, {selectedProfile.country}
                  </Text>
                </View>
                {selectedProfile.occupation && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Occupation</Text>
                    <Text style={styles.infoValue}>{selectedProfile.occupation}</Text>
                  </View>
                )}
                {selectedProfile.education_level && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Education</Text>
                    <Text style={styles.infoValue}>{selectedProfile.education_level}</Text>
                  </View>
                )}
              </View>
            </View>

            {selectedProfile.bio && (
              <View style={styles.profileSection}>
                <Text style={styles.sectionTitle}>Bio</Text>
                <Text style={styles.bioText}>{selectedProfile.bio}</Text>
              </View>
            )}

            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Media ({profileMedia.length})</Text>
              {mediaLoading ? (
                <ActivityIndicator size="large" color="#667eea" style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.mediaGrid}>
                  {profileMedia.map((media) => (
                    <View key={media.id} style={styles.mediaItem}>
                      <Image
                        source={{ uri: media.thumbnail_url || media.external_url }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                      <View style={styles.mediaOverlay}>
                        <Text style={styles.mediaType}>
                          {media.media_type.toUpperCase()}
                        </Text>
                        <TouchableOpacity
                          style={styles.deleteMediaButton}
                          onPress={() => handleDeleteMedia(media.id)}
                        >
                          <Ionicons name="trash" size={16} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                      {media.is_profile_picture && (
                        <View style={styles.profilePictureBadge}>
                          <Text style={styles.profilePictureText}>Profile</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#06B6D4', '#0891B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Male Profiles</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons name="filter" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setBulkMode(!bulkMode)}
            >
              <Ionicons name="checkmark-done" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsBar}>
          <Text style={styles.statsText}>Total: {total} profiles</Text>
          {bulkMode && selectedProfiles.size > 0 && (
            <Text style={styles.statsText}>
              Selected: {selectedProfiles.size}
            </Text>
          )}
        </View>
      </LinearGradient>

      {bulkMode && selectedProfiles.size > 0 && (
        <View style={styles.bulkActions}>
          <TouchableOpacity
            style={[styles.bulkButton, styles.bulkApproveButton]}
            onPress={handleBulkApprove}
          >
            <Ionicons name="checkmark" size={18} color="#ffffff" />
            <Text style={styles.bulkButtonText}>Approve Selected</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkButton, styles.bulkRejectButton]}
            onPress={handleBulkReject}
          >
            <Ionicons name="close" size={18} color="#ffffff" />
            <Text style={styles.bulkButtonText}>Reject Selected</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={profiles}
        renderItem={renderProfileItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="large" color="#06B6D4" style={{ marginVertical: 20 }} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="man" size={64} color="#E5E7EB" />
              <Text style={styles.emptyText}>No male profiles found</Text>
            </View>
          ) : null
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#06B6D4" />
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      )}

      {renderFiltersModal()}
      {renderProfileModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statsText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  bulkActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bulkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  bulkApproveButton: {
    backgroundColor: '#10B981',
  },
  bulkRejectButton: {
    backgroundColor: '#EF4444',
  },
  bulkButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  listContainer: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCardSelected: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileInfo: {
    flex: 1,
    marginRight: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  profileDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  profileDetail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 12,
    marginBottom: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
    marginTop: 4,
    backgroundColor: '#F3F4F6',
  },
  approveButton: {
    backgroundColor: '#D1FAE5',
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filtersModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  picker: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  clearFiltersText: {
    fontSize: 16,
    color: '#6B7280',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#06B6D4',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  profileModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  profileModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoGrid: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  bioText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  mediaItem: {
    width: (width - 56) / 3,
    height: (width - 56) / 3,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    padding: 8,
  },
  mediaType: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  deleteMediaButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 4,
  },
  profilePictureBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#10B981',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  profilePictureText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});

export default MaleProfiles;
