import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { getContainerWidth, getResponsiveSpacing, isMobileWeb, isTabletWeb } from '@/utils/responsive';
import { COLORS } from '@/constants';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  centered?: boolean;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  style, 
  padding = true, 
  centered = false 
}) => {
  const containerStyle = [
    styles.container,
    padding && styles.padding,
    centered && styles.centered,
    {
      width: getContainerWidth(),
      maxWidth: isMobileWeb() ? '100%' : isTabletWeb() ? 600 : 800,
    },
    style,
  ];

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: COLORS.white,
  },
  padding: {
    paddingHorizontal: getResponsiveSpacing(16),
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ResponsiveContainer;
