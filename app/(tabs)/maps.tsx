import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, illustrations, SIZES } from '@/constants';
import { NavigationProp } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { InterestsService, InterestRecord } from '@/src/services/interests';
import { supabase } from '@/src/config/supabase';
import Button from '@/components/Button';

// Interests list page with three tabs
const Maps = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [incoming, setIncoming] = useState<InterestRecord[]>([]);
  const [outgoing, setOutgoing] = useState<InterestRecord[]>([]);
  const [approved, setApproved] = useState<InterestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'approved'>('received');

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

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Text style={styles.modalTitle}>Interests</Text>
        <View style={styles.tabsRow}>
          <TouchableOpacity onPress={() => setActiveTab('received')} style={[styles.tabChip, activeTab==='received' && styles.tabChipActive]}>
            <Text style={[styles.tabText, activeTab==='received' && styles.tabTextActive]}>Received</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('sent')} style={[styles.tabChip, activeTab==='sent' && styles.tabChipActive]}>
            <Text style={[styles.tabText, activeTab==='sent' && styles.tabTextActive]}>Sent</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('approved')} style={[styles.tabChip, activeTab==='approved' && styles.tabChipActive]}>
            <Text style={[styles.tabText, activeTab==='approved' && styles.tabTextActive]}>Approved</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1, width: '100%' }}>
          {loading ? (
            <Text style={styles.modalSubtitle}>Loading…</Text>
          ) : (
            <>
              {activeTab === 'received' && (
                incoming.length === 0 ? (
                  <Text style={styles.modalSubtitle}>No received interests</Text>
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
                )
              )}
              {activeTab === 'sent' && (
                outgoing.length === 0 ? (
                  <Text style={styles.modalSubtitle}>No sent interests</Text>
                ) : (
                  outgoing.map((row) => (
                    <View key={row.id} style={styles.rowItem}>
                      <Text style={styles.rowTitle}>To: {row.receiver_id} • {row.status}</Text>
                    </View>
                  ))
                )
              )}
              {activeTab === 'approved' && (
                approved.length === 0 ? (
                  <Text style={styles.modalSubtitle}>No approved interests</Text>
                ) : (
                  approved.map((row) => (
                    <View key={row.id} style={styles.rowItem}>
                      <Text style={styles.rowTitle}>With: {row.sender_id} ↔ {row.receiver_id}</Text>
                    </View>
                  ))
                )
              )}
            </>
          )}
        </ScrollView>
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
  modalTitle: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginVertical: 12
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 12
  },
  modalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.56)"
  },
  modalSubContainer: {
    height: 520,
    width: SIZES.width * 0.9,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  modalIllustration: {
    height: 180,
    width: 180,
    marginVertical: 22,
    tintColor: COLORS.primary
  },
  successBtn: {
    width: "100%",
    marginTop: 12,
    borderRadius: 32
  },
  editPencilIcon: {
    width: 42,
    height: 42,
    tintColor: COLORS.white,
    position: "absolute",
    top: 54,
    left: 58,
  },
  backgroundIllustration: {
    height: 150,
    width: 150,
    marginVertical: 22,
    alignItems: "center",
    justifyContent: "center",
    tintColor: COLORS.primary
  },
});

export default Maps;
