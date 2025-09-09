// ============================================================================
// I18N CONFIGURATION - HUME ISLAMIC DATING APP
// ============================================================================
// Multi-language support with expo-localization and react-i18next
// ============================================================================

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import language resources
import en from './locales/en.json';
import ru from './locales/ru.json';
import ar from './locales/ar.json';
import tr from './locales/tr.json';

// Language storage key
const LANGUAGE_KEY = 'user_language';

// Language detector for AsyncStorage
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // First check if user has saved language preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Otherwise use device locale
      const deviceLocale = Localization.locale;
      const languageCode = deviceLocale.split('-')[0];
      
      // Check if we support this language, otherwise default to English
      const supportedLanguages = ['en', 'ru', 'ar', 'tr'];
      const selectedLanguage = supportedLanguages.includes(languageCode) ? languageCode : 'en';
      
      callback(selectedLanguage);
    } catch (error) {
      console.log('Error detecting language:', error);
      callback('en'); // Fallback to English
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  },
};

// Initialize i18next
i18next
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      ar: { translation: ar },
      tr: { translation: tr },
    },
    fallbackLng: 'en',
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18next;

// Helper function to change language
export const changeLanguage = async (languageCode: string) => {
  try {
    await i18next.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
  } catch (error) {
    console.log('Error changing language:', error);
  }
};

// Helper function to get current language
export const getCurrentLanguage = () => i18next.language || 'en';

// Helper function to get supported languages
export const getSupportedLanguages = () => [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
];
