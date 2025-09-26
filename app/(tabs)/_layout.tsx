import { Tabs, router } from "expo-router";
import { View, Text, Platform } from "react-native";
import { Image } from "expo-image";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { COLORS, icons, FONTS, SIZES } from "../../constants";
import { getResponsiveFontSize, getResponsiveSpacing, isMobileWeb } from "../../utils/responsive";
import React, { useEffect, useState } from 'react';
import { supabase } from "../../src/config/supabase";

const TabLayout = () => {
  const { t } = useLanguage();
  const [approvedInterestNewCount, setApprovedInterestNewCount] = useState<number>(0);
  const [approvedMeetNewCount, setApprovedMeetNewCount] = useState<number>(0);
  const [approvedMessageNewCount, setApprovedMessageNewCount] = useState<number>(0);
  const [receivedInterestPendingCount, setReceivedInterestPendingCount] = useState<number>(0);
  const [receivedMeetPendingCount, setReceivedMeetPendingCount] = useState<number>(0);
  const [receivedMessagePendingCount, setReceivedMessagePendingCount] = useState<number>(0);
  const [conversationsUnreadCount, setConversationsUnreadCount] = useState<number>(0);
  // Global ring overlay removed
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user && isMounted) {
          router.replace('/login');
          return;
        }
        // For already signed-in users, do not enforce profile-setup here.
        // Completeness enforcement is handled only on SIGNED_IN events below.
      } catch {}
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.replace('/login');
        return;
      }
      // Profile setup enforcement removed - only manual navigation via modal button
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let channel: any;
    let intervalId: any;

    const loadCounts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setApprovedInterestNewCount(0); setApprovedMeetNewCount(0); setApprovedMessageNewCount(0);
          setReceivedInterestPendingCount(0); setReceivedMeetPendingCount(0); setReceivedMessagePendingCount(0);
          setConversationsUnreadCount(0);
          return;
        }

        const [interestsCountRes, meetsCountRes, messagesCountRes, interestsPendingRes, meetsPendingRes, messagesPendingRes] = await Promise.all([
          supabase
            .from('interests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
          supabase
            .from('meet_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
          supabase
            .from('message_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
          supabase
            .from('interests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
            .eq('receiver_id', user.id),
          supabase
            .from('meet_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
            .eq('receiver_id', user.id),
          supabase
            .from('message_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
            .eq('receiver_id', user.id),
        ]);

        setApprovedInterestNewCount(interestsCountRes.count || 0);
        setApprovedMeetNewCount(meetsCountRes.count || 0);
        setApprovedMessageNewCount(messagesCountRes.count || 0);
        setReceivedInterestPendingCount(interestsPendingRes.count || 0);
        setReceivedMeetPendingCount(meetsPendingRes.count || 0);
        setReceivedMessagePendingCount(messagesPendingRes.count || 0);

        // Compute unread text messages across conversations
        try {
          const { data: convoRows } = await supabase
            .from('conversations')
            .select('user_a,user_b,messages,last_read_at_user_a,last_read_at_user_b');
          const total = (convoRows || []).reduce((acc: number, row: any) => {
            const isA = row.user_a === user.id;
            const myLastRead = isA ? row.last_read_at_user_a : row.last_read_at_user_b;
            const msgs: any[] = Array.isArray(row.messages) ? row.messages : [];
            const unread = msgs.filter((m: any) =>
              m.message_type === 'text' &&
              m.status === 'approved' &&
              m.sender_id !== user.id &&
              (!myLastRead || new Date(m.created_at).getTime() > new Date(myLastRead).getTime())
            ).length;
            return acc + unread;
          }, 0);
          setConversationsUnreadCount(total);
        } catch {
          setConversationsUnreadCount(0);
        }
      } catch {}
    };

    loadCounts();

    channel = supabase
      .channel('footer-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interests' }, loadCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meet_requests' }, loadCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_requests' }, loadCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, loadCounts)
      .subscribe();

    // Poll as a fallback to ensure counts reflect local deletes/updates quickly
    intervalId = setInterval(loadCounts, 3000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS !== 'ios',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          left: 0,
          elevation: 0,
          height: isMobileWeb() ? 75 : Platform.OS === 'ios' ? 90 : 65, // Slightly increased for better optimization
          backgroundColor: COLORS.white,
          paddingHorizontal: getResponsiveSpacing(8),
          // Add subtle shadow to separate from content
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.05)',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "",
          // Keep Home tab state and avoid re-renders when switching tabs
          freezeOnBlur: true,
          unmountOnBlur: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => {
            return (
              <View style={{
                alignItems: "center",
                paddingTop: getResponsiveSpacing(16),
                width: isMobileWeb() ? '20%' : SIZES.width / 5,
                minWidth: 60,
              }}>
                <Image
                  source={focused ? icons.home : icons.home2Outline}
                  contentFit="contain"
                  style={{
                    width: isMobileWeb() ? 20 : 24,
                    height: isMobileWeb() ? 20 : 24,
                    tintColor: focused ? COLORS.primary : COLORS.gray3,
                  }}
                />
                <Text style={{
                  ...FONTS.body4,
                  color: focused ? COLORS.primary : COLORS.gray3,
                }}>{t('tabs.home')}</Text>
              </View>
            )
          },
        }}
      />
      <Tabs.Screen
        name="interests"
        options={{
          title: "",
          tabBarIcon: ({ focused }: { focused: boolean }) => {
            return (
              <View style={{
                alignItems: "center",
                paddingTop: getResponsiveSpacing(16),
                width: isMobileWeb() ? '20%' : SIZES.width / 5,
                minWidth: 60,
              }}>
                <View style={{ width: isMobileWeb() ? 28 : 32, height: isMobileWeb() ? 20 : 24, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Image
                    source={focused ? icons.heart2 : icons.heart2Outline}
                    contentFit="contain"
                    style={{
                      width: isMobileWeb() ? 20 : 24,
                      height: isMobileWeb() ? 20 : 24,
                      tintColor: focused ? COLORS.primary : COLORS.gray3,
                    }}
                  />
                  {(receivedInterestPendingCount > 0 || approvedInterestNewCount > 0) && (
                    <View style={{ position: 'absolute', top: isMobileWeb() ? 1 : 3, left: isMobileWeb() ? 26 : 30, backgroundColor: COLORS.primary, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                      <Text style={{ color: COLORS.white, fontSize: 10, fontFamily: 'bold' }}>
                        {receivedInterestPendingCount > 0 ? t('badges.new') : (approvedInterestNewCount > 99 ? '99+' : approvedInterestNewCount)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{
                  ...FONTS.body4,
                  color: focused ? COLORS.primary : COLORS.gray3,
                }}>{t('tabs.requests')}</Text>
              </View>
            )
          },
        }}
      />
      <Tabs.Screen
        name="meet-requests"
        options={{
          title: "",
          tabBarIcon: ({ focused }: { focused: boolean }) => {
            return (
              <View style={{
                alignItems: "center",
                paddingTop: getResponsiveSpacing(16),
                width: isMobileWeb() ? '20%' : SIZES.width / 5,
                minWidth: 60,
              }}>
                <View style={{ width: isMobileWeb() ? 28 : 32, height: isMobileWeb() ? 20 : 24, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Image
                    source={focused ? icons.videoCamera2 : icons.videoCameraOutline}
                    contentFit="contain"
                    style={{
                      width: isMobileWeb() ? 20 : 24,
                      height: isMobileWeb() ? 20 : 24,
                      tintColor: focused ? COLORS.primary : COLORS.gray3,
                    }}
                  />
                  {(receivedMeetPendingCount > 0 || approvedMeetNewCount > 0) && (
                    <View style={{ position: 'absolute', top: isMobileWeb() ? 1 : 3, left: isMobileWeb() ? 26 : 30, backgroundColor: COLORS.primary, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                      <Text style={{ color: COLORS.white, fontSize: 10, fontFamily: 'bold' }}>
                        {receivedMeetPendingCount > 0 ? t('badges.new') : (approvedMeetNewCount > 99 ? '99+' : approvedMeetNewCount)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{
                  ...FONTS.body4,
                  color: focused ? COLORS.primary : COLORS.gray3,
                }}>{t('tabs.meet')}</Text>
              </View>
            )
          },
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "",
          tabBarIcon: ({ focused }: { focused: boolean }) => {
            return (
              <View style={{
                alignItems: "center",
                paddingTop: getResponsiveSpacing(16),
                width: isMobileWeb() ? '20%' : SIZES.width / 5,
                minWidth: 60,
              }}>
                <View style={{ width: isMobileWeb() ? 28 : 32, height: isMobileWeb() ? 20 : 24, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Image
                    source={focused ? icons.chat : icons.chatBubble2Outline}
                    contentFit="contain"
                    style={{
                      width: isMobileWeb() ? 20 : 24,
                      height: isMobileWeb() ? 20 : 24,
                      tintColor: focused ? COLORS.primary : COLORS.gray3,
                    }}
                  />
                  {(conversationsUnreadCount > 0 || receivedMessagePendingCount > 0 || approvedMessageNewCount > 0) && (
                    <View style={{ position: 'absolute', top: isMobileWeb() ? 1 : 3, left: isMobileWeb() ? 26 : 30, backgroundColor: COLORS.primary, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                      <Text style={{ color: COLORS.white, fontSize: 10, fontFamily: 'bold' }}>
                        {conversationsUnreadCount > 0
                          ? (conversationsUnreadCount > 99 ? '99+' : conversationsUnreadCount)
                          : receivedMessagePendingCount > 0
                            ? t('badges.new')
                            : (approvedMessageNewCount > 99 ? '99+' : approvedMessageNewCount)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{
                  ...FONTS.body4,
                  color: focused ? COLORS.primary : COLORS.gray3,
                }}>{t('tabs.message')}</Text>
              </View>
            )
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          // Keep Profile tab state as well for quick back navigation
          freezeOnBlur: true,
          unmountOnBlur: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => {
            return (
              <View style={{
                alignItems: "center",
                paddingTop: getResponsiveSpacing(16),
                width: isMobileWeb() ? '20%' : SIZES.width / 5,
                minWidth: 60,
              }}>
                <Image
                  source={focused ? icons.user : icons.userOutline}
                  contentFit="contain"
                  style={{
                    width: isMobileWeb() ? 20 : 24,
                    height: isMobileWeb() ? 20 : 24,
                    tintColor: focused ? COLORS.primary : COLORS.gray3,
                  }}
                />
                <Text style={{
                  ...FONTS.body4,
                  color: focused ? COLORS.primary : COLORS.gray3,
                }}>{t('tabs.profile')}</Text>
              </View>
            )
          },
        }}
      />
      {/* Hide legacy match tab without deleting files */}
      <Tabs.Screen
        name="match"
        options={{
          href: null,
        }}
      />
      {/* Hide legacy maps tab without deleting files */}
      <Tabs.Screen
        name="maps"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}

export default TabLayout