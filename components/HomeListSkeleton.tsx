import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

interface HomeListSkeletonProps {
  isGalleryView: boolean;
  numItems?: number;
}

const SkeletonCard: React.FC<{ width: number | string; height: number; borderRadius?: number }>
= ({ width, height, borderRadius = 16 }) => (
  <View style={{ width, height, borderRadius, backgroundColor: COLORS.grayscale200, opacity: 0.7 }} />
);

const HomeListSkeleton: React.FC<HomeListSkeletonProps> = ({ isGalleryView, numItems = 6 }) => {
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

  // grid (2 columns)
  return (
    <View style={styles.container}>
      <View style={styles.gridRow}>
        {items.map((_, idx) => (
          <View key={idx} style={styles.gridItem}>
            <SkeletonCard width={'100%'} height={220} />
          </View>
        ))}
      </View>
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
