import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { COLORS, icons, SIZES } from '../constants';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { safeGoBack } from '../utils/responsive';

const Section: React.FC<{ title: string } & React.PropsWithChildren> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: COLORS.greyscale900 }]}>{title}</Text>
    <View style={[styles.sectionBody, { backgroundColor: COLORS.grayscale100 }]}>
      {children}
    </View>
  </View>
);

export default function SettingsNikahReminder() {
  const navigation = useNavigation<NavigationProp<any>>();
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => safeGoBack(navigation, router, '/(tabs)/profile')}>
          <Image source={icons.arrowBack} contentFit="contain" style={[styles.backIcon, { tintColor: COLORS.greyscale900 }]} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>Reminder about Poligamy Sunnah</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Section title="Ayat from the Qur'an">
            <Text style={styles.item}>
              {`"…then marry those that please you of women, two, three, or four. But if you fear that you will not be just, then [marry only] one…"`} (An-Nisa 4:3)
            </Text>
            <Text style={styles.note}>Justice between wives is an explicit condition for permissibility.</Text>
          </Section>

          <Section title="Authentic Hadiths">
            <Text style={styles.item}>
              {`The Prophet (ﷺ) said: "The best of you are those who are best to their families, and I am the best of you to my family."`} (Tirmidhi)
            </Text>
            <Text style={styles.item}>
              {`The Prophet (ﷺ) said: "Fear Allah and be just among your children (and family)."`} (Bukhari & Muslim)
            </Text>
            <Text style={styles.note}>Kindness, justice, and maintaining rights are binding duties.</Text>
          </Section>

          <Section title="Statements of Scholars">
            <Text style={styles.item}>
              Polygyny is permissible with the strict condition of justice in maintenance, time, housing, and fair treatment. If justice is feared to be unmet, one marriage is safer.
            </Text>
            <Text style={styles.item}>
              Justice does not include equality in the heart, but it requires fairness in outward rights and responsibilities.
            </Text>
            <Text style={styles.item}>
              Entering polygyny is a serious covenant. Failing to uphold justice is a major sin and a cause of worldly and spiritual harm.
            </Text>
          </Section>

          <Section title="Adab (Etiquettes) and Responsibilities">
            <Text style={styles.item}>- Uphold justice equally in spending, housing, and time.</Text>
            <Text style={styles.item}>- Maintain privacy and dignity of each wife; avoid harm and comparison.</Text>
            <Text style={styles.item}>- Be truthful, responsible, and transparent from the beginning.</Text>
            <Text style={styles.item}>- Involve families appropriately and honor guardianship protocols.</Text>
            <Text style={styles.item}>- Keep intentions pure for a halal marriage and seek Allah’s pleasure.</Text>
          </Section>

          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backIcon: {
    width: 24,
    height: 24,
    marginRight: 12
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'bold'
  },
  section: {
    marginTop: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'semiBold',
    marginBottom: 8
  },
  sectionBody: {
    borderRadius: 12,
    padding: 12
  },
  item: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.greyscale900,
    marginBottom: 8
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.gray2
  }
});


