import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants';

export default function PaymentError() {
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/membership?tab=payments');
    }, 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white }}>
      <ActivityIndicator color={COLORS.primary} />
    </View>
  );
}


