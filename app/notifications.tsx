import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons } from '@/constants';
import { Image } from 'expo-image';
import { ScrollView } from 'react-native-virtualized-view';
import NotificationCard from '@/components/NotificationCard';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { useNotifications } from '@/src/contexts/NotificationContext';
import { NotificationsService } from '@/src/services/notifications';

// Notifications Screen
const Notifications = () => {
    const navigation = useNavigation<NavigationProp<any>>();
    const { 
        notifications, 
        unreadCount, 
        isLoading, 
        soundEnabled, 
        refreshNotifications, 
        markAsRead, 
        markAllAsRead,
        deleteNotification,
        setSoundEnabled 
    } = useNotifications();

    // Mark all as read when screen is focused
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (unreadCount > 0) {
                markAllAsRead();
            }
        });

        return unsubscribe;
    }, [navigation, unreadCount, markAllAsRead]);

    // Test function to create sample notifications
    const createTestNotifications = async () => {
        try {
            const testNotifications = [
                {
                    sender_name: 'Sarah Johnson',
                    sender_age: 27,
                    type: 'photo_request' as const,
                    title: 'Photo Request',
                    message: 'Sarah Johnson, 27 requests your photo'
                },
                {
                    sender_name: 'Emma Wilson', 
                    sender_age: 24,
                    type: 'photo_shared' as const,
                    title: 'Photos Shared',
                    message: 'Emma Wilson, 24 has shared photos with you'
                },
                {
                    sender_name: 'Michael Chen',
                    sender_age: 29,
                    type: 'video_call_request' as const,
                    title: 'Video Call Request', 
                    message: 'Michael Chen, 29 requests a video call'
                }
            ];

            const currentUserId = await NotificationsService.getCurrentUserId();
            
            for (const notif of testNotifications) {
                await NotificationsService.create({
                    user_id: currentUserId,
                    sender_id: currentUserId, // Using same user as sender for testing
                    ...notif
                });
            }
            
            console.log('Created test notifications!');
            refreshNotifications();
        } catch (error) {
            console.error('Error creating test notifications:', error);
        }
    };

    /**
    * Render header
    */
    const renderHeader = () => {
        return (
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Image
                            source={icons.back}
                            contentFit='contain'
                            style={[styles.backIcon, {
                                tintColor: COLORS.black
                            }]} 
                        />
                    </TouchableOpacity>
                    <Image source={icons.notificationBell} contentFit='contain' style={[styles.headerLogo, {tintColor: COLORS.primary}]} />
                    <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>Notifications</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        onPress={() => setSoundEnabled(!soundEnabled)}
                        style={styles.soundButton}
                    >
                        <Image
                            source={soundEnabled ? icons.mediumVolume : icons.noSound}
                            contentFit='contain'
                            style={[styles.soundIcon, {
                                tintColor: soundEnabled ? COLORS.primary : COLORS.black
                            }]}
                        />
                    </TouchableOpacity>
                    {/* Temporary test button */}
                    <TouchableOpacity
                        onPress={createTestNotifications}
                        style={styles.testButton}
                    >
                        <Text style={styles.testButtonText}>Test</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Image
                source={icons.notificationBell}
                contentFit='contain'
                style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyDescription}>
                You'll see notifications about interests, meet requests, and messages here.
            </Text>
        </View>
    );

    const renderNotification = ({ item, index }: { item: any, index: number }) => (
        <NotificationCard
            title={item.title}
            description={item.message}
            date={item.created_at}
            time={new Date(item.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}
            type={item.type}
            isNew={!item.is_read}
            onPress={() => {
                if (!item.is_read) {
                    markAsRead(item.id);
                }
            }}
            onDelete={() => deleteNotification(item.id)}
        />
    );



    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                {renderHeader()}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading notifications...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={item => item.id}
                        renderItem={renderNotification}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={notifications.length === 0 ? styles.emptyContentContainer : undefined}
                        ListEmptyComponent={renderEmptyState}
                        refreshControl={
                            <RefreshControl
                                refreshing={isLoading}
                                onRefresh={refreshNotifications}
                                colors={[COLORS.primary]}
                                tintColor={COLORS.primary}
                            />
                        }
                    />
                )}
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
        padding: 16
    },
    headerContainer: {
        flexDirection: 'row', 
        alignItems: 'center', 
        width: '100%', 
        justifyContent: 'space-between',
        paddingBottom: 16
    },
    scrollView: {
        backgroundColor: COLORS.tertiaryWhite
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center"
    },
    headerLogo: {
        height: 36, 
        width: 36, 
        tintColor: COLORS.primary,
        marginRight: 12
    },
    backButton: {
        marginRight: 16,
        padding: 4
    },
    backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black
    },
    headerTitle: {
        fontSize: 20, 
        fontFamily: "bold", 
        color: COLORS.black
    },
    moreIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.black
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    soundButton: {
        padding: 8,
        borderRadius: 20,
        marginLeft: 8
    },
    soundIcon: {
        width: 24,
        height: 24
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'medium',
        color: COLORS.greyscale900,
        marginTop: 12
    },
    emptyContentContainer: {
        flexGrow: 1,
        justifyContent: 'center'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 50
    },
    emptyIcon: {
        width: 80,
        height: 80,
        tintColor: COLORS.grayscale400,
        marginBottom: 20
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        marginBottom: 8,
        textAlign: 'center'
    },
    emptyDescription: {
        fontSize: 16,
        fontFamily: 'regular',
        color: COLORS.grayscale700,
        textAlign: 'center',
        lineHeight: 24
    },
    testButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginLeft: 8
    },
    testButtonText: {
        color: COLORS.white,
        fontSize: 12,
        fontFamily: 'bold'
    }
})

export default Notifications