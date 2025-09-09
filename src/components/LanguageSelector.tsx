// ============================================================================
// LANGUAGE SELECTOR COMPONENT - HUME ISLAMIC DATING APP
// ============================================================================
// Language selector for pre-signin pages only
// ============================================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import { COLORS, SIZES } from '../../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';

interface LanguageSelectorProps {
  style?: any;
  showLabel?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  style, 
  showLabel = true 
}) => {
  const { currentLanguage, supportedLanguages, changeLanguage } = useLanguage();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Language code display mapping
  const getLanguageCode = (code: string) => {
    const codeMap: { [key: string]: string } = {
      'en': 'En',
      'ru': 'Ru', 
      'ar': 'Ar',
      'tr': 'Tr'
    };
    return codeMap[code] || 'En';
  };

  const handleLanguageSelect = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setIsModalVisible(false);
  };

  const renderLanguageItem = ({ item }: { item: typeof supportedLanguages[0] }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item.code === currentLanguage && styles.selectedLanguageItem
      ]}
      onPress={() => handleLanguageSelect(item.code)}
    >
      <Text style={[
        styles.languageName,
        item.code === currentLanguage && styles.selectedLanguageName
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.languageRow}>
        <View style={styles.globeContainer}>
          <Text style={styles.languageLabel}>Language</Text>
        </View>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setIsModalVisible(true)}
        >
          <View style={styles.selectorContent}>
            <View style={styles.currentLanguage}>
              <Text style={styles.currentLanguageText}>
                {getLanguageCode(currentLanguage)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Languages</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={supportedLanguages}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: getResponsiveSpacing(8),
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  globeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: getResponsiveSpacing(8),
  },
  globeIcon: {
    fontSize: getResponsiveFontSize(16),
    color: '#8B5CF6', // Purple color
  },
  languageLabel: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.black,
    fontFamily: 'Urbanist-Medium',
  },
  selector: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: getResponsiveSpacing(6),
    paddingVertical: getResponsiveSpacing(6),
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    width: 40,
  },
  selectorContent: {
    flexDirection: 'column',
  },
  label: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.grayscale600,
    marginBottom: getResponsiveSpacing(4),
  },
  currentLanguage: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLanguageText: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.black,
    fontFamily: 'Urbanist-Medium',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: getResponsiveSpacing(20),
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(20),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Urbanist-Bold',
    color: COLORS.black,
  },
  closeButton: {
    padding: getResponsiveSpacing(4),
  },
  closeButtonText: {
    fontSize: getResponsiveFontSize(24),
    color: COLORS.black,
    fontFamily: 'Urbanist-Medium',
  },
  languageList: {
    paddingHorizontal: getResponsiveSpacing(20),
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale100,
  },
  selectedLanguageItem: {
    backgroundColor: COLORS.primary + '10',
  },
  languageName: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Urbanist-Medium',
    color: COLORS.black,
  },
  selectedLanguageName: {
    color: COLORS.primary,
  },
});

export default LanguageSelector;
