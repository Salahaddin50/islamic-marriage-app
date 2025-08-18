// ============================================================================
// RESPONSIVE ONBOARDING INDEX - HUME ISLAMIC DATING APP
// ============================================================================
// Mobile-first responsive onboarding with Islamic branding
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageContainer from '../components/PageContainer';
import DotsView from '../components/DotsView';
import Button from '../components/Button';
import { COLORS, illustrations, images } from '../constants';
import { useNavigation } from 'expo-router';
import { getResponsiveFontSize, getResponsiveSpacing, getResponsiveWidth, getResponsiveHeight, isMobileWeb } from '../utils/responsive';

type Nav = {
  navigate: (value: string) => void
}

const Index = () => {
  const [progress, setProgress] = useState(0);
  const { navigate } = useNavigation<Nav>();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 1) {
          clearInterval(intervalId);
          return prevProgress;
        }
        return prevProgress + 0.75;
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (progress >= 1) {
      // Navigate to the onboarding2 Screen
      navigate('onboarding2');
    }
  }, [progress, navigate]);

  return (
    <SafeAreaView style={styles.area}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <PageContainer>
          <View style={styles.contentContainer}>
            {/* Illustration Section */}
            <View style={styles.illustrationContainer}>
              <Image
                source={illustrations.onboarding6}
                resizeMode="contain"
                style={styles.illustration}
              />
              <Image
                source={images.ornament}
                resizeMode="contain"
                style={styles.ornament}
              />
            </View>

            {/* Content Section */}
            <View style={styles.bottomContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>Welcome to</Text>
                <Text style={styles.subtitle}>Hume Islamic Dating</Text>
                <Text style={styles.description}>
                  We're here to connect you with amazing people who share your Islamic values and relationship goals.
                </Text>
              </View>

              {/* Progress Dots */}
              <View style={styles.dotsContainer}>
                {progress < 1 && <DotsView progress={progress} numDots={4} />}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  title="Get Started"
                  filled
                  onPress={() => navigate('onboarding2')}
                  style={styles.nextButton}
                />
                <Button
                  title="Skip to Login"
                  onPress={() => navigate('welcome')}
                  textColor={COLORS.primary}
                  style={styles.skipButton}
                />
              </View>
            </View>
          </View>
        </PageContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Responsive Styles
const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: isMobileWeb() ? 300 : 400,
  },
  illustration: {
    height: isMobileWeb() ? getResponsiveWidth(80) : getResponsiveWidth(90),
    width: isMobileWeb() ? getResponsiveWidth(80) : getResponsiveWidth(90),
    maxHeight: 350,
    maxWidth: 350,
  },
  ornament: {
    position: "absolute",
    bottom: '10%',
    zIndex: -1,
    width: getResponsiveWidth(60),
    height: getResponsiveHeight(20),
    opacity: 0.3,
  },
  bottomContainer: {
    width: '100%',
    paddingHorizontal: getResponsiveSpacing(24),
    paddingBottom: getResponsiveSpacing(32),
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(32),
  },
  title: {
    fontSize: getResponsiveFontSize(28),
    fontFamily: "semiBold",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: getResponsiveSpacing(4),
  },
  subtitle: {
    fontSize: getResponsiveFontSize(32),
    fontFamily: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: getResponsiveSpacing(16),
  },
  description: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: "regular",
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(22),
    paddingHorizontal: getResponsiveSpacing(8),
  },
  dotsContainer: {
    marginBottom: getResponsiveSpacing(32),
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: isMobileWeb() ? '100%' : 350,
  },
  nextButton: {
    width: '100%',
    marginBottom: getResponsiveSpacing(16),
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderRadius: 30,
    height: isMobileWeb() ? 48 : 52,
  },
  skipButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 30,
    height: isMobileWeb() ? 48 : 52,
  },
});

export default Index;