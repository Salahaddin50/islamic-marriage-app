import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { COLORS, icons, SIZES } from '../constants';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { safeGoBack } from '../utils/responsive';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => safeGoBack(navigation, router, '/(tabs)/profile')}>
          <Image source={icons.arrowBack} contentFit="contain" style={[styles.backIcon, { tintColor: COLORS.greyscale900 }]} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>{t('reminder_page.title')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}> 
      <View style={[styles.container, { backgroundColor: COLORS.white }]}> 
        {renderHeader()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Section title={t('reminder_page.section_ayat_title')}>
            <Text style={styles.item}>
              {t('reminder_page.ayat_quote')}
            </Text>
            <Text style={styles.note}>{t('reminder_page.ayat_note')}</Text>
          </Section>

          <Section title={t('reminder_page.section_hadith_title')}>
            <Text style={styles.item}>
              {t('reminder_page.hadith_1')}
            </Text>
            <Text style={styles.item}>
              {t('reminder_page.hadith_2')}
            </Text>
            <Text style={styles.note}>{t('reminder_page.hadith_note')}</Text>
          </Section>

          <Section title={t('reminder_page.section_scholars_title')}>
            <Text style={styles.item}>{t('reminder_page.scholars_1')}</Text>
            <Text style={styles.item}>{t('reminder_page.scholars_2')}</Text>
            <Text style={styles.item}>{t('reminder_page.scholars_3')}</Text>
          </Section>

          <Section title={t('reminder_page.section_adab_title')}>
            <Text style={styles.item}>{t('reminder_page.adab_1')}</Text>
            <Text style={styles.item}>{t('reminder_page.adab_2')}</Text>
            <Text style={styles.item}>{t('reminder_page.adab_3')}</Text>
            <Text style={styles.item}>{t('reminder_page.adab_4')}</Text>
            <Text style={styles.item}>{t('reminder_page.adab_5')}</Text>
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


