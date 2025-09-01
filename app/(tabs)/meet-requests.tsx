import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Linking, Alert, Modal, Vibration } from 'react-native';
import { COLORS, SIZES, images, icons } from '@/constants';
import { Image } from 'expo-image';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { MeetService, MeetRecord } from '@/src/services/meet';
import { supabase } from '@/src/config/supabase';
import { useNavigation } from 'expo-router';
import { NavigationProp, useIsFocused } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const MeetRequestsScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const isFocused = useIsFocused();
  const [incoming, setIncoming] = useState<MeetRecord[]>([]);
  const [outgoing, setOutgoing] = useState<MeetRecord[]>([]);
  const [approved, setApproved] = useState<MeetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    { key: 'received', title: 'Received (0)' },
    { key: 'sent', title: 'Sent (0)' },
    { key: 'approved', title: 'Approved (0)' },
  ]);

  const [profilesById, setProfilesById] = useState<Record<string, { name: string; avatar?: any }>>({});
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const CACHE_KEY = 'hume_meet_requests_cache_v1';

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
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [showJoinInfoModal, setShowJoinInfoModal] = useState(false);
  const [selectedMeetRow, setSelectedMeetRow] = useState<MeetRecord | null>(null);
  const [showJitsiModal, setShowJitsiModal] = useState(false);
  const [jitsiHtml, setJitsiHtml] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState<string>('');
  const [showRingModal, setShowRingModal] = useState(false);
  const [ringMeetRow, setRingMeetRow] = useState<MeetRecord | null>(null);
  const [ringDismissedIds, setRingDismissedIds] = useState<Set<string>>(new Set());
  const [highlightMeetId, setHighlightMeetId] = useState<string | null>(null);
  const [blinkOn, setBlinkOn] = useState(false);
  const [ringMuted, setRingMuted] = useState<boolean>(false);
  const ringAudioRef = React.useRef<any>(null);
  const ringNativeRef = React.useRef<any>(null);
  const RING_SOUND_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-old-telephone-ring-135.mp3';
  const RING_MUTE_KEY = 'HUME_RING_MUTED';
  const WEB_SOUND_ENABLED_KEY = 'HUME_WEB_SOUND_ENABLED';
  const [webSoundEnabled, setWebSoundEnabled] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await SecureStore.getItemAsync(RING_MUTE_KEY);
        if (v === '1') setRingMuted(true);
        if (Platform.OS === 'web') {
          const s = (typeof window !== 'undefined') ? window.localStorage.getItem(WEB_SOUND_ENABLED_KEY) : null;
          setWebSoundEnabled(s === '1');
        }
      } catch {}
    })();
  }, []);

  // Blinking effect runs while any approved row is within the ring window
  useEffect(() => {
    const anyInWindow = approved?.some(r => isWithinRingWindow(r.scheduled_at));
    if (!anyInWindow) {
      setBlinkOn(false);
      return;
    }
    const id = setInterval(() => setBlinkOn(prev => !prev), 600);
    return () => clearInterval(id);
  }, [approved, nowTick]);

  const formatRequestTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (diffMs < oneDayMs) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString(undefined, { month: 'short' });
      const year = String(d.getFullYear()).slice(-2);
      return `${day} ${month} ${year}`;
    } catch {
      return iso;
    }
  };

  const loadProfiles = async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, profile_picture_url, gender')
      .in('user_id', uniqueIds);
    const map: Record<string, { name: string; avatar?: any }> = {};
    (data || []).forEach((row: any) => {
      const name = (row.first_name || 'Member').toString();
      map[row.user_id] = {
        name,
        avatar: row.profile_picture_url
          ? row.profile_picture_url
          : (row.gender && typeof row.gender === 'string' && row.gender.toLowerCase() === 'female'
              ? images.femaleSilhouette
              : images.maleSilhouette),
      };
    });
    setProfilesById(prev => ({ ...prev, ...map }));
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
        MeetService.listIncoming({ limit: PAGE_SIZE, offset }),
        MeetService.listOutgoing({ limit: PAGE_SIZE, offset }),
        MeetService.listApproved({ limit: PAGE_SIZE, offset }),
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

  const accept = async (id: string) => {
    await MeetService.accept(id);
    await loadAll();
    setIndex(2);
  };

  const reject = async (id: string) => {
    await MeetService.reject(id);
    await loadAll();
  };

  const withdraw = async (id: string) => {
    await MeetService.cancel(id);
    await loadAll();
  };

  useEffect(() => { loadAll(); }, []);

  // Prefetch display name for Jitsi auto-join
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('user_profiles')
          .select('first_name,last_name')
          .eq('user_id', user.id)
          .maybeSingle();
        const dn = [data?.first_name, data?.last_name].filter(Boolean).join(' ').trim();
        setMyDisplayName(dn || 'Guest');
      } catch {}
    })();
  }, []);

  const buildJitsiHtml = (meetLink: string, displayName: string) => {
    const roomName = (() => { try { return new URL(meetLink).pathname.replace(/^\//, ''); } catch { return meetLink.split('/').pop() || ''; } })();
    const safeName = (displayName || 'Guest').replace(/'/g, "\'");
    return `<!DOCTYPE html><html><head><meta name=viewport content="width=device-width, height=device-height, initial-scale=1, maximum-scale=1, user-scalable=no" /><script src="https://meet.jit.si/external_api.js"></script><style>html,body,#j{margin:0;padding:0;height:100%;width:100%;background:#000;overflow:hidden}</style></head><body><div id=j></div><script>const api=new JitsiMeetExternalAPI('meet.jit.si',{roomName:'${roomName}',parentNode:document.getElementById('j'),userInfo:{displayName:'${safeName}'},configOverwrite:{prejoinPageEnabled:false,disableDeepLinking:true,startWithAudioMuted:false,startWithVideoMuted:false,toolbarButtons:['microphone','camera','hangup'],enableWelcomePage:false,defaultLanguage:'en',disable1On1Mode:false,enableClosePage:false},interfaceConfigOverwrite:{MOBILE_APP_PROMO:false,HIDE_INVITE_MORE_HEADER:true,TOOLBAR_BUTTONS:['microphone','camera','hangup'],DISABLE_JOIN_LEAVE_NOTIFICATIONS:true}});api.executeCommand('toggleTileView', false);api.addEventListener('videoConferenceJoined',function(){try{document.body.style.background='#000';}catch(e){}});api.addEventListener('videoConferenceLeft',function(){if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage){window.ReactNativeWebView.postMessage('left');}});</script></body></html>`;
  };

  // Refresh when tab/screen gains focus
  useEffect(() => {
    if (isFocused) {
      loadAll();
    }
  }, [isFocused]);

  // Tick every minute for enabling join 10 minutes before
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  
  // Format meeting date in the required format: "14 Sep 25"
  const formatMeetingDate = (iso?: string | null): string => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString(undefined, { month: 'short' });
      const year = String(d.getFullYear()).slice(-2);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} at ${hours}:${minutes}`;
    } catch {
      return '';
    }
  };
  
  // Helper function to check if it's time to join a meeting
  const isTimeToJoin = (scheduledAt: string | null): boolean => {
    if (!scheduledAt) return false;
    try {
      const scheduledMs = new Date(scheduledAt).getTime();
      return !Number.isNaN(scheduledMs) && (nowTick >= (scheduledMs - 10 * 60 * 1000));
    } catch {
      return false;
    }
  };

  // Helper: ring window = 10 minutes before until 1 hour after start
  const isWithinRingWindow = (scheduledAt: string | null): boolean => {
    if (!scheduledAt) return false;
    try {
      const scheduledMs = new Date(scheduledAt).getTime();
      if (Number.isNaN(scheduledMs)) return false;
      const startWindow = scheduledMs - 10 * 60 * 1000; // 10 min before
      const endWindow = scheduledMs + 60 * 60 * 1000;   // 1 hour after start
      return nowTick >= startWindow && nowTick <= endWindow;
    } catch {
      return false;
    }
  };

  // Ring when any approved meeting is joinable
  useEffect(() => {
    try {
      const joinable = approved.find(r => r.meet_link && isWithinRingWindow(r.scheduled_at) && !ringDismissedIds.has(r.id));
      if (isFocused && joinable) {
        setRingMeetRow(joinable);
        setShowRingModal(true);
        // Web ring sound only (native uses hidden web audio iframe below)
        (async () => {
          try {
            if (!ringMuted && Platform.OS === 'web' && webSoundEnabled) {
              if (ringAudioRef.current) {
                try { ringAudioRef.current.pause(); } catch {}
                ringAudioRef.current = null;
              }
              const audio = new (window as any).Audio(RING_SOUND_URL);
              audio.loop = true;
              await audio.play().catch(() => {});
              ringAudioRef.current = audio;
            }
          } catch {}
        })();
        // Native vibration loop (web may ignore)
        if (Platform.OS !== 'web') {
          Vibration.vibrate([500, 400, 500, 800], true);
        }
      }
      // If outside window while modal is showing, dismiss
      if (showRingModal && ringMeetRow && !isWithinRingWindow(ringMeetRow.scheduled_at)) {
        setShowRingModal(false);
        if (Platform.OS !== 'web') Vibration.cancel();
        if (ringAudioRef.current) { try { ringAudioRef.current.pause(); ringAudioRef.current = null; } catch {} }
        setRingMeetRow(null);
      }
    } catch {}
    return () => {
      if (Platform.OS !== 'web') {
        Vibration.cancel();
      }
      if (ringAudioRef.current) {
        try { ringAudioRef.current.pause(); ringAudioRef.current.currentTime = 0; } catch {}
        ringAudioRef.current = null;
      }
    };
  }, [approved, nowTick, isFocused]);

  useEffect(() => {
    const ch = supabase
      .channel('meet-requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meet_requests' }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Mark approved meets as seen whenever the Approved tab becomes active
  useEffect(() => {
    if (index === 2) {
      SecureStore.setItemAsync('LAST_SEEN_APPROVED_MEETS', new Date().toISOString()).catch(() => {});
    }
  }, [index]);

  useEffect(() => {
    setRoutes([
      { key: 'received', title: `Received (${incoming.length})` },
      { key: 'sent', title: `Sent (${outgoing.length})` },
      { key: 'approved', title: `Approved (${approved.length})` },
    ]);
  }, [incoming.length, outgoing.length, approved.length]);

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: COLORS.primary }}
      style={{ backgroundColor: COLORS.white }}
      activeColor={COLORS.primary}
      inactiveColor={COLORS.greyscale900}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <Image source={icons.videoCamera2} contentFit='contain' style={[styles.headerLogo, {tintColor: COLORS.primary}]} />
        <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>Meet Requests</Text>
      </View>
      <View style={styles.headerRight}>
        {Platform.OS === 'web' && !webSoundEnabled && (
          <TouchableOpacity
            onPress={() => {
              try {
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem(WEB_SOUND_ENABLED_KEY, '1');
                }
                setWebSoundEnabled(true);
              } catch {}
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: COLORS.primary,
              backgroundColor: COLORS.tansparentPrimary,
            }}
          >
            <Text style={{ color: COLORS.primary, fontFamily: 'medium' }}>Enable sound</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const Row = ({ row, idx, otherUserId, scheduledText, scheduledAtISO, requestText, actions, hideInlineJoin }: { row: MeetRecord; idx: number; otherUserId: string; scheduledText?: string; scheduledAtISO?: string | null; requestText?: string; actions: React.ReactNode; hideInlineJoin?: boolean }) => {
    const other = profilesById[otherUserId];
    const scheduledMs = scheduledAtISO ? new Date(scheduledAtISO).getTime() : NaN;
    const canJoin = !!row.meet_link && !Number.isNaN(scheduledMs) && (nowTick >= (scheduledMs - 10 * 60 * 1000));
    return (
      <View key={row.id} style={[
        styles.userContainer,
        idx % 2 !== 0 ? styles.oddBackground : null,
        (isWithinRingWindow(scheduledAtISO || null)) ? { backgroundColor: blinkOn ? 'rgba(255,215,0,0.15)' : 'rgba(255,215,0,0.35)' } : null,
      ]}>
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
              {actions}
              {!!scheduledText && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Image source={icons.videoCamera2} contentFit='contain' style={{ width: 14, height: 14, tintColor: COLORS.primary }} />
                  <Text style={styles.lastMessageTime}>{scheduledText}</Text>
                  {!hideInlineJoin && row.meet_link && (
                    <TouchableOpacity
                      onPress={() => {
                        if (canJoin) { Linking.openURL(row.meet_link as string); }
                        else { Alert.alert('Meeting not active yet', 'Join link will be active 10 minutes before the scheduled time.'); }
                      }}
                      disabled={!canJoin}
                    >
                      <Text style={[styles.joinLink, !canJoin && { color: 'gray', opacity: 0.7 }]}>Join</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
          <View style={{ position: 'absolute', right: 4, alignItems: 'flex-end', width: SIZES.width - 16 }}>
            {!!requestText && (
              <Text style={styles.lastMessageTime}>{requestText}</Text>
            )}
            {/* Join link moved next to scheduled time */}
          </View>
        </View>
      </View>
    );
  };

  const ReceivedRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <Text style={styles.subtitle}>Loading…</Text>
      ) : incoming.length === 0 ? (
        <Text style={styles.subtitle}>No received meet requests</Text>
      ) : (
        incoming.map((row, idx) => (
          <Row
            key={row.id}
            row={row}
            idx={idx}
            otherUserId={row.sender_id}
            scheduledText={row.scheduled_at ? formatMeetingDate(row.scheduled_at) : ''}
            scheduledAtISO={row.scheduled_at || undefined}
            requestText={formatRequestTime(row.created_at)}
            actions={
              <>
                <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]} onPress={() => accept(row.id)}>
                  <Text style={styles.tinyBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => reject(row.id)}>
                  <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>Reject</Text>
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
        <Text style={styles.subtitle}>Loading…</Text>
      ) : outgoing.length === 0 ? (
        <Text style={styles.subtitle}>No sent meet requests</Text>
      ) : (
        outgoing.map((row, idx) => (
          <Row
            key={row.id}
            row={row}
            idx={idx}
            otherUserId={row.receiver_id}
            scheduledText={row.scheduled_at ? formatMeetingDate(row.scheduled_at) : ''}
            scheduledAtISO={row.scheduled_at || undefined}
            requestText={formatRequestTime(row.created_at)}
            actions={
              <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => withdraw(row.id)}>
                <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>Withdraw</Text>
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
        <Text style={styles.subtitle}>Loading…</Text>
      ) : approved.length === 0 ? (
        <Text style={styles.subtitle}>No approved meet requests</Text>
      ) : (
        approved.map((row, idx) => {
          const scheduledMs = row.scheduled_at ? new Date(row.scheduled_at).getTime() : NaN;
          const canJoin = !!row.meet_link && !Number.isNaN(scheduledMs) && (nowTick >= (scheduledMs - 10 * 60 * 1000));
          return (
            <Row
              key={row.id}
              row={row}
              idx={idx}
              otherUserId={row.sender_id}
              scheduledText={row.scheduled_at ? formatMeetingDate(row.scheduled_at) : ''}
              scheduledAtISO={row.scheduled_at || undefined}
              requestText={formatRequestTime(row.updated_at)}
              hideInlineJoin
              actions={
                <>
                  <TouchableOpacity
                    style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]}
                    onPress={() => {
                      setSelectedMeetRow(row);
                      setShowJoinInfoModal(true);
                    }}
                  >
                    <Text style={styles.tinyBtnText}>Join</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => withdraw(row.id)}>
                    <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                </>
              }
            />
          );
        })
      )}
    </ScrollView>
  );

  const renderScene = SceneMap({ received: ReceivedRoute, sent: SentRoute, approved: ApprovedRoute });

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
        
        {/* Join Meeting Info Modal */}
        <Modal
          visible={showJoinInfoModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowJoinInfoModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Video Meeting Access</Text>
              
              <View style={styles.meetingInfoContainer}>
                {selectedMeetRow?.scheduled_at && (
                  <Text style={styles.scheduledTimeText}>
                    Scheduled for: {formatMeetingDate(selectedMeetRow.scheduled_at)}
                  </Text>
                )}
                
                <View style={styles.infoRow}>
                  <Image 
                    source={icons.videoCamera2} 
                    contentFit="contain" 
                    style={{ width: 24, height: 24, tintColor: COLORS.primary, marginRight: 12 }} 
                  />
                  <Text style={styles.infoText}>
                    Meeting access is available 10 minutes before the scheduled time
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Image 
                    source={icons.clock} 
                    contentFit="contain" 
                    style={{ width: 24, height: 24, tintColor: COLORS.primary, marginRight: 12 }} 
                  />
                  <Text style={styles.infoText}>
                    {selectedMeetRow && selectedMeetRow.scheduled_at ? 
                      isTimeToJoin(selectedMeetRow.scheduled_at) ? 
                        "You can join the meeting now" : 
                        "Meeting is not yet available to join" 
                      : ""}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setShowJoinInfoModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: COLORS.primary }]}>Close</Text>
                </TouchableOpacity>
                
                {selectedMeetRow && selectedMeetRow.meet_link && isTimeToJoin(selectedMeetRow.scheduled_at) && (
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.joinButton]} 
                    onPress={() => {
                      setShowJoinInfoModal(false);
                      if (selectedMeetRow?.meet_link) {
                        const html = buildJitsiHtml(selectedMeetRow.meet_link, myDisplayName);
                        setJitsiHtml(html);
                        setShowJitsiModal(true);
                      }
                    }}
                  >
                    <Image source={icons.videoCamera2} contentFit="contain" style={{ width: 18, height: 18, tintColor: COLORS.white, marginRight: 8 }} />
                    <Text style={styles.modalButtonText}>Join Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Ring (Incoming Meeting) Modal */}
        <Modal visible={showRingModal} transparent animationType="fade" onRequestClose={() => { setShowRingModal(false); }}>
          <View style={styles.modalContainer}>
            <View style={styles.ringCard}>
              <TouchableOpacity style={styles.jitsiCloseButton} onPress={() => {
                if (ringMeetRow) {
                  setRingDismissedIds(prev => new Set(prev).add(ringMeetRow.id));
                  setHighlightMeetId(ringMeetRow.id);
                }
                setShowRingModal(false);
                setRingMeetRow(null);
                setIndex(2);
                if (Platform.OS !== 'web') Vibration.cancel();
              }}>
                <Text style={styles.jitsiCloseButtonText}>×</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <View style={styles.ringAvatarWrapper}>
                  <View style={[styles.ringPulse, blinkOn && styles.ringPulseAlt]} />
                  <View style={[styles.ringPulse, { width: 110, height: 110, opacity: 0.2 }]} />
                  <Image
                    source={ringMeetRow ? (profilesById[ringMeetRow.sender_id]?.avatar ? (typeof profilesById[ringMeetRow.sender_id].avatar === 'string' ? { uri: profilesById[ringMeetRow.sender_id].avatar } : profilesById[ringMeetRow.sender_id].avatar) : images.maleSilhouette) : images.maleSilhouette}
                    contentFit='cover'
                    style={{ width: 84, height: 84, borderRadius: 42 }}
                  />
                </View>
              </View>
              <Text style={[styles.modalTitle, { marginBottom: 6 }]}>
                {ringMeetRow ? (profilesById[ringMeetRow.sender_id]?.name || 'Incoming meeting') : 'Incoming meeting'}
              </Text>
              <Text style={[styles.infoText, { textAlign: 'center', marginBottom: 16 }]}>
                {ringMeetRow?.scheduled_at ? `Scheduled for ${formatMeetingDate(ringMeetRow.scheduled_at)}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.joinButton]}
                  onPress={() => {
                    if (!ringMeetRow?.meet_link) return;
                    setShowRingModal(false);
                    setSelectedMeetRow(ringMeetRow);
                    setShowJoinInfoModal(true);
                    if (Platform.OS !== 'web') Vibration.cancel();
                    if (ringAudioRef.current) { try { ringAudioRef.current.pause(); ringAudioRef.current = null; } catch {} }
                  }}
                >
                  <Image source={icons.videoCamera2} contentFit='contain' style={{ width: 18, height: 18, tintColor: COLORS.white, marginRight: 8 }} />
                  <Text style={styles.modalButtonText}>Join</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    if (ringMeetRow) {
                      setRingDismissedIds(prev => new Set(prev).add(ringMeetRow.id));
                      setHighlightMeetId(ringMeetRow.id);
                    }
                    setShowRingModal(false);
                    setRingMeetRow(null);
                    setIndex(2);
                    if (Platform.OS !== 'web') Vibration.cancel();
                    if (ringAudioRef.current) { try { ringAudioRef.current.pause(); ringAudioRef.current = null; } catch {} }
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: COLORS.primary }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Centered Jitsi Modal */}
        <Modal visible={showJitsiModal} transparent={true} animationType="fade" onRequestClose={() => setShowJitsiModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.jitsiCard}>
              <TouchableOpacity style={styles.jitsiCloseButton} onPress={() => setShowJitsiModal(false)}>
                <Text style={styles.jitsiCloseButtonText}>×</Text>
              </TouchableOpacity>
              <View style={styles.jitsiVideoContainer}>
              {!!jitsiHtml && (
                Platform.OS === 'web' ? (
                  <iframe
                    srcDoc={jitsiHtml as any}
                    style={{ width: '100%', height: '100%', border: 0 } as any}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                  />
                ) : (
                  <WebView
                    originWhitelist={["*"]}
                    source={{ html: jitsiHtml }}
                    onMessage={(e) => { if (e.nativeEvent.data === 'left') { setShowJitsiModal(false); } }}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    style={{ flex:1 }}
                  />
                )
              )}
            </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, backgroundColor: COLORS.white, padding: 16 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', width: SIZES.width - 32, justifyContent: 'space-between' },
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
    maxWidth: 340,
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
    marginBottom: 16,
  },
  meetingInfoContainer: {
    marginVertical: 16,
  },
  scheduledTimeText: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.greyscale900,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.greyscale900,
    flex: 1,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  jitsiCard: {
    backgroundColor: COLORS.black,
    borderRadius: 16,
    width: '100%',
    maxWidth: 900,
    height: 680,
    maxHeight: '92%',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  jitsiVideoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  jitsiCloseButton: {
    position: 'absolute',
    top: 6,
    right: 8,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jitsiCloseButtonText: {
    fontSize: 22,
    fontFamily: 'bold',
    color: COLORS.black,
    marginTop: -1,
  },
  modalButton: {
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
  joinButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'bold',
    color: COLORS.white,
  },
  ringCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  ringAvatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPulse: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.tansparentPrimary,
  },
  ringPulseAlt: {
    opacity: 0.35,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { height: 36, width: 36, tintColor: COLORS.primary },
  headerTitle: { fontSize: 20, fontFamily: 'bold', color: COLORS.black, marginLeft: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  subtitle: { fontSize: 16, fontFamily: 'regular', color: COLORS.black, textAlign: 'center', marginVertical: 12 },
  userContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', borderBottomColor: COLORS.secondaryWhite, borderBottomWidth: 1 },
  userImageContainer: { paddingVertical: 15, marginRight: 22 },
  userImage: { height: 50, width: 50, borderRadius: 25 },
  oddBackground: { backgroundColor: COLORS.tertiaryWhite },
  userInfoContainer: { flex: 1 },
  userName: { fontSize: 14, color: COLORS.black, fontFamily: 'bold', marginBottom: 8 },
  lastMessageTime: { fontSize: 12, fontFamily: 'regular', color: COLORS.black },
  joinLink: { fontSize: 16, fontFamily: 'bold', color: COLORS.primary, marginTop: 0 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tinyBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  tinyBtnText: { fontSize: 12, color: COLORS.white, fontFamily: 'semiBold' },
});

export default MeetRequestsScreen;



// Jitsi Modal appended at root to avoid layout conflicts
// Rendered inside the component above; this placeholder ensures typings are satisfied