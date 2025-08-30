import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Linking, Alert } from 'react-native';
import { COLORS, SIZES, images, icons } from '@/constants';
import { Image } from 'expo-image';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { MeetService, MeetRecord } from '@/src/services/meet';
import { supabase } from '@/src/config/supabase';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

const MeetRequestsScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
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
  const [nowTick, setNowTick] = useState<number>(Date.now());

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
      const day = d.getDate();
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

  const loadAll = async () => {
    try {
      setLoading(true);
      const [inc, out, appr] = await Promise.all([
        MeetService.listIncoming(),
        MeetService.listOutgoing(),
        MeetService.listApproved(),
      ]);
      setIncoming(inc);
      setOutgoing(out);
      setApproved(appr);
      const ids: string[] = [];
      inc.forEach(r => ids.push(r.sender_id));
      out.forEach(r => ids.push(r.receiver_id));
      appr.forEach(r => { ids.push(r.sender_id, r.receiver_id); });
      await loadProfiles(ids);
    } finally {
      setLoading(false);
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

  // Tick every minute for enabling join 10 minutes before
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

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
      <View style={styles.headerRight} />
    </View>
  );

  const Row = ({ row, idx, otherUserId, scheduledText, scheduledAtISO, requestText, actions, hideInlineJoin }: { row: MeetRecord; idx: number; otherUserId: string; scheduledText?: string; scheduledAtISO?: string | null; requestText?: string; actions: React.ReactNode; hideInlineJoin?: boolean }) => {
    const other = profilesById[otherUserId];
    const scheduledMs = scheduledAtISO ? new Date(scheduledAtISO).getTime() : NaN;
    const canJoin = !!row.meet_link && !Number.isNaN(scheduledMs) && (nowTick >= (scheduledMs - 10 * 60 * 1000));
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
            scheduledText={row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : ''}
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
            scheduledText={row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : ''}
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
              scheduledText={row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : ''}
              scheduledAtISO={row.scheduled_at || undefined}
              requestText={formatRequestTime(row.updated_at)}
              hideInlineJoin
              actions={
                <>
                  <TouchableOpacity
                    style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]}
                    onPress={() => {
                      if (canJoin && row.meet_link) { Linking.openURL(row.meet_link as string); }
                      else { Alert.alert('Meeting not active yet', 'Join link will be active 10 minutes before the scheduled time.'); }
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
      </View> 
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, backgroundColor: COLORS.white, padding: 16 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', width: SIZES.width - 32, justifyContent: 'space-between' },
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


