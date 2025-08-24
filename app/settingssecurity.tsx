import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { COLORS, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import GlobalSettingsItem from '../components/GlobalSettingsItem';
import Button from '../components/Button';
import { Image } from 'expo-image';
import { useNavigation, router } from 'expo-router';

type Nav = {
  navigate: (value: string) => void
}

// Settings for Security 
const SettingsSecurity = () => {
  const { navigate } = useNavigation<Nav>();
  const [isRememberMeEnabled, setIsRememberMeEnabled] = useState(true);
  const [isFaceIDEnabled, setIsFaceIDEnabled] = useState(false);
  const [isBiometricIDEnabled, setIsBiometricIDEnabled] = useState(true);

  const toggleRememberMe = () => {
    setIsRememberMeEnabled(!isRememberMeEnabled);
  };

  const toggleFaceID = () => {
    setIsFaceIDEnabled(!isFaceIDEnabled);
  };

  const toggleBiometricID = () => {
    setIsBiometricIDEnabled(!isBiometricIDEnabled);
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header 
          title="Security" 
          onBackPress={() => router.push('/(tabs)/profile')}
        />
        <ScrollView style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <GlobalSettingsItem
            title="Remember me"
            isNotificationEnabled={isRememberMeEnabled}
            toggleNotificationEnabled={toggleRememberMe}
          />
          <GlobalSettingsItem
            title="Face ID"
            isNotificationEnabled={isFaceIDEnabled}
            toggleNotificationEnabled={toggleFaceID}
          />
          <GlobalSettingsItem
            title="Biometric ID"
            isNotificationEnabled={isBiometricIDEnabled}
            toggleNotificationEnabled={toggleBiometricID}
          />
          <TouchableOpacity style={styles.view}>
            <Text style={[styles.viewLeft, { color: COLORS.greyscale900 }]}>Google Authenticator</Text>
            <Image
              source={icons.arrowRight}
              contentFit='contain'
              style={[styles.arrowRight, { tintColor: COLORS.greyscale900 }]}
            />
          </TouchableOpacity>
          <Button
            title="Change PIN"
            style={{
              backgroundColor: COLORS.tansparentPrimary,
              borderRadius: 32,
              borderColor: COLORS.tansparentPrimary,
              marginTop: 22
            }}
            textColor={COLORS.primary}
            onPress={() => { navigate("changepin") }}
          />
          <Button
            title="Change Password"
            style={{
              backgroundColor: COLORS.tansparentPrimary,
              borderRadius: 32,
              borderColor: COLORS.tansparentPrimary,
              marginTop: 22
            }}
            textColor={COLORS.primary}
            onPress={() => { navigate("changepassword") }}
          />
          <Button
            title="Change Email"
            style={{
              backgroundColor: COLORS.tansparentPrimary,
              borderRadius: 32,
              borderColor: COLORS.tansparentPrimary,
              marginTop: 22
            }}
            textColor={COLORS.primary}
            onPress={() => { navigate("changeemail") }}
          />
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
  scrollView: {
    marginVertical: 22
  },
  arrowRight: {
    height: 24,
    width: 24,
    tintColor: COLORS.greyscale900
  },
  view: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16
  },
  viewLeft: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginRight: 8
  },
  button: {
    backgroundColor: COLORS.tansparentPrimary,
    borderRadius: 32,
    borderColor: COLORS.tansparentPrimary,
    marginTop: 22
  }
})

export default SettingsSecurity