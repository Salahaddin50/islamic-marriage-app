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
  getItemLayout?: (data: any, index: number) => { length: number; offset: number; index: number };
  refreshControl?: React.ReactElement;
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
  removeClippedSubviews,
  getItemLayout,
  refreshControl
}) => {
  // Memoized render function for better performance
  const renderItem = React.useCallback(({ item, index }: { item: GalleryItem; index: number }) => (
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
  ), [cardWidth, cardHeight]);

  // Memoized key extractor
  const keyExtractor = React.useCallback((item: GalleryItem) => item.id, []);

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.container}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      onEndReachedThreshold={onEndReachedThreshold}
      onEndReached={onEndReached}
      ListFooterComponent={footer || null}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      refreshControl={refreshControl}
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


