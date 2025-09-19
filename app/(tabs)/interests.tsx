import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Animated } from 'react-native';
import { COLORS, SIZES, icons, images } from '@/constants';
import { Image } from 'expo-image';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Button from '@/components/Button';
import { InterestsService, InterestRecord } from '@/src/services/interests';
import { supabase } from '@/src/config/supabase';
import { useNavigation } from 'expo-router';
import { NavigationProp, useIsFocused } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AcceptConfirmationModal from '@/components/AcceptConfirmationModal';
import { useTranslation } from 'react-i18next';

const InterestsScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const [incoming, setIncoming] = useState<InterestRecord[]>([]);
  const [outgoing, setOutgoing] = useState<InterestRecord[]>([]);
  const [approved, setApproved] = useState<InterestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    { key: 'received', title: t('interests.tabs.received_with_count', { count: 0 }) },
    { key: 'sent', title: t('interests.tabs.sent_with_count', { count: 0 }) },
    { key: 'approved', title: t('interests.tabs.approved_with_count', { count: 0 }) },
  ]);

  const [profilesById, setProfilesById] = useState<Record<string, { name: string; age?: number; avatar?: any }>>({});
  const [meetButtonDisabledByUser, setMeetButtonDisabledByUser] = useState<Record<string, boolean>>({});
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const CACHE_KEY = 'hume_interests_cache_v1';
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const blinkOpacity = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkOpacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blinkOpacity]);
  // style-like object to share opacity
  const stylesBlink = { opacity: blinkOpacity } as const;
  
  // Modal state for accept confirmation
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<InterestRecord | null>(null);

  // Storage utility
  const Storage = {
    async setItem(key: string, value: string) {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    },
    async getItem(key: string): Promise<string | null> {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    },
  };

  const calculateAge = (dateOfBirth?: string | null): number | undefined => {
    if (!dateOfBirth) return undefined;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const PROFILES_CACHE_KEY = 'hume_profiles_cache_v1';

  const loadProfiles = async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;
    // 1) cache
    let cache: Record<string, { name: string; age?: number; avatar?: any }> = {};
    try { const raw = await Storage.getItem(PROFILES_CACHE_KEY); if (raw) cache = JSON.parse(raw) || {}; } catch {}

    const toFetch = uniqueIds.filter(id => !cache[id] || cache[id].age === undefined);
    const map: Record<string, { name: string; age?: number; avatar?: any }> = {};

    if (toFetch.length > 0) {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, date_of_birth, profile_picture_url, gender')
        .in('user_id', toFetch);
      (data || []).forEach((row: any) => {
        const name = (row.first_name || t('interests.member')).toString();
        map[row.user_id] = {
          name,
          age: calculateAge(row.date_of_birth),
          avatar: row.profile_picture_url
            ? row.profile_picture_url
            : (row.gender && typeof row.gender === 'string' && row.gender.toLowerCase() === 'female'
                ? images.femaleSilhouette
                : images.maleSilhouette),
        };
      });
      const newCache = { ...cache, ...map };
      try { await Storage.setItem(PROFILES_CACHE_KEY, JSON.stringify(newCache)); } catch {}
      cache = newCache;
    }

    uniqueIds.forEach(id => { const entry = cache[id]; if (entry) map[id] = entry; });
    if (Object.keys(map).length > 0) setProfilesById(prev => ({ ...prev, ...map }));
  };

  const formatChatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (diffMs < oneDayMs) {
        // HH:mm in 24-hour format
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      // e.g., 3 Aug 25
      const day = d.getDate();
      const month = d.toLocaleString(undefined, { month: 'short' });
      const year = String(d.getFullYear()).slice(-2);
      return `${day} ${month} ${year}`;
    } catch {
      return iso;
    }
  };

  const loadAll = async (isLoadMore: boolean = false) => {
    try {
      // ensure my user id
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setMyUserId(user?.id || null);
      } catch {}
      if (isLoadMore) {
        setIsFetchingMore(true);
      } else {
        // Load from cache first for instant render and avoid flashing the loading state
        let usedCache = false;
        try {
          const cached = await Storage.getItem(CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.incoming) setIncoming(parsed.incoming);
            if (parsed.outgoing) setOutgoing(parsed.outgoing);
            if (parsed.approved) setApproved(parsed.approved);
            if (parsed.profilesById) setProfilesById(parsed.profilesById);
            setLoading(false);
            usedCache = true;
          }
        } catch {}
        if (!usedCache && incoming.length === 0 && outgoing.length === 0 && approved.length === 0) {
          setLoading(true);
        }
      }
      
      const offset = isLoadMore ? (page + 1) * PAGE_SIZE : 0;
      const [inc, out, appr] = await Promise.all([
        InterestsService.listIncoming({ limit: PAGE_SIZE, offset }),
        InterestsService.listOutgoing({ limit: PAGE_SIZE, offset }),
        InterestsService.listApproved({ limit: PAGE_SIZE, offset }),
      ]);
      
      if (isLoadMore) {
        setIncoming(prev => [...prev, ...inc]);
        setOutgoing(prev => [...prev, ...out]);
        setApproved(prev => [...prev, ...appr]);
        setPage(prev => prev + 1);
        setHasMore(inc.length === PAGE_SIZE || out.length === PAGE_SIZE || appr.length === PAGE_SIZE);
      } else {
        setIncoming(inc);
        setOutgoing(out);
        setApproved(appr);
        setPage(0);
        setHasMore(inc.length === PAGE_SIZE || out.length === PAGE_SIZE || appr.length === PAGE_SIZE);
      }
      
      // Load user profiles to enrich rows
      const ids: string[] = [];
      inc.forEach(r => ids.push(r.sender_id));
      out.forEach(r => ids.push(r.receiver_id));
      appr.forEach(r => { ids.push(r.sender_id, r.receiver_id); });
      await loadProfiles(ids);
      
      // Cache for instant next load
      if (!isLoadMore) {
        try {
          await Storage.setItem(CACHE_KEY, JSON.stringify({
            incoming: inc, outgoing: out, approved: appr, profilesById
          }));
        } catch {}
      }
    } finally {
      if (isLoadMore) {
        setIsFetchingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const refreshPage = async () => {
    try {
      setLoading(true);
      setPage(0);
      await loadAll(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptClick = (interest: InterestRecord) => {
    setSelectedInterest(interest);
    setShowAcceptModal(true);
  };

  const confirmAccept = async () => {
    if (!selectedInterest) return;
    await InterestsService.accept(selectedInterest.id);
    await loadAll();
    setIndex(2); // Switch to Approved tab
    setSelectedInterest(null);
  };

  const reject = async (id: string) => {
    await InterestsService.reject(id);
    await loadAll(); // Will disappear from pending lists automatically
  };

  const withdraw = async (id: string) => {
    await InterestsService.withdraw(id);
    await loadAll();
  };

  const cancelApproved = async (id: string) => {
    await InterestsService.cancel(id);
    await loadAll();
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Refresh when tab/screen gains focus
  useEffect(() => {
    if (isFocused) {
      loadAll();
    }
  }, [isFocused]);

  // Mark approved interests as seen whenever the Approved tab becomes active
  useEffect(() => {
    if (index === 2) {
      SecureStore.setItemAsync('LAST_SEEN_APPROVED_INTERESTS', new Date().toISOString()).catch(() => {});
    }
  }, [index]);

  // Keep tab titles in sync with counts and translate
  useEffect(() => {
    setRoutes([
      { key: 'received', title: t('interests.tabs.received_with_count', { count: incoming.length }) },
      { key: 'sent', title: t('interests.tabs.sent_with_count', { count: outgoing.length }) },
      { key: 'approved', title: t('interests.tabs.approved_with_count', { count: approved.length }) },
    ]);
  }, [incoming.length, outgoing.length, approved.length, t]);

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: COLORS.primary }}
      style={{ backgroundColor: COLORS.white }}
      activeColor={COLORS.primary}
      inactiveColor={COLORS.greyscale900}
      renderLabel={({ route, focused }: any) => {
        let count = 0;
        if (route.key === 'received') count = incoming.length;
        else if (route.key === 'sent') count = outgoing.length;
        else if (route.key === 'approved') count = approved.length;
        const label = route.title;
        return (
          <Text style={{ color: focused ? COLORS.primary : 'gray', fontSize: 16, fontFamily: 'bold' }}>{label}</Text>
        );
      }}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <Image source={images.logo} contentFit='contain' style={styles.headerLogo} />
        <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>{t('interests.header_photo_requests')}</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={refreshPage} style={{ padding: 8, borderRadius: 20, marginLeft: 8 }}>
          <Image source={icons.refresh} contentFit='contain' style={{ width: 24, height: 24, tintColor: COLORS.greyscale900 }} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const SkeletonRow = ({ idx }: { idx: number }) => (
    <View style={[styles.userContainer, idx % 2 !== 0 ? styles.oddBackground : null]}>
      <View style={styles.userImageContainer}>
        <View style={[styles.userImage, { backgroundColor: '#eee' }]} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
        <View style={{ height: 14, width: '40%', backgroundColor: '#eee', borderRadius: 6 }} />
        <View style={{ height: 12, width: '60%', backgroundColor: '#f2f2f2', borderRadius: 6 }} />
      </View>
    </View>
  );

  const ReceivedRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => (<SkeletonRow key={i} idx={i} />))}
        </>
      ) : (
        <>
          {incoming.length === 0 ? (
            <Text style={styles.subtitle}>{t('interests.empty.received')}</Text>
          ) : (
            incoming.map((row, idx) => {
              const otherUserId = row.sender_id;
              const other = profilesById[otherUserId];
              return (
                <View key={row.id} style={[styles.userContainer, idx % 2 !== 0 ? styles.oddBackground : null]}>
                  <TouchableOpacity style={styles.userImageContainer} onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                    <Image
                      source={other?.avatar ? (typeof other.avatar === 'string' ? { uri: other.avatar } : other.avatar) : images.maleSilhouette}
                      contentFit='cover'
                      style={styles.userImage}
                    />
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', width: SIZES.width - 104 }}>
                    <View style={styles.userInfoContainer}>
                      <TouchableOpacity onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                        <Text style={[styles.userName, { color: COLORS.greyscale900 }]}>
                          {other?.name || otherUserId}{other?.age ? `, ${other.age}` : ''}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]} onPress={() => handleAcceptClick(row)}>
                          <Text style={styles.tinyBtnText}>{t('interests.actions.accept')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => reject(row.id)}>
                          <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>{t('interests.actions.reject')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ position: 'absolute', right: 4, alignItems: 'flex-end', width: SIZES.width - 16 }}>
                      <Text style={styles.lastMessageTime}>{formatChatTime(row.created_at)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );

  const SentRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => (<SkeletonRow key={i} idx={i} />))}
        </>
      ) : (
        <>
          {outgoing.length === 0 ? (
            <Text style={styles.subtitle}>{t('interests.empty.sent')}</Text>
          ) : (
            outgoing.map((row, idx) => {
              const otherUserId = row.receiver_id;
              const other = profilesById[otherUserId];
              return (
                <View key={row.id} style={[styles.userContainer, idx % 2 !== 0 ? styles.oddBackground : null]}>
                  <TouchableOpacity style={styles.userImageContainer} onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                    <Image
                      source={other?.avatar ? (typeof other.avatar === 'string' ? { uri: other.avatar } : other.avatar) : images.maleSilhouette}
                      contentFit='cover'
                      style={styles.userImage}
                      blurRadius={10}
                    />
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', width: SIZES.width - 104 }}>
                    <View style={styles.userInfoContainer}>
                      <TouchableOpacity onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                        <Text style={[styles.userName, { color: COLORS.greyscale900 }]}>
                          {other?.name || otherUserId}{other?.age ? `, ${other.age}` : ''}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => withdraw(row.id)}>
                          <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>{t('interests.actions.withdraw')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ position: 'absolute', right: 4, alignItems: 'flex-end', width: SIZES.width - 16 }}>
                      <Text style={styles.lastMessageTime}>{formatChatTime(row.created_at)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );

  const ApprovedRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => (<SkeletonRow key={i} idx={i} />))}
        </>
      ) : (
        <>
          {approved.length === 0 ? (
            <Text style={styles.subtitle}>{t('interests.empty.approved')}</Text>
          ) : (
            approved.map((row, idx) => {
              const otherUserId = myUserId && row.sender_id === myUserId ? row.receiver_id : row.sender_id;
              const other = profilesById[otherUserId];
              const meetDisabled = !!meetButtonDisabledByUser[otherUserId];
              return (
                <View key={row.id} style={[styles.userContainer, idx % 2 !== 0 ? styles.oddBackground : null]}>
                  <TouchableOpacity style={styles.userImageContainer} onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                    <Image source={other?.avatar ? (typeof other.avatar === 'string' ? { uri: other.avatar } : other.avatar) : images.maleSilhouette} contentFit='cover' style={styles.userImage} />
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', width: SIZES.width - 104 }}>
                    <View style={styles.userInfoContainer}>
                      <TouchableOpacity onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                        <Text style={[styles.userName, { color: COLORS.greyscale900 }]}>
                          {other?.name || otherUserId}{other?.age ? `, ${other.age}` : ''}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.rowActions}>
                        {/* Blinking Meet button - navigate only */}
                        <Animated.View style={{ opacity: stylesBlink.opacity, marginRight: 8 }}>
                          <TouchableOpacity
                            style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]}
                            onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}
                          >
                            <Text style={styles.tinyBtnText}>{t('interests.actions.meet')}</Text>
                          </TouchableOpacity>
                        </Animated.View>
                        <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => cancelApproved(row.id)}>
                          <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>{t('interests.actions.cancel')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ position: 'absolute', right: 4, alignItems: 'flex-end', width: SIZES.width - 16 }}>
                      <Text style={styles.lastMessageTime}>{formatChatTime(row.updated_at)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );

  const renderScene = SceneMap({
    received: ReceivedRoute,
    sent: SentRoute,
    approved: ApprovedRoute,
  });

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
        />
        {/* Blinking handled via shared Animated.Value (no component needed) */}
        
        {/* Accept Confirmation Modal */}
        <AcceptConfirmationModal
          visible={showAcceptModal}
          onClose={() => {
            setShowAcceptModal(false);
            setSelectedInterest(null);
          }}
          onAccept={confirmAccept}
          userName={selectedInterest ? (profilesById[selectedInterest.sender_id]?.name || t('interests.member')) : ''}
          userAge={selectedInterest ? (profilesById[selectedInterest.sender_id]?.age || 0) : 0}
          requestType="photo"
        />
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
    backgroundColor: COLORS.white,
    padding: 16
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: SIZES.width - 32,
    justifyContent: "space-between"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerLogo: {
    height: 36,
    width: 36,
    tintColor: COLORS.primary
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.black,
    marginLeft: 12
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center"
  },
  searchIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black
  },
  moreCircleIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black,
    marginLeft: 12
  },
  title: {
    fontSize: 24,
    fontFamily: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginVertical: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.black,
    textAlign: 'center',
    marginVertical: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tabChip: {
    borderWidth: 1,
    borderColor: COLORS.greyscale300,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.black,
    fontFamily: 'medium',
  },
  tabTextActive: {
    color: COLORS.white,
    fontFamily: 'semiBold',
  },
  rowItem: {
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  userContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: COLORS.secondaryWhite,
    borderBottomWidth: 1,
  },
  userImageContainer: {
    paddingVertical: 15,
    marginRight: 22,
  },
  userImage: {
    height: 50,
    width: 50,
    borderRadius: 25,
  },
  oddBackground: {
    backgroundColor: COLORS.tertiaryWhite,
  },
  userName: {
    fontSize: 14,
    color: COLORS.black,
    fontFamily: 'bold',
    marginBottom: 8,
  },
  lastMessageTime: {
    fontSize: 12,
    fontFamily: 'regular',
    color: COLORS.black,
  },
  userInfoContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: 'medium',
    color: COLORS.greyscale900,
    marginBottom: 8,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: '48%',
    borderRadius: 32,
  },
  tinyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tinyBtnText: {
    fontSize: 12,
    color: COLORS.white,
    fontFamily: 'semiBold',
  }
});

export default InterestsScreen;


