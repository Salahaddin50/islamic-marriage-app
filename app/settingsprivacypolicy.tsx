import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import { useTranslation } from 'react-i18next';

// Change The privacy data based on your data 
const SettingsPrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}> 
      <View style={[styles.container, { backgroundColor: COLORS.white }]}> 
        <Header title={t('privacy_policy.title')} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View>
            <Text style={[styles.settingsTitle, { color: COLORS.black }]}>{t('privacy_policy.section1_title')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section1_intro')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section1_personal')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section1_usage')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section1_cookies')}</Text>
          </View>
          <View>
            <Text style={[styles.settingsTitle, { color: COLORS.black }]}>{t('privacy_policy.section2_title')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section2_intro')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section2_delivery')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section2_comms')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section2_analytics')}</Text>
          </View>
          <View>
            <Text style={[styles.settingsTitle, { color: COLORS.black }]}>{t('privacy_policy.section3_title')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section3_intro')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section3_legal')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section3_third_parties')}</Text>
            <Text style={[styles.body, { color: COLORS.greyscale900 }]}>{t('privacy_policy.section3_business')}</Text>
          </View>
        </ScrollView>
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
  settingsTitle: {
    fontSize: 18,
    fontFamily: "bold",
    color: COLORS.black,
    marginVertical: 26
  },
  body: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.black,
    marginTop: 4
  }
})

export default SettingsPrivacyPolicy