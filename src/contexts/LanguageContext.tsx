// ============================================================================
// LANGUAGE CONTEXT - HUME ISLAMIC DATING APP
// ============================================================================
// Context for managing language state and providing i18n functionality
// ============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, getSupportedLanguages } from '../i18n';

interface LanguageContextType {
  currentLanguage: string;
  supportedLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
  changeLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, options?: any) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [isRTL, setIsRTL] = useState(false);

  const supportedLanguages = getSupportedLanguages();

  useEffect(() => {
    // Update RTL state based on current language
    setIsRTL(currentLanguage === 'ar');
  }, [currentLanguage]);

  useEffect(() => {
    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const handleChangeLanguage = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    supportedLanguages,
    changeLanguage: handleChangeLanguage,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
