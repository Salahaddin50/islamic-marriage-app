import '../global'; // Import global polyfills first
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { FONTS } from '@/constants/fonts';
import { LogBox, Platform } from 'react-native';
// import { QueryProviderWithDevtools } from '../src/providers/QueryProvider'; // Temporarily commented for initial testing

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

//Ignore all log notifications
LogBox.ignoreAllLogs();

export default function RootLayout() {
  const [loaded] = useFonts(FONTS);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Add responsive CSS for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Add viewport meta tag for proper mobile scaling
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(viewportMeta);

      // Add responsive CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/web-styles.css';
      document.head.appendChild(link);

      // Add mobile-friendly CSS class to body
      document.body.classList.add('mobile-friendly');
      document.body.style.maxWidth = '100vw';
      document.body.style.overflowX = 'hidden';
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding2" />
        <Stack.Screen name="onboarding3" />
        <Stack.Screen name="onboarding4" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="forgotpasswordmethods" />
        <Stack.Screen name="forgotpasswordemail" />
        <Stack.Screen name="forgotpasswordphonenumber" />
        <Stack.Screen name="otpverification" />
        <Stack.Screen name="verifyyouridentity" />
        <Stack.Screen name="proofofresidency" />
        <Stack.Screen name="photoidcard" />
        <Stack.Screen name="selfiewithidcard" />
        <Stack.Screen name="fillyourprofile" />
        <Stack.Screen name="createnewpassword" />
        <Stack.Screen name="createnewpin" />
        <Stack.Screen name="fingerprint" />
        <Stack.Screen name="facerecognitionscan" />
        <Stack.Screen name="facerecognitionwalkthrough" />
        <Stack.Screen name="addnewaddress" />
        <Stack.Screen name="address" />
        <Stack.Screen name="addnewcard" />
        <Stack.Screen name="changeemail" />
        <Stack.Screen name="changepassword" />
        <Stack.Screen name="changepin" />
        <Stack.Screen name="customerservice" />
        <Stack.Screen name="settingshelpcenter" />
        <Stack.Screen name="settingsinvitefriends" />
        <Stack.Screen name="settingslanguage" />
        <Stack.Screen name="settingsnotifications" />
        <Stack.Screen name="settingspayment" />
        <Stack.Screen name="settingsprivacypolicy" />
        <Stack.Screen name="settingssecurity" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="call" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="topupamount" />
        <Stack.Screen name="topupmethods" />
        <Stack.Screen name="topupconfirmpin" />
        <Stack.Screen name="topupereceipt" />
        <Stack.Screen name="paymentmethods" />
        <Stack.Screen name="reviewsummary" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
  );
}