import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons } from '@/constants';
import { Image } from 'expo-image';
import { ScrollView } from 'react-native-virtualized-view';
import NotificationCard from '@/components/NotificationCard';
import { useNavigation, router } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { useNotifications } from '@/src/contexts/NotificationContext';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { NotificationsService } from '@/src/services/notifications';

// Notifications Screen
const Notifications = () => {
    const navigation = useNavigation<NavigationProp<any>>();
    const { t } = useLanguage();
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
                    <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>{t('notifications.title')}</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        onPress={refreshNotifications}
                        style={styles.soundButton}
                    >
                        <Image
                            source={icons.refresh || icons.clock}
                            contentFit='contain'
                            style={[styles.soundIcon, {
                                tintColor: COLORS.greyscale900
                            }]}
                        />
                    </TouchableOpacity>
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
            <Text style={styles.emptyTitle}>{t('notifications.empty.title')}</Text>
            <Text style={styles.emptyDescription}>{t('notifications.empty.description')}</Text>
        </View>
    );

    // Localize known notification types regardless of stored English text
    const getLocalizedContent = (item: any): { title: string; message: string } => {
        const name = item.sender_name || '';
        const age = item.sender_age || '';
        const preview = item?.metadata?.preview || '';
        switch (item.type) {
            case 'photo_request':
                return { 
                    title: t('notifications.types.photo_request.title'), 
                    message: t('notifications.types.photo_request.message', { name, age })
                };
            case 'photo_shared':
                return {
                    title: t('notifications.types.photo_shared.title'),
                    message: t('notifications.types.photo_shared.message', { name, age })
                };
            case 'video_call_request':
                return {
                    title: t('notifications.types.video_call_request.title'),
                    message: t('notifications.types.video_call_request.message', { name, age })
                };
            case 'video_call_approved':
                return {
                    title: t('notifications.types.video_call_approved.title'),
                    message: t('notifications.types.video_call_approved.message', { name, age })
                };
            case 'whatsapp_request':
                return {
                    title: t('notifications.types.whatsapp_request.title'),
                    message: t('notifications.types.whatsapp_request.message', { name, age })
                };
            case 'whatsapp_shared':
                return {
                    title: t('notifications.types.whatsapp_shared.title'),
                    message: t('notifications.types.whatsapp_shared.message', { name, age })
                };
            case 'interest_received':
                return {
                    title: t('notifications.types.interest_received.title'),
                    message: t('notifications.types.interest_received.message', { name, age })
                };
            case 'interest_accepted':
                return {
                    title: t('notifications.types.interest_accepted.title'),
                    message: t('notifications.types.interest_accepted.message', { name, age })
                };
            case 'meet_request_received':
                return {
                    title: t('notifications.types.meet_request_received.title'),
                    message: t('notifications.types.meet_request_received.message', { name, age })
                };
            case 'meet_request_accepted':
                return {
                    title: t('notifications.types.meet_request_accepted.title'),
                    message: t('notifications.types.meet_request_accepted.message', { name, age })
                };
            case 'message_received':
                return {
                    title: t('notifications.types.message_received.title'),
                    message: t('notifications.types.message_received.message', { name, preview })
                };
            case 'profile_approved':
                return {
                    title: t('notifications.types.profile_approved.title'),
                    message: t('notifications.types.profile_approved.message')
                };
            default:
                return { title: item.title, message: item.message };
        }
    };

    const getNavigationTarget = (type: string) => {
        switch (type) {
            case 'photo_request':
            case 'photo_shared':
            case 'interest_received':
            case 'interest_accepted':
                return '/(tabs)/interests';
            case 'video_call_request':
            case 'video_call_approved':
            case 'meet_request_received':
            case 'meet_request_accepted':
                return '/(tabs)/meet-requests';
            case 'whatsapp_request':
            case 'whatsapp_shared':
            case 'message_received':
                return '/(tabs)/chats';
            case 'profile_approved':
                return '/(tabs)/profile'; // Navigate to profile tab to see approved profile
            default:
                return null;
        }
    };

    const handleNotificationPress = (item: any) => {
        if (!item.is_read) {
            markAsRead(item.id);
        }
        // Navigate to the relevant tab based on notification type
        const target = getNavigationTarget(item.type);
        if (target) {
            router.push(target);
        }
    };

    const handleUserPress = (userId: string) => {
        // Navigate to the sender's match details page
        router.push(`/matchdetails?userId=${userId}`);
    };

    const renderNotification = ({ item, index }: { item: any, index: number }) => {
        const localized = getLocalizedContent(item);
        return (
        <NotificationCard
            title={localized.title}
            description={localized.message}
            date={item.created_at}
            time={new Date(item.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}
            type={item.type}
            isNew={!item.is_read}
            senderId={item.sender_id}
            senderName={item.sender_name}
            onPress={() => handleNotificationPress(item)}
            onDelete={() => deleteNotification(item.id)}
            onUserPress={handleUserPress}
        />
        );
    };



    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                {renderHeader()}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>{t('notifications.loading')}</Text>
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

})

export default Notifications