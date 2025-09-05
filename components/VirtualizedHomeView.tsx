/**
 * Ultimate performance home view with virtual scrolling
 * Combines all optimizations: materialized view + React Query + virtual scrolling
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { useOptimizedProfilesComplete } from '../src/hooks/useOptimizedProfiles';
import VirtualizedProfileGrid from './VirtualizedProfileGrid';
import GalleryView from './GalleryView';
import { COLORS } from '../constants';
import { isDesktopWeb } from '../utils/responsive';
import type { OptimizedProfileFilters } from '../src/services/optimized-profiles.service';

interface VirtualizedHomeViewProps {
  filters: OptimizedProfileFilters;
  onCardPress: (userId: string) => void;
  isGalleryView?: boolean;
  showAnalytics?: boolean;
}

const VirtualizedHomeView: React.FC<VirtualizedHomeViewProps> = ({
  filters,
  onCardPress,
  isGalleryView = false,
  showAnalytics = false,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [viewMode, setViewMode] = useState<'grid' | 'gallery'>(isGalleryView ? 'gallery' : 'grid');

  // Use the ultimate optimized hook
  const {
    profiles,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
    analytics,
    analyticsLoading,
    isUsingOptimizedView,
    viewStatus,
    refreshView,
    isRefreshingView,
  } = useOptimizedProfilesComplete(filters);

  // Calculate optimal dimensions
  const dimensions = useMemo(() => {
    const isDesktop = isDesktopWeb();
    const containerPadding = 16;
    const itemSpacing = isDesktop ? 20 : 16;
    
    let numColumns: number;
    let itemSize: number;
    
    if (viewMode === 'gallery') {
      numColumns = 1;
      itemSize = Math.min(screenWidth - (containerPadding * 2), 400);
    } else {
      if (isDesktop) {
        numColumns = Math.floor(screenWidth / 280);
        numColumns = Math.max(2, Math.min(numColumns, 6)); // Between 2-6 columns
      } else {
        numColumns = screenWidth > 600 ? 3 : 2;
      }
      
      const availableWidth = screenWidth - (containerPadding * 2);
      const totalSpacing = itemSpacing * (numColumns - 1);
      itemSize = Math.floor((availableWidth - totalSpacing) / numColumns);
    }

    return {
      numColumns,
      itemSize,
      itemSpacing,
      containerPadding,
      estimatedItemSize: viewMode === 'gallery' ? 320 : 280,
    };
  }, [screenWidth, viewMode]);

  // Handle load more with throttling
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && profiles.length > 0) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, profiles.length]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Memoized profile data for virtual grid
  const virtualizedData = useMemo(() => {
    return profiles.map((profile, index) => ({
      ...profile,
      index,
      locked: !profile.unlocked,
    }));
  }, [profiles]);

  // Performance indicator component
  const PerformanceIndicator = useMemo(() => {
    if (!showAnalytics || analyticsLoading) return null;

    return (
      <View style={styles.performanceIndicator}>
        <Text style={styles.performanceText}>
          {isUsingOptimizedView ? '🚀 Optimized' : '⚡ Standard'} • {profiles.length} profiles
          {analytics?.total && ` • ${analytics.total} total`}
        </Text>
        {viewStatus && !viewStatus.exists && (
          <Text style={styles.warningText}>
            Materialized view unavailable - using fallback
          </Text>
        )}
      </View>
    );
  }, [showAnalytics, analyticsLoading, isUsingOptimizedView, profiles.length, analytics?.total, viewStatus]);

  // Error handling
  if (isError && !profiles.length) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error?.message || 'Failed to load profiles'}
        </Text>
        <Text style={styles.retryText} onPress={handleRefresh}>
          Tap to retry
        </Text>
      </View>
    );
  }

  // Gallery view for single column
  if (viewMode === 'gallery') {
    const galleryData = virtualizedData.map(item => ({
      ...item,
      onPress: () => onCardPress(item.user_id),
    }));

    return (
      <View style={styles.container}>
        {PerformanceIndicator}
        <GalleryView
          data={galleryData}
          cardWidth={dimensions.itemSize}
          cardHeight={dimensions.estimatedItemSize}
          initialNumToRender={4}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={true}
          onEndReachedThreshold={0.2}
          onEndReached={handleLoadMore}
          footer={isFetchingNextPage ? (
            <View style={styles.loadingFooter}>
              <Text style={styles.loadingText}>Loading more profiles...</Text>
            </View>
          ) : null}
        />
      </View>
    );
  }

  // Virtual grid view for optimal performance
  return (
    <View style={styles.container}>
      {PerformanceIndicator}
      <VirtualizedProfileGrid
        data={virtualizedData}
        onCardPress={onCardPress}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        isLoading={isLoading}
        isFetchingMore={isFetchingNextPage}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        numColumns={dimensions.numColumns}
        itemSpacing={dimensions.itemSpacing}
        containerPadding={dimensions.containerPadding}
        estimatedItemSize={dimensions.estimatedItemSize}
        maxItemsToRender={100} // Handle up to 100 items in viewport
        windowSize={8} // Larger window for smoother scrolling
        initialNumToRender={dimensions.numColumns * 4} // Load 4 rows initially
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  performanceIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.grayscale50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale100,
  },
  performanceText: {
    fontSize: 12,
    color: COLORS.grayscale600,
    fontFamily: 'medium',
  },
  warningText: {
    fontSize: 11,
    color: COLORS.warning,
    fontFamily: 'regular',
    marginTop: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.grayscale700,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'medium',
  },
  retryText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: 'semibold',
    textDecorationLine: 'underline',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.grayscale600,
    fontFamily: 'medium',
  },
});

export default React.memo(VirtualizedHomeView);
