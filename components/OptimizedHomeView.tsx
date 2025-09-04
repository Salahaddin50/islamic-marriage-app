/**
 * React Query optimized home view component
 * Demonstrates the performance benefits of React Query caching
 */

import React, { useCallback, useMemo } from 'react';
import { View, ActivityIndicator, RefreshControl } from 'react-native';
import { useProfilesInfinite, ProfileFilters } from '../src/hooks/useProfilesQuery';
import GalleryView from './GalleryView';
import GridView from './GridView';
import { COLORS } from '../constants';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

interface OptimizedHomeViewProps {
  filters: ProfileFilters;
  isGalleryView: boolean;
  cardWidth: number;
  cardHeight: number;
  gridSpacing: number;
  desktopColumns: number;
  onCardPress: (userId: string) => void;
}

export const OptimizedHomeView: React.FC<OptimizedHomeViewProps> = ({
  filters,
  isGalleryView,
  cardWidth,
  cardHeight,
  gridSpacing,
  desktopColumns,
  onCardPress,
}) => {
  const navigation = useNavigation<NavigationProp<any>>();

  // Use React Query for optimized data fetching
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useProfilesInfinite(filters);

  // Flatten all pages into a single array
  const profiles = useMemo(() => {
    return data?.pages.flatMap(page => page.profiles) ?? [];
  }, [data?.pages]);

  // Memoized data with onPress handlers
  const mappedData = useMemo(() => {
    return profiles.map(profile => ({
      ...profile,
      onPress: () => onCardPress(profile.user_id)
    }));
  }, [profiles, onCardPress]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Error state
  if (isError) {
    console.error('Profile loading error:', error);
    // Fallback to empty state or error component
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const refreshControl = (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={handleRefresh}
      colors={[COLORS.primary]}
      tintColor={COLORS.primary}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      {isGalleryView ? (
        <GalleryView
          data={mappedData}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          onEndReachedThreshold={0.2}
          onEndReached={handleLoadMore}
          footer={isFetchingNextPage ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null}
          // Add refresh control for pull-to-refresh
          refreshControl={refreshControl}
        />
      ) : (
        <GridView
          data={mappedData}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          spacing={gridSpacing}
          numColumns={desktopColumns}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          onEndReachedThreshold={0.2}
          onEndReached={handleLoadMore}
          footer={isFetchingNextPage ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null}
          // Add refresh control for pull-to-refresh
          refreshControl={refreshControl}
        />
      )}
    </View>
  );
};

export default OptimizedHomeView;
