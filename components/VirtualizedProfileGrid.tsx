/**
 * High-performance virtualized profile grid
 * Handles thousands of profiles without performance degradation
 * Inspired by Instagram/TikTok infinite feeds
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import { FlatGrid } from 'react-native-super-grid';
import OptimizedMatchCard from './OptimizedMatchCard';
import { COLORS } from '../constants';
import { isDesktopWeb } from '../utils/responsive';

export interface VirtualizedProfileItem {
  id: string;
  user_id: string;
  name: string;
  age: number;
  image: any;
  height?: string;
  weight?: string;
  country?: string;
  city?: string;
  locked?: boolean;
  index?: number;
}

interface VirtualizedProfileGridProps {
  data: VirtualizedProfileItem[];
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onCardPress: (userId: string) => void;
  numColumns?: number;
  itemSpacing?: number;
  containerPadding?: number;
  estimatedItemSize?: number;
  maxItemsToRender?: number;
  windowSize?: number;
  initialNumToRender?: number;
}

const VirtualizedProfileGrid: React.FC<VirtualizedProfileGridProps> = ({
  data,
  onEndReached,
  onEndReachedThreshold = 0.2,
  isLoading = false,
  isFetchingMore = false,
  onRefresh,
  isRefreshing = false,
  onCardPress,
  numColumns,
  itemSpacing = 16,
  containerPadding = 16,
  estimatedItemSize = 280,
  maxItemsToRender = 50,
  windowSize = 5,
  initialNumToRender = 8,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const flatGridRef = useRef<any>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Determine optimal number of columns based on screen size
  const columns = useMemo(() => {
    if (numColumns) return numColumns;
    
    if (isDesktopWeb()) {
      return Math.floor(screenWidth / 300); // Desktop: ~300px per item
    } else {
      return screenWidth > 600 ? 3 : 2; // Mobile: 2-3 columns
    }
  }, [numColumns, screenWidth]);

  // Calculate item dimensions
  const itemDimension = useMemo(() => {
    const availableWidth = screenWidth - (containerPadding * 2);
    const totalSpacing = itemSpacing * (columns - 1);
    return Math.floor((availableWidth - totalSpacing) / columns);
  }, [screenWidth, containerPadding, itemSpacing, columns]);

  // Memoized render function with performance optimizations
  const renderItem = useCallback(({ item, index }: { item: VirtualizedProfileItem; index: number }) => {
    // Skip rendering items that are too far from viewport for better performance
    const isVisible = Math.abs(index - Math.floor(scrollOffset / estimatedItemSize)) < maxItemsToRender;
    
    if (!isVisible && index > initialNumToRender) {
      // Return lightweight placeholder for far-away items
      return (
        <View 
          style={{
            width: itemDimension,
            height: estimatedItemSize,
            backgroundColor: COLORS.grayscale100,
            borderRadius: 16,
          }}
        />
      );
    }

    return (
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
        onPress={() => onCardPress(item.user_id)}
        containerStyle={{
          width: itemDimension,
          height: estimatedItemSize,
        }}
      />
    );
  }, [itemDimension, estimatedItemSize, maxItemsToRender, initialNumToRender, scrollOffset, onCardPress]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: VirtualizedProfileItem) => item.id, []);

  // Handle scroll for viewport tracking
  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    setScrollOffset(offset);
  }, []);

  // Optimized item layout calculation
  const getItemLayout = useCallback((_: any, index: number) => {
    const rowIndex = Math.floor(index / columns);
    const itemHeight = estimatedItemSize + itemSpacing;
    return {
      length: itemHeight,
      offset: rowIndex * itemHeight,
      index,
    };
  }, [columns, estimatedItemSize, itemSpacing]);

  // Loading footer component
  const renderFooter = useCallback(() => {
    if (!isFetchingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [isFetchingMore]);

  // Empty state component
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <View style={styles.emptyIconInner} />
        </View>
      </View>
    );
  }, [isLoading]);

  // Refresh control
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    
    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        colors={[COLORS.primary]}
        tintColor={COLORS.primary}
        progressBackgroundColor={COLORS.white}
      />
    );
  }, [onRefresh, isRefreshing]);

  // Performance optimization: memoize data with indices
  const dataWithIndices = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      index,
    }));
  }, [data]);

  if (isLoading && data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatGrid
        ref={flatGridRef}
        itemDimension={itemDimension}
        data={dataWithIndices}
        style={styles.grid}
        spacing={itemSpacing}
        staticDimension={screenWidth}
        fixed={true}
        maxDimension={itemDimension}
        
        // Performance optimizations
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialNumToRender={initialNumToRender}
        maxToRenderPerBatch={8}
        windowSize={windowSize}
        removeClippedSubviews={true}
        
        // Infinite scroll
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        
        // Scroll handling
        onScroll={handleScroll}
        scrollEventThrottle={16}
        
        // Pull to refresh
        refreshControl={refreshControl}
        
        // Styling
        contentContainerStyle={[
          styles.contentContainer,
          { paddingHorizontal: containerPadding }
        ]}
        showsVerticalScrollIndicator={false}
        
        // Additional performance props
        legacyImplementation={false}
        disableVirtualization={false}
        updateCellsBatchingPeriod={50}
        
        // Accessibility
        accessible={true}
        accessibilityRole="grid"
        accessibilityLabel="Profile grid"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  grid: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 140, // Space for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.grayscale100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.grayscale200,
  },
});

export default React.memo(VirtualizedProfileGrid);
