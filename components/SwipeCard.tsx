import { View, Text, StyleSheet, Image, Animated, StyleProp, ViewStyle, ImageSourcePropType } from 'react-native';
import React, { Fragment, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SIZES } from '@/constants';
import Choice from './Choice';
import { getResponsiveWidth, getResponsiveHeight, getResponsiveFontSize, isMobileWeb } from '@/utils/responsive';

interface SwipeCardProps {
  name: string;
  location: string;
  age: number;
  distance: number;
  image: ImageSourcePropType;
  isFirst: boolean;
  swipe: Animated.ValueXY;
  titlSign: Animated.Value;
  style?: StyleProp<ViewStyle>;
  [key: string]: any; // Allow additional props (e.g., panResponder handlers)
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  name,
  location,
  age,
  distance,
  image,
  isFirst,
  swipe,
  titlSign,
  ...rest
}) => {
  const rotate = Animated.multiply(swipe.x, titlSign).interpolate({
    inputRange: [-100, 0, 100],
    outputRange: ['8deg', '0deg', '-8deg'],
  });

  const animatedCardStyle = {
    transform: [...swipe.getTranslateTransform(), { rotate }],
  };

  const likeOpacity = swipe.x.interpolate({
    inputRange: [25, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = swipe.x.interpolate({
    inputRange: [-100, -25],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const renderChoice = useCallback(() => (
    <Fragment>
      <Animated.View
        style={[
          styles.choiceContainer,
          styles.likeContainer,
          { opacity: likeOpacity },
        ]}
      >
        <Choice type="like" />
      </Animated.View>
      <Animated.View
        style={[
          styles.choiceContainer,
          styles.nopeContainer,
          { opacity: nopeOpacity },
        ]}
      >
        <Choice type="nope" />
      </Animated.View>
    </Fragment>
  ), [likeOpacity, nopeOpacity]);

  return (
    <Animated.View
      style={[styles.container, isFirst && animatedCardStyle]}
      {...rest} 
    >
      <Image source={image} style={styles.image} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      >
        <View style={styles.userContainer}>
          <Text style={styles.name}>
            {name}, {age}
          </Text>
          <Text style={styles.location}>Live in {location}</Text>
          <Text style={styles.distance}>{distance} miles away</Text>
        </View>
      </LinearGradient>
      {isFirst && renderChoice()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 25,
  },
  image: {
    width: getResponsiveWidth(90),
    height: isMobileWeb() ? getResponsiveHeight(65) : SIZES.height - 280,
    borderRadius: 30,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
  },
  userContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
  },
  name: {
    fontSize: 30,
    color: 'white',
    fontFamily: "bold"
  },
  location: {
    fontSize: 18,
    color: 'white',
    fontFamily: "semiBold",
    marginVertical: 4
  },
  distance: {
    fontSize: 14,
    color: 'white',
    fontFamily: "regular"
  },
  choiceContainer: {
    position: 'absolute',
    top: 100,
    zIndex: 9999,
  },
  likeContainer: {
    left: 45,
    transform: [{ rotate: '-30deg' }],
  },
  nopeContainer: {
    right: 45,
    transform: [{ rotate: '30deg' }],
  },
});

export default SwipeCard;
