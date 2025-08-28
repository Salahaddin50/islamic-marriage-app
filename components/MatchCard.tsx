import React, { useState, memo, useEffect } from 'react';
import { View, Text, StyleSheet, ImageSourcePropType, TouchableOpacity, ViewStyle, ImageStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import type { StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants';

interface MatchCardProps {
  name: string;
  age: number;
  image: ImageSourcePropType;
  height?: string;
  weight?: string;
  country?: string;
  city?: string;
  // Backwards-compat optional fields
  location?: string;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  backgroundStyle?: StyleProp<ViewStyle>;
  nameStyle?: StyleProp<TextStyle>;
  positionStyle?: StyleProp<TextStyle>;
  viewContainerStyle?: StyleProp<ViewStyle>;
}

const MatchCard: React.FC<MatchCardProps> = ({
  name,
  age,
  image,
  height,
  weight,
  country,
  city,
  // optional legacy props
  location,
  onPress,
  containerStyle,
  imageStyle,
  backgroundStyle,
  nameStyle,
  positionStyle,
  viewContainerStyle,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, containerStyle]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
      <Image
        source={image}
        contentFit="cover"
        contentPosition="top"
        style={[styles.image, imageStyle]}
        cachePolicy="memory-disk"
        transition={200}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(150, 16, 255, 0.8)', 'rgba(150, 16, 255, 0.9)']}
        style={[styles.background, backgroundStyle]}
      >
        <View style={[styles.viewContainer, viewContainerStyle]}>
          <Text style={[styles.name, nameStyle]}>{name}, {age}</Text>
          {(height || weight) ? (
            <Text style={[styles.position, positionStyle]}>{[height, weight].filter(Boolean).join(', ')}</Text>
          ) : null}
          {(country || city) ? (
            <Text style={[styles.position, positionStyle]}>{[country, city].filter(Boolean).join(', ')}</Text>
          ) : null}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 212,
    aspectRatio: 212 / 316,
    borderRadius: 32,
    marginRight: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.grayscale200,
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  background: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 100,
    width: '100%',
    borderBottomRightRadius: 32,
    borderBottomLeftRadius: 32,
    overflow: 'hidden',
  },
  name: {
    fontSize: 18,
    fontFamily: 'bold',
    color: 'white',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  position: {
    fontSize: 14,
    fontFamily: 'medium',
    color: 'white',
    paddingTop: 4,
    paddingHorizontal: 12,
    opacity: 0.9,
  },
  viewContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    width: '100%',
    height: 80,
  },
});

export default memo(MatchCard);
