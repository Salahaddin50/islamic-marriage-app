import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageContainer from '../components/PageContainer';
import DotsView from '../components/DotsView';
import Button from '../components/Button';
import Onboarding1Styles from '../styles/OnboardingStyles';
import { COLORS, illustrations, images } from '../constants';
import { router } from 'expo-router';
import { useLanguage } from '../src/contexts/LanguageContext';
import LanguageSelector from '../src/components/LanguageSelector';

const Onboarding4 = () => {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<any>(null);
  const navigatingRef = useRef(false);

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
    intervalRef.current = intervalId;
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (navigatingRef.current) return;
    if (progress >= 1) {
      router.replace('/welcome');
    }
  }, [progress]);

  return (
    <SafeAreaView style={[Onboarding1Styles.container, {
      backgroundColor: COLORS.white
    }]}>
      <PageContainer>
        {/* Language Selector */}
        <View style={Onboarding1Styles.languageContainer}>
          <LanguageSelector showLabel={false} style={Onboarding1Styles.languageSelector} />
        </View>
        
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
              <Text style={Onboarding1Styles.title}>{t('onboarding4.title')}</Text>
              <Text style={Onboarding1Styles.subTitle}>{t('onboarding4.subtitle')}</Text>
            </View>

            <Text style={Onboarding1Styles.description}>
              {t('onboarding4.description')}
            </Text>

            <View style={Onboarding1Styles.dotsContainer}>
              {progress < 1 && <DotsView progress={progress} numDots={4} />}
            </View>
            <Button
              title={t('onboarding.next')}
              filled
              onPress={() => {
                navigatingRef.current = true;
                if (intervalRef.current) clearInterval(intervalRef.current);
                router.push('/welcome');
              }}
              style={Onboarding1Styles.nextButton}
            />
            <Button
              title={t('onboarding.skip')}
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

export default Onboarding4;