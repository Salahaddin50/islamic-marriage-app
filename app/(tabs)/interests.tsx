import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { COLORS, SIZES, icons, images } from '@/constants';
import { Image } from 'expo-image';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Button from '@/components/Button';
import { InterestsService, InterestRecord } from '@/src/services/interests';
import { supabase } from '@/src/config/supabase';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';

const InterestsScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [incoming, setIncoming] = useState<InterestRecord[]>([]);
  const [outgoing, setOutgoing] = useState<InterestRecord[]>([]);
  const [approved, setApproved] = useState<InterestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    { key: 'received', title: 'Received (0)' },
    { key: 'sent', title: 'Sent (0)' },
    { key: 'approved', title: 'Approved (0)' },
  ]);

  const [profilesById, setProfilesById] = useState<Record<string, { name: string; age?: number; avatar?: any }>>({});

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

  const loadProfiles = async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, date_of_birth, profile_picture_url, gender')
      .in('user_id', uniqueIds);
    const map: Record<string, { name: string; age?: number; avatar?: any }> = {};
    (data || []).forEach((row: any) => {
      const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Member';
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
    setProfilesById(prev => ({ ...prev, ...map }));
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

  const loadAll = async () => {
    try {
      setLoading(true);
      const [inc, out, appr] = await Promise.all([
        InterestsService.listIncoming(),
        InterestsService.listOutgoing(),
        InterestsService.listApproved(),
      ]);
      setIncoming(inc);
      setOutgoing(out);
      setApproved(appr);
      // Load user profiles to enrich rows
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
    await InterestsService.accept(id);
    await loadAll();
    setIndex(2); // Switch to Approved tab
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

  useEffect(() => {
    let channel: any = null;
    let isMounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const myId = user?.id;
      if (!myId) return;
      channel = supabase
        .channel('interests-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'interests' }, (payload: any) => {
          const row = (payload.new || payload.old) as InterestRecord | undefined;
          if (!row) return;
          if (row.sender_id === myId || row.receiver_id === myId) {
            // Relevant change for me → refresh lists
            loadAll();
          }
        })
        .subscribe();
    })();
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      isMounted = false;
    };
  }, []);

  // Keep tab titles in sync with counts so Web/native always display counts
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
      renderLabel={({ route, focused }: any) => {
        let count = 0;
        if (route.key === 'received') count = incoming.length;
        else if (route.key === 'sent') count = outgoing.length;
        else if (route.key === 'approved') count = approved.length;
        const label = `${route.title} (${count})`;
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
        <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>Interests</Text>
      </View>
      <View style={styles.headerRight} />
    </View>
  );

  const ReceivedRoute = () => (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      {loading ? (
        <Text style={styles.subtitle}>Loading…</Text>
      ) : (
        <>
          {incoming.length === 0 ? (
            <Text style={styles.subtitle}>No received interests</Text>
          ) : (
            incoming.map((row, idx) => {
              const otherUserId = row.sender_id;
              const other = profilesById[otherUserId];
              return (
                <View key={row.id} style={[styles.userContainer, idx % 2 !== 0 ? styles.oddBackground : null]}>
                  <TouchableOpacity style={styles.userImageContainer} onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                    <Image source={other?.avatar ? (typeof other.avatar === 'string' ? { uri: other.avatar } : other.avatar) : images.user} contentFit='cover' style={styles.userImage} />
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', width: SIZES.width - 104 }}>
                    <View style={styles.userInfoContainer}>
                      <TouchableOpacity onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                        <Text style={[styles.userName, { color: COLORS.greyscale900 }]}>
                          {other?.name || otherUserId}{other?.age ? `, ${other.age}` : ''}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.primary }]} onPress={() => accept(row.id)}>
                          <Text style={styles.tinyBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => reject(row.id)}>
                          <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ position: 'absolute', right: 4, alignItems: 'center' }}>
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
        <Text style={styles.subtitle}>Loading…</Text>
      ) : (
        <>
          {outgoing.length === 0 ? (
            <Text style={styles.subtitle}>No sent interests</Text>
          ) : (
            outgoing.map((row, idx) => {
              const otherUserId = row.receiver_id;
              const other = profilesById[otherUserId];
              return (
                <View key={row.id} style={[styles.userContainer, idx % 2 !== 0 ? styles.oddBackground : null]}>
                  <TouchableOpacity style={styles.userImageContainer} onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                    <Image source={other?.avatar ? (typeof other.avatar === 'string' ? { uri: other.avatar } : other.avatar) : images.user} contentFit='cover' style={styles.userImage} />
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
                          <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>Withdraw</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ position: 'absolute', right: 4, alignItems: 'center' }}>
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
        <Text style={styles.subtitle}>Loading…</Text>
      ) : (
        <>
          {approved.length === 0 ? (
            <Text style={styles.subtitle}>No approved interests</Text>
          ) : (
            approved.map((row, idx) => {
              const otherUserId = row.sender_id; // Simplified
              const other = profilesById[otherUserId];
              return (
                <View key={row.id} style={[styles.userContainer, idx % 2 !== 0 ? styles.oddBackground : null]}>
                  <TouchableOpacity style={styles.userImageContainer} onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                    <Image source={other?.avatar ? (typeof other.avatar === 'string' ? { uri: other.avatar } : other.avatar) : images.user} contentFit='cover' style={styles.userImage} />
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', width: SIZES.width - 104 }}>
                    <View style={styles.userInfoContainer}>
                      <TouchableOpacity onPress={() => navigation.navigate('matchdetails' as never, { userId: otherUserId } as never)}>
                        <Text style={[styles.userName, { color: COLORS.greyscale900 }]}>
                          {other?.name || otherUserId}{other?.age ? `, ${other.age}` : ''}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={[styles.tinyBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.primary, borderWidth: 1 }]} onPress={() => cancelApproved(row.id)}>
                          <Text style={[styles.tinyBtnText, { color: COLORS.primary }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ position: 'absolute', right: 4, alignItems: 'center' }}>
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


