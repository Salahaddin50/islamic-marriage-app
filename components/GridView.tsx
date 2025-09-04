import React, { memo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import OptimizedMatchCard from './OptimizedMatchCard';
import { COLORS } from '@/constants';

export interface GridItem {
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

interface GridViewProps {
  data: GridItem[];
  cardWidth: number;
  cardHeight: number;
  spacing: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  footer?: React.ReactNode;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  numColumns?: number;
}

const GridView: React.FC<GridViewProps> = ({ 
  data, cardWidth, cardHeight, spacing,
  onEndReached,
  onEndReachedThreshold,
  footer,
  initialNumToRender,
  maxToRenderPerBatch,
  windowSize,
  removeClippedSubviews,
  numColumns = 2,
}) => {
  // Memoized render function for better performance
  const renderItem = React.useCallback(({ item, index }: { item: GridItem; index: number }) => (
    <View style={{ width: cardWidth, height: cardHeight }}>
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
  const keyExtractor = React.useCallback((item: GridItem) => item.id, []);

  // Memoized column wrapper style
  const columnWrapperStyle = React.useMemo(() => ({ 
    justifyContent: 'space-between' as const, 
    marginBottom: spacing 
  }), [spacing]);

  return (
    <FlatList
      key={`grid-${numColumns}`}
      data={data}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      onEndReachedThreshold={onEndReachedThreshold}
      onEndReached={onEndReached}
      ListFooterComponent={footer || null}
      columnWrapperStyle={columnWrapperStyle}
      contentContainerStyle={[styles.container, { paddingBottom: 140 }]}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
});

export default GridView;


