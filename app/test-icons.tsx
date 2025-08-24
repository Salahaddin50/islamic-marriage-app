import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const TestIcons = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Icon Test Page</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MaterialCommunityIcons:</Text>
        <View style={styles.iconRow}>
          <MaterialCommunityIcons name="home" size={30} color={COLORS.primary} />
          <MaterialCommunityIcons name="account-circle" size={30} color={COLORS.primary} />
          <MaterialCommunityIcons name="delete" size={30} color={COLORS.primary} />
          <MaterialCommunityIcons name="play" size={30} color={COLORS.primary} />
          <MaterialCommunityIcons name="star" size={30} color={COLORS.primary} />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FontAwesome:</Text>
        <View style={styles.iconRow}>
          <FontAwesome name="home" size={30} color={COLORS.secondary} />
          <FontAwesome name="user" size={30} color={COLORS.secondary} />
          <FontAwesome name="trash" size={30} color={COLORS.secondary} />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ionicons:</Text>
        <View style={styles.iconRow}>
          <Ionicons name="home" size={30} color={COLORS.tertiary} />
          <Ionicons name="person" size={30} color={COLORS.tertiary} />
          <Ionicons name="trash" size={30} color={COLORS.tertiary} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
});

export default TestIcons;
