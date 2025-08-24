import '../global'; // Import global polyfills first
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { FONTS } from '@/constants/fonts';
import { LogBox, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';

// Import CSS for web builds
if (Platform.OS === 'web') {
  require('../web-styles.css');
}
// import { QueryProviderWithDevtools } from '../src/providers/QueryProvider'; // Temporarily commented for initial testing

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

//Ignore all log notifications
LogBox.ignoreAllLogs();

// Suppress React Native Web deprecation warnings for cleaner console
if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.('"shadow*" style props are deprecated')) return;
    if (args[0]?.includes?.('style.tintColor is deprecated')) return;
    if (args[0]?.includes?.('props.pointerEvents is deprecated')) return;
    originalWarn(...args);
  };
}

export default function RootLayout() {
  // Load all fonts including icon fonts
  const [loaded] = useFonts({ 
    ...FONTS, 
    ...MaterialCommunityIcons.font,
    ...Ionicons.font,
    ...FontAwesome.font
  });

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

      // Add Google Fonts link for TikTok-style fonts (Inter + Poppins)
      const fontLink = document.createElement('link');
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);

      // Add font preconnect for better performance
      const preconnect1 = document.createElement('link');
      preconnect1.rel = 'preconnect';
      preconnect1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect1);

      const preconnect2 = document.createElement('link');
      preconnect2.rel = 'preconnect';
      preconnect2.href = 'https://fonts.gstatic.com';
      preconnect2.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect2);

      // Add mobile-friendly CSS class to body
      document.body.classList.add('mobile-friendly');
      document.body.style.maxWidth = '100vw';
      document.body.style.overflowX = 'hidden';

      // FORCE TikTok-style fonts with inline styles
      const forceTikTokStyle = document.createElement('style');
      forceTikTokStyle.innerHTML = `
        /* TikTok-style font stack - modern, clean, and trendy */
        *:not([style*="font-family: MaterialCommunityIcons"]), 
        *::before:not([style*="font-family: MaterialCommunityIcons"]), 
        *::after:not([style*="font-family: MaterialCommunityIcons"]) {
          font-family: "Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        
        /* Override ALL possible font declarations */
        html, body, #root, #root * {
          font-family: "Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        
        /* Override React Native Web generated classes, but exclude icons */
        [class*="css-"]:not([style*="font-family: MaterialCommunityIcons"]), 
        [class*="r-"]:not([style*="font-family: MaterialCommunityIcons"]) {
          font-family: "Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        
        /* TikTok-style typography improvements */
        body {
          font-weight: 400;
          line-height: 1.5;
          letter-spacing: -0.01em;
        }
        
        /* Headings use Poppins for impact */
        h1, h2, h3, h4, h5, h6, .heading {
          font-family: "Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        
        /* Buttons and CTAs use Inter for clarity */
        button, .button, .cta {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          font-weight: 500;
          letter-spacing: -0.005em;
        }
      `;
      document.head.appendChild(forceTikTokStyle);
      
      // Also set it on body directly
      document.body.style.fontFamily = '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
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