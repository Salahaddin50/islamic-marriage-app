import { ViewStyle, TouchableWithoutFeedback, Animated } from 'react-native';
import React, { useCallback, useRef } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { isMobileWeb } from '../utils/responsive';

interface SwipeCardButtonProps {
  name: any; // Name of the FontAwesome icon
  size: number; // Size of the icon
  color: string; // Color of the icon and border
  style?: ViewStyle; // Optional additional style for the button
  onPress?: () => void; // Optional function to handle button press
}

const SwipeCardButton: React.FC<SwipeCardButtonProps> = ({ name, size, color, style, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateScale = useCallback(
    (newValue: number) => {
      Animated.spring(scale, {
        toValue: newValue,
        useNativeDriver: true,
        friction: 4,
      }).start();
    },
    [scale]
  );

  return (
    <TouchableWithoutFeedback
      onPressIn={() => animateScale(0.6)}
      onPressOut={() => {
        animateScale(1);
        if (onPress) onPress();
      }}
      delayPressIn={0}
      delayPressOut={100}
    >
      <Animated.View
        style={{
          height: isMobileWeb() ? 55 : 60,
          width: isMobileWeb() ? 55 : 60,
          backgroundColor: 'white',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          borderRadius: isMobileWeb() ? 27.5 : 30,
          justifyContent: 'center',
          alignItems: 'center',
          borderColor: color,
          borderWidth: 1.2,
          transform: [{ scale: scale }],
          ...style,
        }}
      >
        <FontAwesome name={name} size={size} color={color} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default SwipeCardButton;
