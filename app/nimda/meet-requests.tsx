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
  ScrollView,
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AdminInterestsService, { MeetRequest, MeetRequestFilters } from '../../src/services/admin-interests.service';

const MeetRequests: React.FC = () => {
  const [meetRequests, setMeetRequests] = useState<MeetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalMeetRequests: 0,
    pendingMeetRequests: 0,
    acceptedMeetRequests: 0,
    rejectedMeetRequests: 0,
    todayMeetRequests: 0,
    weekMeetRequests: 0,
    scheduledMeetings: 0
  });

  // Filters
  const [filters, setFilters] = useState<MeetRequestFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Selection for bulk actions
  const [selectedMeetRequests, setSelectedMeetRequests] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    loadMeetRequests(true);
    loadAnalytics();
  }, [filters]);

  const loadMeetRequests = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const result = await AdminInterestsService.getMeetRequests(filters, currentPage, 20);

      if (result.success && result.data) {
        if (reset) {
          setMeetRequests(result.data.meetRequests);
        } else {
          setMeetRequests(prev => [...prev, ...result.data!.meetRequests]);
        }
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
        
        if (!reset) {
          setPage(prev => prev + 1);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to load meet requests');
      }

    } catch (error) {
      console.error('Load meet requests error:', error);
      Alert.alert('Error', 'Failed to load meet requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const result = await AdminInterestsService.getMeetRequestsAnalytics();
      if (result.success && result.data) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Load analytics error:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMeetRequests(true);
    loadAnalytics();
  }, [filters]);

  const loadMore = () => {
    if (!loadingMore && page <= totalPages) {
      loadMeetRequests(false);
    }
  };

  const handleDeleteMeetRequest = async (meetRequestId: string) => {
    Alert.alert(
      'Delete Meet Request',
      'Are you sure you want to delete this meet request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AdminInterestsService.deleteMeetRequest(meetRequestId);
              if (result.success) {
                setMeetRequests(prev => prev.filter(m => m.id !== meetRequestId));
                loadAnalytics();
                Alert.alert('Success', 'Meet request deleted successfully');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete meet request');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete meet request');
            }
          }
        }
      ]
    );
  };

  const handleOpenMeetLink = async (meetLink: string) => {
    try {
      const supported = await Linking.canOpenURL(meetLink);
      if (supported) {
        await Linking.openURL(meetLink);
      } else {
        Alert.alert('Error', 'Cannot open this meeting link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open meeting link');
    }
  };

  const toggleMeetRequestSelection = (meetRequestId: string) => {
    const newSelection = new Set(selectedMeetRequests);
    if (newSelection.has(meetRequestId)) {
      newSelection.delete(meetRequestId);
    } else {
      newSelection.add(meetRequestId);
    }
    setSelectedMeetRequests(newSelection);
  };

  const handleBulkDelete = async () => {
    if (selectedMeetRequests.size === 0) return;

    Alert.alert(
      'Bulk Delete',
      `Delete ${selectedMeetRequests.size} selected meet requests?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AdminInterestsService.bulkDeleteMeetRequests(Array.from(selectedMeetRequests));
              if (result.success && result.results) {
                Alert.alert('Success', `Deleted ${result.results.success} meet requests`);
                setSelectedMeetRequests(new Set());
                setBulkMode(false);
                loadMeetRequests(true);
                loadAnalytics();
              }
            } catch (error) {
              Alert.alert('Error', 'Bulk delete failed');
            }
          }
        }
      ]
    );
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', color: '#F59E0B', icon: 'time' };
      case 'accepted':
        return { text: 'Accepted', color: '#10B981', icon: 'checkmark-circle' };
      case 'rejected':
        return { text: 'Rejected', color: '#EF4444', icon: 'close-circle' };
      default:
        return { text: status, color: '#6B7280', icon: 'help-circle' };
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMeetRequestItem = ({ item }: { item: MeetRequest }) => {
    const statusInfo = getStatusInfo(item.status);
    const isSelected = selectedMeetRequests.has(item.id);
    const isScheduled = item.scheduled_at && new Date(item.scheduled_at) > new Date();

    return (
      <View style={[styles.meetRequestCard, isSelected && styles.meetRequestCardSelected]}>
        {bulkMode && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleMeetRequestSelection(item.id)}
          >
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={24}
              color={isSelected ? '#667eea' : '#9CA3AF'}
            />
          </TouchableOpacity>
        )}

        <View style={styles.meetRequestHeader}>
          <View style={styles.meetRequestInfo}>
            <View style={styles.participantsRow}>
              <View style={styles.participant}>
                <Text style={styles.participantLabel}>From:</Text>
                <Text style={styles.participantName}>{item.sender_name}</Text>
                <Text style={styles.participantEmail}>{item.sender_email}</Text>
              </View>
              <Ionicons name="videocam" size={20} color="#9CA3AF" />
              <View style={styles.participant}>
                <Text style={styles.participantLabel}>To:</Text>
                <Text style={styles.participantName}>{item.receiver_name}</Text>
                <Text style={styles.participantEmail}>{item.receiver_email}</Text>
              </View>
            </View>

            <View style={styles.meetRequestMeta}>
              <Text style={styles.metaText}>
                Created: {formatDateTime(item.created_at)}
              </Text>
              {item.scheduled_at && (
                <Text style={[styles.metaText, { color: isScheduled ? '#10B981' : '#6B7280' }]}>
                  Scheduled: {formatDateTime(item.scheduled_at)}
                </Text>
              )}
              {item.updated_at !== item.created_at && (
                <Text style={styles.metaText}>
                  Updated: {formatDateTime(item.updated_at)}
                </Text>
              )}
            </View>

            {item.meet_link && (
              <TouchableOpacity
                style={styles.meetLinkContainer}
                onPress={() => handleOpenMeetLink(item.meet_link!)}
              >
                <Ionicons name="link" size={16} color="#667eea" />
                <Text style={styles.meetLinkText} numberOfLines={1}>
                  {item.meet_link}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
              <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
            {isScheduled && (
              <View style={styles.scheduledBadge}>
                <Ionicons name="calendar" size={12} color="#10B981" />
                <Text style={styles.scheduledText}>Upcoming</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.meetRequestActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMeetRequest(item.id)}
          >
            <Ionicons name="trash" size={18} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
              Delete
            </Text>
          </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Filter Meet Requests</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersContent}>
            <Text style={styles.filterLabel}>Status</Text>
            <Picker
              selectedValue={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              style={styles.picker}
            >
              <Picker.Item label="All Statuses" value={undefined} />
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Accepted" value="accepted" />
              <Picker.Item label="Rejected" value="rejected" />
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
                setFilters({});
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

  const renderAnalytics = () => (
    <View style={styles.analyticsSection}>
      <Text style={styles.sectionTitle}>Meet Request Analytics</Text>
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>{analytics.totalMeetRequests}</Text>
          <Text style={styles.analyticsLabel}>Total</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={[styles.analyticsValue, { color: '#F59E0B' }]}>{analytics.pendingMeetRequests}</Text>
          <Text style={styles.analyticsLabel}>Pending</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={[styles.analyticsValue, { color: '#10B981' }]}>{analytics.acceptedMeetRequests}</Text>
          <Text style={styles.analyticsLabel}>Accepted</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={[styles.analyticsValue, { color: '#EF4444' }]}>{analytics.rejectedMeetRequests}</Text>
          <Text style={styles.analyticsLabel}>Rejected</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>{analytics.todayMeetRequests}</Text>
          <Text style={styles.analyticsLabel}>Today</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>{analytics.weekMeetRequests}</Text>
          <Text style={styles.analyticsLabel}>This Week</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={[styles.analyticsValue, { color: '#8B5CF6' }]}>{analytics.scheduledMeetings}</Text>
          <Text style={styles.analyticsLabel}>Scheduled</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
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
          <Text style={styles.headerTitle}>Meet Requests</Text>
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
          <Text style={styles.statsText}>Total: {total} meet requests</Text>
          {bulkMode && selectedMeetRequests.size > 0 && (
            <Text style={styles.statsText}>
              Selected: {selectedMeetRequests.size}
            </Text>
          )}
        </View>
      </LinearGradient>

      {bulkMode && selectedMeetRequests.size > 0 && (
        <View style={styles.bulkActions}>
          <TouchableOpacity
            style={[styles.bulkButton, styles.bulkDeleteButton]}
            onPress={handleBulkDelete}
          >
            <Ionicons name="trash" size={18} color="#ffffff" />
            <Text style={styles.bulkButtonText}>Delete Selected</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={meetRequests}
        renderItem={renderMeetRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={renderAnalytics()}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 20 }} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam" size={64} color="#E5E7EB" />
              <Text style={styles.emptyText}>No meet requests found</Text>
            </View>
          ) : null
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading meet requests...</Text>
        </View>
      )}

      {renderFiltersModal()}
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
  bulkDeleteButton: {
    backgroundColor: '#EF4444',
  },
  bulkButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  analyticsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    width: '31%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  analyticsLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  meetRequestCard: {
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
  meetRequestCardSelected: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  meetRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  meetRequestInfo: {
    flex: 1,
    marginRight: 12,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participant: {
    flex: 1,
  },
  participantLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  meetRequestMeta: {
    marginBottom: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  meetLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  meetLinkText: {
    fontSize: 12,
    color: '#667eea',
    marginLeft: 6,
    flex: 1,
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
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scheduledText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 2,
  },
  meetRequestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#10B981',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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

export default MeetRequests;
