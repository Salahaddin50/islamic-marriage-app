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
}

const GridView: React.FC<GridViewProps> = ({ 
  data, cardWidth, cardHeight, spacing,
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
      numColumns={2}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      onEndReachedThreshold={onEndReachedThreshold}
      onEndReached={onEndReached}
      ListFooterComponent={footer || null}
      columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: spacing }}
      contentContainerStyle={[styles.container, { paddingBottom: 140 }]}
      renderItem={({ item, index }) => (
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
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white
  },
});

export default memo(GridView);


