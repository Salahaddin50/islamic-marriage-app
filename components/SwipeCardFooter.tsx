import { View } from 'react-native';
import React from 'react';
import SwipeCardButton from './SwipeCardButton';
import { getResponsiveWidth, getResponsiveSpacing, isMobileWeb } from '../utils/responsive';

const COLORS = {
  like: '#00eda6',
  nope: '#ff006f',
  star: '#07A6FF',
};

interface SwipeCardFooterProps {
  handleChoice: (direction: number) => void; // Function to handle swipe direction (-1 for nope, 1 for like)
}

const SwipeCardFooter: React.FC<SwipeCardFooterProps> = ({ handleChoice }) => {
  const buttonWidth = isMobileWeb() ? getResponsiveWidth(70) : 240;
  
  return (
    <View
      style={{
        position: 'absolute',
        bottom: isMobileWeb() ? 100 : 80, // More space from bottom on mobile
        width: buttonWidth,
        alignSelf: 'center', // Center the footer
        left: '50%',
        marginLeft: -(buttonWidth / 2), // Center using negative margin
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9999, // Higher z-index to ensure visibility
        paddingHorizontal: getResponsiveSpacing(10),
        // Debug: Add background to ensure visibility
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        paddingVertical: getResponsiveSpacing(10),
      }}
    >
      <SwipeCardButton
        name="times"
        size={24}
        color={COLORS.nope}
        onPress={() => handleChoice(-1)}
      />
      <SwipeCardButton
        name="star"
        size={24}
        color={COLORS.star}
        style={{
          height: 40,
          width: 40,
        }}
      />
      <SwipeCardButton
        name="heart"
        size={24}
        color={COLORS.like}
        onPress={() => handleChoice(1)}
      />
    </View>
  );
};

export default SwipeCardFooter;
