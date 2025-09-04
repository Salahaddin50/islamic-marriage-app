import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '@/constants';

interface HomeListSkeletonProps {
  isGalleryView: boolean;
  numItems?: number;
}

const SkeletonCard: React.FC<{ width: number | string; height: number; borderRadius?: number }>
= ({ width, height, borderRadius = 16 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View 
      style={{ 
        width, 
        height, 
        borderRadius, 
        backgroundColor: COLORS.grayscale200, 
        opacity 
      }} 
    />
  );
};

const HomeListSkeleton: React.FC<HomeListSkeletonProps> = ({ isGalleryView, numItems = 12 }) => {
  const items = Array.from({ length: numItems });

  if (isGalleryView) {
    return (
      <View style={styles.container}>
        {items.map((_, idx) => (
          <View key={idx} style={{ marginBottom: 16 }}>
            <SkeletonCard width={'100%'} height={280} />
          </View>
        ))}
      </View>
    );
  }

  // grid (2 columns) - arrange in rows of 2
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.gridRow}>
          {row.map((_, idx) => (
            <View key={`${rowIdx}-${idx}`} style={styles.gridItem}>
              <SkeletonCard width={'100%'} height={220} />
            </View>
          ))}
          {/* Fill empty space if odd number of items in last row */}
          {row.length === 1 && <View style={styles.gridItem} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
});

export default HomeListSkeleton;
