import { View } from 'react-native';
import React from 'react';
import SwipeCardButton from './SwipeCardButton';
import { getResponsiveWidth, getResponsiveSpacing, isMobileWeb } from '../utils/responsive';
import { icons } from '../constants';

const COLORS = {
  like: '#00eda6',
  nope: '#ff006f',
  star: '#07A6FF',
};

interface SwipeCardFooterProps {
  handleChoice: (direction: number) => void; // Function to handle swipe direction (-1 for nope, 1 for like)
}

const SwipeCardFooter: React.FC<SwipeCardFooterProps> = ({ handleChoice }) => {
  const buttonWidth = isMobileWeb() ? getResponsiveWidth(75) : 260; // Slightly wider for better button spacing
  
  return (
    <View
      style={{
        position: 'absolute',
        bottom: isMobileWeb() ? 110 : 95, // Optimally positioned between card and tabs
        width: buttonWidth,
        alignSelf: 'center', // Center the footer
        left: '50%',
        marginLeft: -(buttonWidth / 2), // Center using negative margin
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9999, // Higher z-index to ensure visibility
        paddingHorizontal: getResponsiveSpacing(16),
        // Semi-transparent background for better visibility
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 25,
        paddingVertical: getResponsiveSpacing(12),
        // Add subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <SwipeCardButton
        name={icons.close}
        size={isMobileWeb() ? 22 : 26}
        color={COLORS.nope}
        onPress={() => handleChoice(-1)}
        useCustomIcon={true}
        style={{
          height: isMobileWeb() ? 58 : 65,
          width: isMobileWeb() ? 58 : 65,
        }}
      />
      <SwipeCardButton
        name={icons.star}
        size={isMobileWeb() ? 24 : 28}
        color={COLORS.star}
        useCustomIcon={true}
        style={{
          height: isMobileWeb() ? 50 : 58,
          width: isMobileWeb() ? 50 : 58,
        }}
      />
      <SwipeCardButton
        name={icons.heart}
        size={isMobileWeb() ? 22 : 26}
        color={COLORS.like}
        onPress={() => handleChoice(1)}
        useCustomIcon={true}
        style={{
          height: isMobileWeb() ? 58 : 65,
          width: isMobileWeb() ? 58 : 65,
        }}
      />
    </View>
  );
};

export default SwipeCardFooter;
