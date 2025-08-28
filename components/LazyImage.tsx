import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { COLORS } from '@/constants';

interface LazyImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  fallbackSource?: { uri: string } | number;
  placeholder?: boolean;
  placeholderColor?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  source,
  fallbackSource,
  placeholder = true,
  placeholderColor = COLORS.grayscale200,
  style,
  onError,
  onLoad,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    if (fallbackSource && !useFallback) {
      setUseFallback(true);
      setHasError(false);
    } else {
      setHasError(true);
    }
    onError?.(error);
  };

  const imageSource = useFallback && fallbackSource ? fallbackSource : source;

  return (
    <View style={[style, styles.container]}>
      {isLoading && placeholder && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder, { backgroundColor: placeholderColor }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
      
      {!hasError && (
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          onLoad={handleLoad}
          onError={handleError}
          cachePolicy="memory-disk"
          transition={200}
          {...props}
        />
      )}
      
      {hasError && (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <View style={styles.errorPlaceholder} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.grayscale200,
  },
  errorPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.grayscale400,
    borderRadius: 12,
  },
});

export default LazyImage;
