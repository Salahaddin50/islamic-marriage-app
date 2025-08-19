import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageContainer from '../components/PageContainer';
import DotsView from '../components/DotsView';
import Button from '../components/Button';
import Onboarding1Styles from '../styles/OnboardingStyles';
import { COLORS, illustrations, images } from '../constants';
import { useNavigation } from 'expo-router';

type Nav = {
  navigate: (value: string) => void
}

const Onboarding4 = () => {
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
      // Navigate to the welcome screen
      navigate('welcome');
    }
  }, [progress, navigate]);

  return (
    <SafeAreaView style={[Onboarding1Styles.container, {
      backgroundColor: COLORS.white
    }]}>
      <PageContainer>
        <View style={Onboarding1Styles.contentContainer}>
          <Image
            source={illustrations.onboarding4}
            resizeMode="contain"
            style={Onboarding1Styles.illustration}
          />
          <Image
            source={images.ornament}
            resizeMode="contain"
            style={Onboarding1Styles.ornament}
          />
          <View style={[Onboarding1Styles.buttonContainer, {
            backgroundColor: COLORS.white
          }]}>
            <View style={Onboarding1Styles.titleContainer}>
              <Text style={Onboarding1Styles.title}>Find Your Perfect Match</Text>
              <Text style={Onboarding1Styles.subTitle}>TODAY</Text>
            </View>

            <Text style={Onboarding1Styles.description}>
              Discover real connections with Hume's intelligent matchmaking. Start swiping to find your perfect match today.
            </Text>

            <View style={Onboarding1Styles.dotsContainer}>
              {progress < 1 && <DotsView progress={progress} numDots={4} />}
            </View>
            <Button
              title="Next"
              filled
              onPress={() => navigate('welcome')}
              style={Onboarding1Styles.nextButton}
            />
            <Button
              title="Skip"
              onPress={() => navigate('login')}
              textColor={COLORS.primary}
              style={Onboarding1Styles.skipButton}
            />
          </View>
        </View>
      </PageContainer>
    </SafeAreaView>
  );
};

export default Onboarding4;