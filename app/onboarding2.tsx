import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageContainer from '../components/PageContainer';
import DotsView from '../components/DotsView';
import Button from '../components/Button';
import Onboarding1Styles from '../styles/OnboardingStyles';
import { COLORS, illustrations, images } from '../constants';
import { router } from 'expo-router';

const Onboarding2 = () => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<any>(null);
  const navigatingRef = useRef(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 1) {
          clearInterval(intervalId);
          return prevProgress;
        }
        return prevProgress + 0.75;
      });
    }, 2000);
    intervalRef.current = intervalId;
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (navigatingRef.current) return;
    if (progress >= 1) {
      router.replace('/onboarding3');
    }
  }, [progress]);

  return (
    <SafeAreaView style={[Onboarding1Styles.container, {
      backgroundColor: COLORS.white
    }]}>
      <PageContainer>
        <View style={Onboarding1Styles.contentContainer}>
          <Image
            source={illustrations.onboarding2}
            resizeMode="contain"
            style={Onboarding1Styles.illustration}
          />
          <Image
            source={images.ornament}
            resizeMode='contain'
            style={Onboarding1Styles.ornament}
          />
          <View style={Onboarding1Styles.buttonContainer}>
            <View style={Onboarding1Styles.titleContainer}>
              <Text style={Onboarding1Styles.title}>Discover Meaningful</Text>
              <Text style={Onboarding1Styles.subTitle}>CONNECTIONS</Text>
            </View>

            <Text style={Onboarding1Styles.description}>
              Join Datify today and explore a world of meaningful connections. Swipe, match, and meet like-minded people.
            </Text>

            <View style={Onboarding1Styles.dotsContainer}>
              {progress < 1 && <DotsView progress={progress} numDots={4} />}
            </View>
            <Button
              title="Next"
              filled
              onPress={() => {
                navigatingRef.current = true;
                if (intervalRef.current) clearInterval(intervalRef.current);
                router.push('/onboarding3');
              }}
              style={Onboarding1Styles.nextButton}
            />
            <Button
              title="Skip"
              onPress={() => {
                navigatingRef.current = true;
                if (intervalRef.current) clearInterval(intervalRef.current);
                router.replace('/login');
              }}
              textColor={COLORS.primary}
              style={Onboarding1Styles.skipButton}
            />
          </View>
        </View>
      </PageContainer>
    </SafeAreaView>
  );
};

export default Onboarding2;