/**
 * Ultra-optimized match card for high-performance scrolling
 * Inspired by Instagram/TikTok feed cards
 */

import React, { useState, memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants';

interface OptimizedMatchCardProps {
  id: string;
  name: string;
  age: number;
  image: any;
  height?: string;
  weight?: string;
  country?: string;
  city?: string;
  onPress?: () => void;
  containerStyle?: ViewStyle;
  locked?: boolean;
  index: number; // For lazy loading optimization
}

const OptimizedMatchCard: React.FC<OptimizedMatchCardProps> = memo(({
  id,
  name,
  age,
  image,
  height,
  weight,
  country,
  city,
  onPress,
  containerStyle,
  locked = false,
  index
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoized image source
  const imageSource = React.useMemo(() => {
    if (typeof image === 'object' && image?.uri) {
      // Use direct URL for better caching
      const uri = image.uri.includes('.cdn.') 
        ? image.uri.replace('.cdn.digitaloceanspaces.com', '.digitaloceanspaces.com')
        : image.uri;
      return { uri };
    }
    return image;
  }, [image]);

  // Memoized location text
  const locationText = React.useMemo(() => {
    const parts = [country, city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }, [country, city]);

  // Memoized physical text
  const physicalText = React.useMemo(() => {
    const parts = [height, weight].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }, [height, weight]);

  // Memoized name display
  const displayName = React.useMemo(() => {
    const fullName = `${name}, ${age}`;
    return fullName.length > 16 ? fullName.slice(0, 16) + '…' : fullName;
  }, [name, age]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.container, containerStyle]}
      activeOpacity={0.85}
    >
      {/* Optimized Image with lazy loading */}
      <Image
        source={imageSource}
        contentFit="cover"
        contentPosition="top"
        style={styles.image}
        blurRadius={locked ? 15 : 0}
        cachePolicy="memory-disk"
        transition={imageLoaded ? 200 : 0}
        priority={index < 6 ? "high" : "normal"}
        onLoad={handleImageLoad}
        onError={handleImageError}
        placeholder={{
          uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
        }}
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(150, 16, 255, 0.8)', 'rgba(150, 16, 255, 0.9)']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {physicalText ? (
            <Text style={styles.details} numberOfLines={1}>
              {physicalText}
            </Text>
          ) : null}
          {locationText ? (
            <Text style={styles.location} numberOfLines={1}>
              {locationText}
            </Text>
          ) : null}
        </View>
      </LinearGradient>

      {/* Lock overlay */}
      {locked && (
        <View style={styles.lockOverlay} pointerEvents="none">
          <View style={styles.lockIcon}>
            <Text style={styles.lockText}>🔒</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Optimized shallow comparison
  return (
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.age === nextProps.age &&
    prevProps.locked === nextProps.locked &&
    prevProps.height === nextProps.height &&
    prevProps.weight === nextProps.weight &&
    prevProps.country === nextProps.country &&
    prevProps.city === nextProps.city &&
    JSON.stringify(prevProps.image) === JSON.stringify(nextProps.image)
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.grayscale200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
  },
  content: {
    padding: 12,
    paddingBottom: 16,
  },
  name: {
    fontSize: 16,
    fontFamily: 'bold',
    color: 'white',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  details: {
    fontSize: 13,
    fontFamily: 'medium',
    color: 'white',
    opacity: 0.9,
    marginBottom: 1,
  },
  location: {
    fontSize: 12,
    fontFamily: 'regular',
    color: 'white',
    opacity: 0.8,
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  lockIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: 14,
  },
});

OptimizedMatchCard.displayName = 'OptimizedMatchCard';

export default OptimizedMatchCard;
