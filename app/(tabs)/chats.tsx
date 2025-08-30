import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView, Linking } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { COLORS, SIZES, icons, images } from '@/constants';
import { Image } from 'expo-image';
import { MessageRequestsService, MessageRequestRecord } from '@/src/services/message-requests.service';
import { supabase } from '@/src/config/supabase';
import { useNavigation } from 'expo-router';
import { NavigationProp, useIsFocused } from '@react-navigation/native';

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

  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    { key: 'received', title: 'Received (0)' },
    { key: 'sent', title: 'Sent (0)' },
    { key: 'approved', title: 'Approved (0)' },
  ]);

  const [incoming, setIncoming] = useState<MessageRequestRecord[]>([]);
  const [outgoing, setOutgoing] = useState<MessageRequestRecord[]>([]);
  const [approved, setApproved] = useState<MessageRequestRecord[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, { name: string; avatar?: any; phone?: string }>>({});
  const [loading, setLoading] = useState(true);

  const sanitizePhone = (phoneCode?: string | null, mobile?: string | null): string | undefined => {
    if (!mobile) return undefined;
    const raw = `${phoneCode || ''}${mobile}`;
    const digits = raw.replace(/\D/g, '');
    return digits.length > 6 ? digits : undefined;
  };

  const loadProfiles = async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, profile_picture_url, gender, phone_code, mobile_number')
      .in('user_id', uniqueIds);
    const map: Record<string, { name: string; avatar?: any; phone?: string }> = {};
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
    setProfilesById(prev => ({ ...prev, ...map }));
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [inc, out, appr] = await Promise.all([
        MessageRequestsService.listIncoming(),
        MessageRequestsService.listOutgoing(),
        MessageRequestsService.listApproved(),
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
      { key: 'received', title: `Received (${incoming.length})` },
      { key: 'sent', title: `Sent (${outgoing.length})` },
      { key: 'approved', title: `Approved (${approved.length})` },
    ]);
  }, [incoming.length, outgoing.length, approved.length]);

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

  const ReceivedRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <Text style={styles.subtitle}>Loading…</Text>
      ) : incoming.length === 0 ? (
        <Text style={styles.subtitle}>No received chat requests</Text>
      ) : (
        incoming.map((row, idx) => (
          <Row
            key={row.id}
            row={row}
            idx={idx}
            otherUserId={row.sender_id}
            rightContent={
              <>
                <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]} onPress={async () => { await MessageRequestsService.accept(row.id); await loadAll(); }}>
                  <Text style={styles.tinyBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={async () => { await MessageRequestsService.reject(row.id); await loadAll(); }}>
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
        <Text style={styles.subtitle}>No sent chat requests</Text>
      ) : (
        outgoing.map((row, idx) => (
          <Row
            key={row.id}
            row={row}
            idx={idx}
            otherUserId={row.receiver_id}
            rightContent={
              <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={async () => { await MessageRequestsService.cancel(row.id); await loadAll(); }}>
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
        <Text style={styles.subtitle}>No approved chat requests</Text>
      ) : (
        approved.map((row, idx) => {
          const otherUserId = row.sender_id;
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
                    <Text style={styles.tinyBtnText}>{phoneDigits ? 'WhatsApp' : 'No number'}</Text>
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
          <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>Messages</Text>
        </View>
        <View style={styles.headerRight} />
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
})

export default Messages