import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '@/constants';
import { useProfilePictureSimple } from '@/hooks/useProfilePictureSimple';

interface SimpleAvatarProps {
  size: number;
  displayName?: string;
  forceRefresh?: number;
  userId?: string;
  onPress?: () => void;
}

const SimpleAvatar: React.FC<SimpleAvatarProps> = ({ 
  size, 
  displayName = '', 
  forceRefresh,
  userId,
  onPress 
}) => {
  const { imageSource, isLoading } = useProfilePictureSimple(forceRefresh, userId);
  
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden' as const,
    backgroundColor: COLORS.grayscale200,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  if (isLoading) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <View style={containerStyle}>
      <Image
        source={imageSource}
        style={{
          width: size,
          height: size,
        }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        onError={() => {
          // Show initial letter on error
        }}
      />
      {/* Fallback text overlay for when image fails to load */}
      <View style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: COLORS.primary,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0, // Hidden by default, will show if image fails
        }
      ]}>
        <Text style={{
          fontSize: size * 0.4,
          fontWeight: 'bold',
          color: COLORS.white,
          textAlign: 'center'
        }}>
          {initial}
        </Text>
      </View>
    </View>
  );
};

export default SimpleAvatar;
