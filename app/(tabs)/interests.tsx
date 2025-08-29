import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { COLORS, SIZES, icons, images } from '@/constants';
import { Image } from 'expo-image';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Button from '@/components/Button';
import { InterestsService, InterestRecord } from '@/src/services/interests';

const InterestsScreen = () => {
  const [incoming, setIncoming] = useState<InterestRecord[]>([]);
  const [outgoing, setOutgoing] = useState<InterestRecord[]>([]);
  const [approved, setApproved] = useState<InterestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'received', title: 'Received' },
    { key: 'sent', title: 'Sent' },
    { key: 'approved', title: 'Approved' },
  ]);

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
    } finally {
      setLoading(false);
    }
  };

  const accept = async (id: string) => {
    await InterestsService.accept(id);
    await loadAll();
  };

  const reject = async (id: string) => {
    await InterestsService.reject(id);
    await loadAll();
  };

  useEffect(() => {
    loadAll();
  }, []);

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: COLORS.primary }}
      style={{ backgroundColor: COLORS.white }}
      activeColor={COLORS.primary}
      inactiveColor={COLORS.greyscale900}
      renderLabel={({ route, focused }: any) => (
        <Text style={{ color: focused ? COLORS.primary : 'gray', fontSize: 16, fontFamily: 'bold' }}>{route.title}</Text>
      )}
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
            incoming.map((row) => (
              <View key={row.id} style={styles.rowItem}>
                <Text style={styles.rowTitle}>From: {row.sender_id}</Text>
                <View style={styles.rowActions}>
                  <Button title="Accept" filled onPress={() => accept(row.id)} style={styles.actionBtn} />
                  <Button title="Reject" onPress={() => reject(row.id)} textColor={COLORS.primary} style={[styles.actionBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.tansparentPrimary }]} />
                </View>
              </View>
            ))
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
            outgoing.map((row) => (
              <View key={row.id} style={styles.rowItem}>
                <Text style={styles.rowTitle}>To: {row.receiver_id} • {row.status}</Text>
                <View style={styles.rowActions}>
                  <Button title="Withdraw" onPress={() => reject(row.id)} textColor={COLORS.primary} style={[styles.actionBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.tansparentPrimary }]} />
                </View>
              </View>
            ))
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
            approved.map((row) => (
              <View key={row.id} style={styles.rowItem}>
                <Text style={styles.rowTitle}>With: {row.sender_id} ↔ {row.receiver_id}</Text>
                <View style={styles.rowActions}>
                  <Button title="Cancel" onPress={() => reject(row.id)} textColor={COLORS.primary} style={[styles.actionBtn, { backgroundColor: COLORS.tansparentPrimary, borderColor: COLORS.tansparentPrimary }]} />
                </View>
              </View>
            ))
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
  rowTitle: {
    fontSize: 15,
    fontFamily: 'medium',
    color: COLORS.greyscale900,
    marginBottom: 8,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: '48%',
    borderRadius: 32,
  }
});

export default InterestsScreen;


