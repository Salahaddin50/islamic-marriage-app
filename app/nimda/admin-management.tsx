import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminAuth } from '../../src/contexts/AdminAuthContext';
import { AdminUser } from '../../src/services/admin-auth.service';

const AdminManagement: React.FC = () => {
  const { isSuperAdmin, getPendingAdmins, approveAdmin, rejectAdmin } = useAdminAuth();
  const [pendingAdmins, setPendingAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin()) {
      Alert.alert(
        'Access Denied',
        'Only super administrators can access this section.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }
    
    loadPendingAdmins();
  }, []);

  const loadPendingAdmins = async () => {
    try {
      setLoading(true);
      const result = await getPendingAdmins();
      
      if (result.success && result.data) {
        setPendingAdmins(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to load pending admins');
      }
    } catch (error) {
      console.error('Load pending admins error:', error);
      Alert.alert('Error', 'Failed to load pending admins');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPendingAdmins();
  }, []);

  const handleApproveAdmin = async (adminId: string, adminName: string) => {
    Alert.alert(
      'Approve Admin',
      `Are you sure you want to approve ${adminName} as an administrator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const result = await approveAdmin(adminId);
              if (result.success) {
                setPendingAdmins(prev => prev.filter(admin => admin.id !== adminId));
                Alert.alert('Success', `${adminName} has been approved as an administrator.`);
              } else {
                Alert.alert('Error', result.error || 'Failed to approve admin');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to approve admin');
            }
          }
        }
      ]
    );
  };

  const handleRejectAdmin = async (adminId: string, adminName: string) => {
    Alert.alert(
      'Reject Admin',
      `Are you sure you want to reject ${adminName}'s administrator request? This will permanently delete their request.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await rejectAdmin(adminId);
              if (result.success) {
                setPendingAdmins(prev => prev.filter(admin => admin.id !== adminId));
                Alert.alert('Success', `${adminName}'s administrator request has been rejected.`);
              } else {
                Alert.alert('Error', result.error || 'Failed to reject admin');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to reject admin');
            }
          }
        }
      ]
    );
  };

  const renderAdminItem = ({ item }: { item: AdminUser }) => (
    <View style={styles.adminCard}>
      <View style={styles.adminHeader}>
        <View style={styles.adminInfo}>
          <View style={styles.adminImageContainer}>
            {item.profile_picture ? (
              <Image
                source={{ uri: item.profile_picture }}
                style={styles.adminImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.adminImagePlaceholder}>
                <Ionicons name="person" size={32} color="#9CA3AF" />
              </View>
            )}
          </View>
          
          <View style={styles.adminDetails}>
            <Text style={styles.adminName}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={styles.adminEmail}>{item.email}</Text>
            <Text style={styles.adminMeta}>
              Requested: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.pendingBadge}>
          <Ionicons name="time" size={16} color="#F59E0B" />
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      </View>

      <View style={styles.adminActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApproveAdmin(item.id, `${item.first_name} ${item.last_name}`)}
        >
          <Ionicons name="checkmark" size={18} color="#ffffff" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectAdmin(item.id, `${item.first_name} ${item.last_name}`)}
        >
          <Ionicons name="close" size={18} color="#ffffff" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="shield-checkmark" size={64} color="#E5E7EB" />
      </View>
      <Text style={styles.emptyTitle}>No Pending Requests</Text>
      <Text style={styles.emptyText}>
        All administrator requests have been processed. New requests will appear here for your approval.
      </Text>
    </View>
  );

  const renderInfoCard = () => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Ionicons name="information-circle" size={24} color="#667eea" />
        <Text style={styles.infoTitle}>Super Administrator</Text>
      </View>
      <Text style={styles.infoText}>
        As a super administrator, you have the authority to approve or reject new administrator requests. 
        Approved administrators will have access to the admin panel and can manage user profiles, interests, and meet requests.
      </Text>
    </View>
  );

  if (!isSuperAdmin()) {
    return null; // Will redirect back due to useEffect
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
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
          <Text style={styles.headerTitle}>Admin Management</Text>
        </View>

        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            Pending Requests: {pendingAdmins.length}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={pendingAdmins}
        renderItem={renderAdminItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderInfoCard()}
        ListEmptyComponent={!loading ? renderEmptyState() : null}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading pending requests...</Text>
        </View>
      )}
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
  statsBar: {
    marginTop: 12,
  },
  statsText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  listContainer: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  adminCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  adminInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  adminImageContainer: {
    marginRight: 16,
  },
  adminImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  adminImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  adminMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  adminActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
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

export default AdminManagement;
