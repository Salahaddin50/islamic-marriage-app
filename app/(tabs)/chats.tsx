import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView, Linking, Modal } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { COLORS, SIZES, icons, images } from '@/constants';
import { Image } from 'expo-image';
import { MessageRequestsService, MessageRequestRecord } from '@/src/services/message-requests.service';
import { supabase } from '@/src/config/supabase';
import { useNavigation } from 'expo-router';
import { NavigationProp, useIsFocused } from '@react-navigation/native';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';

// Define the types for the route and focused props
interface TabRoute {
  key: string;
  title: string;
}

interface RenderLabelProps {
  route: TabRoute;
  focused: boolean;
}

const Messages = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const isFocused = useIsFocused();
  const layout = useWindowDimensions();
  const { t } = useTranslation();

  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    { key: 'received', title: t('messages.tabs.received_with_count', { count: 0 }) },
    { key: 'sent', title: t('messages.tabs.sent_with_count', { count: 0 }) },
    { key: 'approved', title: t('messages.tabs.approved_with_count', { count: 0 }) },
  ]);

  const [incoming, setIncoming] = useState<MessageRequestRecord[]>([]);
  const [outgoing, setOutgoing] = useState<MessageRequestRecord[]>([]);
  const [approved, setApproved] = useState<MessageRequestRecord[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, { name: string; avatar?: any; phone?: string }>>({});
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const CACHE_KEY = 'hume_messages_cache_v1';

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
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // Accept-oath modal state
  const [showAcceptInfoModal, setShowAcceptInfoModal] = useState(false);
  const [acceptOathConfirmed, setAcceptOathConfirmed] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MessageRequestRecord | null>(null);

  const sanitizePhone = (phoneCode?: string | null, mobile?: string | null): string | undefined => {
    if (!mobile) return undefined;
    const ccDigits = (phoneCode || '').replace(/\D/g, '');
    let localDigits = (mobile || '').replace(/\D/g, '');
    // If the local number already includes the country code, strip it
    if (ccDigits && localDigits.startsWith(ccDigits)) {
      localDigits = localDigits.slice(ccDigits.length);
    }
    // Remove any leading trunk zeros from the local number (e.g., 050... -> 50...)
    localDigits = localDigits.replace(/^0+/, '');
    const combined = `${ccDigits}${localDigits}`;
    return combined.length > 6 ? combined : undefined;
  };

  const PROFILES_CACHE_KEY = 'hume_profiles_cache_v1';

  const loadProfiles = async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;
    // 1) Read cache
    let cache: Record<string, { name: string; avatar?: any; phone?: string }> = {};
    try {
      const raw = await Storage.getItem(PROFILES_CACHE_KEY);
      if (raw) cache = JSON.parse(raw) || {};
    } catch {}

    const toFetch = uniqueIds.filter(id => !cache[id] || cache[id].phone === undefined);
    const map: Record<string, { name: string; avatar?: any; phone?: string }> = {};

    if (toFetch.length > 0) {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, profile_picture_url, gender, phone_code, mobile_number')
        .in('user_id', toFetch);
      (data || []).forEach((row: any) => {
        const name = (row.first_name || 'Member').toString();
        map[row.user_id] = {
          name,
          avatar: row.profile_picture_url
            ? row.profile_picture_url
            : (row.gender && typeof row.gender === 'string' && row.gender.toLowerCase() === 'female'
                ? images.femaleSilhouette
                : images.maleSilhouette),
          phone: sanitizePhone(row.phone_code, row.mobile_number),
        };
      });
      const newCache = { ...cache, ...map };
      try { await Storage.setItem(PROFILES_CACHE_KEY, JSON.stringify(newCache)); } catch {}
      cache = newCache;
    }

    uniqueIds.forEach(id => {
      const entry = cache[id];
      if (entry) map[id] = entry;
    });

    if (Object.keys(map).length > 0) setProfilesById(prev => ({ ...prev, ...map }));
  };

  const loadAll = async (isLoadMore: boolean = false) => {
    try {
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
            if (parsed.myUserId) setMyUserId(parsed.myUserId);
            setLoading(false);
            usedCache = true;
          }
        } catch {}
        if (!usedCache && incoming.length === 0 && outgoing.length === 0 && approved.length === 0) {
          setLoading(true);
        }
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      setMyUserId(user?.id || null);
      
      const offset = isLoadMore ? (page + 1) * PAGE_SIZE : 0;
      const [inc, out, appr] = await Promise.all([
        MessageRequestsService.listIncoming({ limit: PAGE_SIZE, offset }),
        MessageRequestsService.listOutgoing({ limit: PAGE_SIZE, offset }),
        MessageRequestsService.listApproved({ limit: PAGE_SIZE, offset }),
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
      
      const ids: string[] = [];
      inc.forEach(r => ids.push(r.sender_id));
      out.forEach(r => ids.push(r.receiver_id));
      appr.forEach(r => { ids.push(r.sender_id, r.receiver_id); });
      await loadProfiles(ids);
      
      // Cache for instant next load
      if (!isLoadMore) {
        try {
          await Storage.setItem(CACHE_KEY, JSON.stringify({
            incoming: inc, outgoing: out, approved: appr, profilesById, myUserId: user?.id
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
      // Hard reset lists and cache before reloading
      setIncoming([]);
      setOutgoing([]);
      setApproved([]);
      setProfilesById({});
      setPage(0);
      setHasMore(true);
      try { await Storage.setItem(CACHE_KEY, JSON.stringify({})); } catch {}
      await loadAll(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => { if (isFocused) loadAll(); }, [isFocused]);

  useEffect(() => {
    const ch = supabase
      .channel('messages-message-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_requests' }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    setRoutes([
      { key: 'received', title: t('messages.tabs.received_with_count', { count: incoming.length }) },
      { key: 'sent', title: t('messages.tabs.sent_with_count', { count: outgoing.length }) },
      { key: 'approved', title: t('messages.tabs.approved_with_count', { count: approved.length }) },
    ]);
  }, [incoming.length, outgoing.length, approved.length, t]);

  const Row = ({ row, idx, otherUserId, rightContent }: { row: MessageRequestRecord; idx: number; otherUserId: string; rightContent?: React.ReactNode }) => {
    const other = profilesById[otherUserId];
    return (
      <View key={row.id} style={[styles.userContainer, idx % 2 !== 0 ? styles.oddBackground : null]}>
        <TouchableOpacity style={styles.userImageContainer} onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
          <Image source={other?.avatar ? (typeof other.avatar === 'string' ? { uri: other.avatar } : other.avatar) : images.maleSilhouette} contentFit='cover' style={styles.userImage} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', width: SIZES.width - 104 }}>
          <View style={styles.userInfoContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
              <Text style={[styles.userName, { color: COLORS.greyscale900 }]}>
                {other?.name || otherUserId}
              </Text>
            </TouchableOpacity>
            <View style={styles.rowActions}>
              {rightContent}
            </View>
          </View>
        </View>
      </View>
    );
  };

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
      ) : incoming.length === 0 ? (
        <Text style={styles.subtitle}>{t('messages.empty.received')}</Text>
      ) : (
        incoming.map((row, idx) => (
          <Row
            key={row.id}
            row={row}
            idx={idx}
            otherUserId={row.sender_id}
            rightContent={
              <>
                <TouchableOpacity
                  style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]}
                  onPress={() => {
                    setSelectedRequest(row);
                    setAcceptOathConfirmed(false);
                    setShowAcceptInfoModal(true);
                  }}
                >
                  <Text style={styles.tinyBtnText}>{t('messages.actions.accept')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={async () => { await MessageRequestsService.reject(row.id); await loadAll(); }}>
                  <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>{t('messages.actions.reject')}</Text>
                </TouchableOpacity>
              </>
            }
          />
        ))
      )}
    </ScrollView>
  );

  const SentRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => (<SkeletonRow key={i} idx={i} />))}
        </>
      ) : outgoing.length === 0 ? (
        <Text style={styles.subtitle}>{t('messages.empty.sent')}</Text>
      ) : (
        outgoing.map((row, idx) => (
          <Row
            key={row.id}
            row={row}
            idx={idx}
            otherUserId={row.receiver_id}
            rightContent={
              <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={async () => { await MessageRequestsService.cancel(row.id); await loadAll(); }}>
                <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>{t('messages.actions.withdraw')}</Text>
              </TouchableOpacity>
            }
          />
        ))
      )}
    </ScrollView>
  );

  const ApprovedRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => (<SkeletonRow key={i} idx={i} />))}
        </>
      ) : approved.length === 0 ? (
        <Text style={styles.subtitle}>{t('messages.empty.approved')}</Text>
      ) : (
        approved.map((row, idx) => {
          const otherUserId = myUserId && row.sender_id === myUserId ? row.receiver_id : row.sender_id;
          const other = profilesById[otherUserId];
          const phoneDigits = other?.phone;
          return (
            <Row
              key={row.id}
              row={row}
              idx={idx}
              otherUserId={otherUserId}
              rightContent={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]}
                    disabled={!phoneDigits}
                    onPress={() => {
                      if (!phoneDigits) return;
                      const url = `https://wa.me/${phoneDigits}`;
                      Linking.openURL(url).catch(() => {});
                    }}
                  >
                    <Text style={styles.tinyBtnText}>{phoneDigits ? t('messages.actions.whatsapp') : t('messages.no_number')}</Text>
                  </TouchableOpacity>
                  {phoneDigits && (
                    <Text style={[styles.lastMessageTime, { color: COLORS.greyscale900 }]}>{`+${phoneDigits}`}</Text>
                  )}
                </View>
              }
            />
          );
        })
      )}
    </ScrollView>
  );

  const renderScene = SceneMap({ received: ReceivedRoute, sent: SentRoute, approved: ApprovedRoute });

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: COLORS.primary }}
      style={{ backgroundColor: COLORS.white }}
      activeColor={COLORS.primary}
      inactiveColor={COLORS.greyscale900}
      renderLabel={({ route, focused }: RenderLabelProps) => (
        <Text style={{ color: focused ? COLORS.primary : 'gray', fontSize: 16, fontFamily: 'bold' }}>{route.title}</Text>
      )}
    />
  );

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Image source={icons.chat} contentFit='contain' style={[styles.headerLogo, {tintColor: COLORS.primary}]} />
          <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>{t('messages.header_title')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={refreshPage} style={{ padding: 8, borderRadius: 20, marginLeft: 8 }}>
            <Image source={icons.refresh} contentFit='contain' style={{ width: 24, height: 24, tintColor: COLORS.greyscale900 }} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

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

        {/* Accept Oath Modal */}
        <Modal
          visible={showAcceptInfoModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAcceptInfoModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('messages.accept_modal.title')}</Text>

              <View style={styles.infoStepContainer}> 
                <View style={styles.infoStepNumberContainer}>
                  <Text style={styles.infoStepNumber}>1</Text>
                </View>
                <Text style={styles.infoStepText}>{t('messages.accept_modal.oath_text')}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setAcceptOathConfirmed(prev => !prev)}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                  backgroundColor: acceptOathConfirmed ? COLORS.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                  {acceptOathConfirmed && (
                    <Text style={{ color: COLORS.white, fontFamily: 'bold', fontSize: 14 }}>✓</Text>
                  )}
                </View>
                <Text style={[styles.infoStepText, { flex: 1 }]}>{t('messages.accept_modal.yes_i_swear')}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.infoButton, styles.cancelButton]}
                  onPress={() => setShowAcceptInfoModal(false)}
                >
                  <Text style={[styles.infoButtonText, { color: COLORS.primary }]}>{t('messages.accept_modal.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.infoButton, styles.confirmButton, !acceptOathConfirmed && { opacity: 0.6 }]}
                  onPress={async () => {
                    if (!acceptOathConfirmed || !selectedRequest) return;
                    try {
                      await MessageRequestsService.accept(selectedRequest.id);
                      setShowAcceptInfoModal(false);
                      setAcceptOathConfirmed(false);
                      setSelectedRequest(null);
                      await loadAll();
                    } catch {}
                  }}
                >
                  <Text style={styles.infoButtonText}>{t('messages.actions.accept')}</Text>
        </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  subtitle: {
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.black,
    textAlign: 'center',
    marginVertical: 12,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  oddBackground: {
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  userImageContainer: {
    marginRight: 12,
  },
  userImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  userInfoContainer: {
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'bold',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  lastMessageTime: {
    fontSize: 12,
    fontFamily: 'regular',
    color: COLORS.grayscale700,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  infoStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoStepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoStepNumber: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'bold',
  },
  infoStepText: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.greyscale900,
    flex: 1,
  },
  infoButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: COLORS.tansparentPrimary,
    borderColor: COLORS.primary,
    borderWidth: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  infoButtonText: {
    fontSize: 16,
    fontFamily: 'bold',
    color: COLORS.white,
  },
})

export default Messages