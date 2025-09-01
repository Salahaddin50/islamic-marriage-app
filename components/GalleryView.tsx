import React, { memo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import OptimizedMatchCard from './OptimizedMatchCard';
import { COLORS } from '@/constants';

export interface GalleryItem {
  id: string;
  name: string;
  age: number;
  image: any;
  height?: string;
  weight?: string;
  country?: string;
  city?: string;
  locked?: boolean;
  onPress?: () => void;
}

interface GalleryViewProps {
  data: GalleryItem[];
  cardWidth: number;
  cardHeight: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  footer?: React.ReactNode;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
}

const GalleryView: React.FC<GalleryViewProps> = ({ 
  data, 
  cardWidth, 
  cardHeight,
  onEndReached,
  onEndReachedThreshold,
  footer,
  initialNumToRender,
  maxToRenderPerBatch,
  windowSize,
  removeClippedSubviews
}) => {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      onEndReachedThreshold={onEndReachedThreshold}
      onEndReached={onEndReached}
      ListFooterComponent={footer || null}
      renderItem={({ item, index }) => (
        <View style={[styles.cardWrapper, { width: cardWidth, height: cardHeight }]}> 
          <OptimizedMatchCard
            id={item.id}
            name={item.name}
            age={item.age}
            image={item.image}
            height={item.height}
            weight={item.weight}
            country={item.country}
            city={item.city}
            locked={item.locked}
            index={index}
            onPress={item.onPress}
            containerStyle={{ width: '100%', height: '100%' }}
          />
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 140,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white
  },
  cardWrapper: {
    alignSelf: 'center',
    marginBottom: 12,
  }
});

export default memo(GalleryView);


