import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SIZES } from '@/constants';
import { getResponsiveFontSize, getResponsiveSpacing } from '@/utils/responsive';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonPlaceholderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  marginBottom?: number;
}

const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> = ({ 
  width, 
  height, 
  borderRadius = 8, 
  marginBottom = 0 
}) => {
  return (
    <View 
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          marginBottom,
        }
      ]} 
    />
  );
};

const MatchDetailsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Image Skeleton */}
      <View style={styles.headerImageContainer}>
        <SkeletonPlaceholder 
          width="100%" 
          height={300} 
          borderRadius={0}
        />
        
        {/* Header Navigation Skeleton */}
        <View style={styles.headerOverlay}>
          <SkeletonPlaceholder width={40} height={40} borderRadius={20} />
          <View style={styles.headerRightIcons}>
            <SkeletonPlaceholder width={40} height={40} borderRadius={20} />
            <SkeletonPlaceholder width={40} height={40} borderRadius={20} />
          </View>
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.contentContainer}>
        {/* Name and Age */}
        <SkeletonPlaceholder 
          width="70%" 
          height={28} 
          marginBottom={getResponsiveSpacing(8)} 
        />
        
        {/* Location */}
        <SkeletonPlaceholder 
          width="50%" 
          height={16} 
          marginBottom={getResponsiveSpacing(20)} 
        />

        {/* Media Gallery Section */}
        <SkeletonPlaceholder 
          width="40%" 
          height={18} 
          marginBottom={getResponsiveSpacing(12)} 
        />
        
        {/* Media Thumbnails */}
        <View style={styles.mediaThumbnailsContainer}>
          {[1, 2, 3, 4].map((item) => (
            <SkeletonPlaceholder 
              key={item}
              width={80} 
              height={80} 
              borderRadius={8}
            />
          ))}
        </View>

        {/* About Section */}
        <SkeletonPlaceholder 
          width="30%" 
          height={18} 
          marginBottom={getResponsiveSpacing(12)} 
        />
        
        <SkeletonPlaceholder 
          width="100%" 
          height={16} 
          marginBottom={getResponsiveSpacing(8)} 
        />
        <SkeletonPlaceholder 
          width="90%" 
          height={16} 
          marginBottom={getResponsiveSpacing(8)} 
        />
        <SkeletonPlaceholder 
          width="80%" 
          height={16} 
          marginBottom={getResponsiveSpacing(20)} 
        />

        {/* Details Section */}
        <SkeletonPlaceholder 
          width="35%" 
          height={18} 
          marginBottom={getResponsiveSpacing(12)} 
        />

        {/* Detail Items */}
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View key={item} style={styles.detailItemSkeleton}>
            <SkeletonPlaceholder width="30%" height={14} />
            <SkeletonPlaceholder width="50%" height={14} />
          </View>
        ))}

        {/* Islamic Information Section */}
        <SkeletonPlaceholder 
          width="50%" 
          height={18} 
          marginBottom={getResponsiveSpacing(12)} 
        />

        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.detailItemSkeleton}>
            <SkeletonPlaceholder width="35%" height={14} />
            <SkeletonPlaceholder width="45%" height={14} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  skeleton: {
    backgroundColor: COLORS.grayscale200,
    opacity: 0.7,
  },
  headerImageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  headerOverlay: {
    position: 'absolute',
    top: 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRightIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: COLORS.white,
    borderTopRightRadius: 32,
    borderTopLeftRadius: 32,
    marginTop: -32,
  },
  mediaThumbnailsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: getResponsiveSpacing(24),
  },
  detailItemSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(12),
  },
});

export default MatchDetailsSkeleton;
