import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SIZES } from '@/constants';
import { isDesktopWeb } from '@/utils/responsive';

interface DesktopMobileNoticeProps {
  delayMs?: number;
  message?: string;
}

const DesktopMobileNotice: React.FC<DesktopMobileNoticeProps> = ({
  delayMs = 2000,
  message = 'This project is optimized for mobile. For the best experience, please use a mobile phone.'
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!isDesktopWeb()) return;
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  if (Platform.OS !== 'web') return null;
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={() => setVisible(false)}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: COLORS.white }]}> 
          <Text style={[styles.title, { color: COLORS.black }]}>Mobile Experience Recommended</Text>
          <Text style={[styles.subtitle, { color: COLORS.greyscale900 }]}>{message}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.primary }]} onPress={() => setVisible(false)}>
            <Text style={[styles.buttonText, { color: COLORS.white }]}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  card: {
    width: Math.min(SIZES.width - 40, 420),
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'regular',
    textAlign: 'center',
    marginBottom: 14,
  },
  button: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'semiBold'
  }
});

export default DesktopMobileNotice;
