// ============================================================================
// RESPONSIVE UTILITIES - HUME ISLAMIC DATING APP
// ============================================================================
// Cross-platform responsive design utilities for consistent UI scaling
// ============================================================================

import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// ================================
// BREAKPOINTS
// ================================

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
} as const;

// ================================
// SCREEN TYPE DETECTION
// ================================

export const isMobileWeb = (): boolean => {
  if (Platform.OS !== 'web') return false;
  return width <= BREAKPOINTS.mobile;
};

export const isTabletWeb = (): boolean => {
  if (Platform.OS !== 'web') return false;
  return width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet;
};

export const isDesktopWeb = (): boolean => {
  if (Platform.OS !== 'web') return false;
  return width > BREAKPOINTS.tablet;
};

export const isLargeDesktop = (): boolean => {
  if (Platform.OS !== 'web') return false;
  return width > BREAKPOINTS.largeDesktop;
};

export const isMobile = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android' || isMobileWeb();
};

// ================================
// BASE DIMENSIONS
// ================================

const BASE_WIDTH = 375; // iPhone 8 width as reference
const BASE_HEIGHT = 812; // iPhone 8 height as reference

// ================================
// RESPONSIVE WIDTH
// ================================

export const getResponsiveWidth = (size: number): number => {
  if (Platform.OS === 'web') {
    if (isMobileWeb()) {
      return (width / BASE_WIDTH) * size * 0.95; // Slightly smaller for mobile web
    } else if (isTabletWeb()) {
      return (width / BASE_WIDTH) * size * 0.85; // Adjust for tablet
    } else if (isLargeDesktop()) {
      return (width / BASE_WIDTH) * size * 0.6; // Smaller for large screens
    }
    return (width / BASE_WIDTH) * size * 0.7; // Default desktop
  }
  
  // Native mobile platforms
  return (width / BASE_WIDTH) * size;
};

// ================================
// RESPONSIVE HEIGHT
// ================================

export const getResponsiveHeight = (size: number): number => {
  if (Platform.OS === 'web') {
    if (isMobileWeb()) {
      return (height / BASE_HEIGHT) * size * 0.95;
    } else if (isTabletWeb()) {
      return (height / BASE_HEIGHT) * size * 0.85;
    } else if (isLargeDesktop()) {
      return (height / BASE_HEIGHT) * size * 0.6;
    }
    return (height / BASE_HEIGHT) * size * 0.7;
  }
  
  // Native mobile platforms
  return (height / BASE_HEIGHT) * size;
};

// ================================
// RESPONSIVE FONT SIZE
// ================================

export const getResponsiveFontSize = (size: number): number => {
  if (Platform.OS === 'web') {
    if (isMobileWeb()) {
      return Math.max((width / BASE_WIDTH) * size * 0.9, size * 0.8); // Ensure minimum readability
    } else if (isTabletWeb()) {
      return (width / BASE_WIDTH) * size * 1.0;
    } else if (isLargeDesktop()) {
      return Math.min((width / BASE_WIDTH) * size * 1.1, size * 1.3); // Cap maximum size
    }
    return (width / BASE_WIDTH) * size * 1.05;
  }
  
  // Native mobile platforms
  const scale = width / BASE_WIDTH;
  return size * Math.min(scale, 1.2); // Cap scaling for very large devices
};

// ================================
// RESPONSIVE SPACING
// ================================

export const getResponsiveSpacing = (size: number): number => {
  if (Platform.OS === 'web') {
    if (isMobileWeb()) {
      return (width / BASE_WIDTH) * size * 0.85;
    } else if (isTabletWeb()) {
      return (width / BASE_WIDTH) * size * 1.0;
    } else if (isLargeDesktop()) {
      return (width / BASE_WIDTH) * size * 1.3;
    }
    return (width / BASE_WIDTH) * size * 1.15;
  }
  
  // Native mobile platforms
  return (width / BASE_WIDTH) * size;
};

// ================================
// RESPONSIVE BORDER RADIUS
// ================================

export const getResponsiveBorderRadius = (size: number): number => {
  if (Platform.OS === 'web') {
    if (isMobileWeb()) {
      return Math.max(size * 0.8, 4); // Minimum border radius
    } else if (isTabletWeb()) {
      return size;
    }
    return Math.min(size * 1.2, size + 8); // Cap maximum border radius
  }
  
  return size;
};

// ================================
// RESPONSIVE ICON SIZE
// ================================

export const getResponsiveIconSize = (size: number): number => {
  if (Platform.OS === 'web') {
    if (isMobileWeb()) {
      return Math.max(size * 0.85, 16); // Minimum icon size for touch
    } else if (isTabletWeb()) {
      return size * 0.95;
    } else if (isLargeDesktop()) {
      return Math.min(size * 1.1, size + 4);
    }
    return size;
  }
  
  return size;
};

// ================================
// RESPONSIVE LAYOUT VALUES
// ================================

export const getResponsiveLayoutValues = () => {
  const screenType = isMobileWeb() ? 'mobile' : isTabletWeb() ? 'tablet' : 'desktop';
  
  return {
    screenType,
    containerPadding: getResponsiveSpacing(16),
    sectionSpacing: getResponsiveSpacing(24),
    cardSpacing: getResponsiveSpacing(12),
    buttonHeight: isMobileWeb() ? 48 : isTabletWeb() ? 52 : 56,
    inputHeight: isMobileWeb() ? 48 : isTabletWeb() ? 52 : 56,
    headerHeight: isMobileWeb() ? 60 : isTabletWeb() ? 70 : 80,
    tabBarHeight: isMobileWeb() ? 70 : isTabletWeb() ? 80 : 90,
    maxContentWidth: isDesktopWeb() ? 800 : '100%',
    gridColumns: isMobileWeb() ? 1 : isTabletWeb() ? 2 : 3,
  };
};

// ================================
// RESPONSIVE BREAKPOINT HOOKS
// ================================

export const useResponsiveBreakpoint = () => {
  if (Platform.OS !== 'web') {
    return 'mobile';
  }
  
  if (isMobileWeb()) return 'mobile';
  if (isTabletWeb()) return 'tablet';
  if (isLargeDesktop()) return 'largeDesktop';
  return 'desktop';
};

// ================================
// RESPONSIVE STYLE HELPERS
// ================================

export const responsiveStyle = {
  // Text styles
  heading1: {
    fontSize: getResponsiveFontSize(28),
    lineHeight: getResponsiveFontSize(34),
  },
  heading2: {
    fontSize: getResponsiveFontSize(24),
    lineHeight: getResponsiveFontSize(30),
  },
  heading3: {
    fontSize: getResponsiveFontSize(20),
    lineHeight: getResponsiveFontSize(26),
  },
  body1: {
    fontSize: getResponsiveFontSize(16),
    lineHeight: getResponsiveFontSize(22),
  },
  body2: {
    fontSize: getResponsiveFontSize(14),
    lineHeight: getResponsiveFontSize(20),
  },
  caption: {
    fontSize: getResponsiveFontSize(12),
    lineHeight: getResponsiveFontSize(16),
  },
  
  // Common spacing
  spacing: {
    xs: getResponsiveSpacing(4),
    sm: getResponsiveSpacing(8),
    md: getResponsiveSpacing(16),
    lg: getResponsiveSpacing(24),
    xl: getResponsiveSpacing(32),
    xxl: getResponsiveSpacing(48),
  },
  
  // Common border radius
  borderRadius: {
    sm: getResponsiveBorderRadius(4),
    md: getResponsiveBorderRadius(8),
    lg: getResponsiveBorderRadius(12),
    xl: getResponsiveBorderRadius(16),
    pill: getResponsiveBorderRadius(50),
  },
};

// ================================
// SCREEN DIMENSION UTILITIES
// ================================

export const getScreenDimensions = () => ({
  width,
  height,
  isLandscape: width > height,
  isPortrait: height > width,
  aspectRatio: width / height,
});

// ================================
// RESPONSIVE CONTAINER STYLES
// ================================

export const getResponsiveContainer = (maxWidth?: number) => ({
  width: '100%',
  maxWidth: maxWidth || (isDesktopWeb() ? 800 : '100%'),
  marginHorizontal: 'auto' as const,
  paddingHorizontal: getResponsiveSpacing(16),
});

// ================================
// ISLAMIC UI SPECIFIC HELPERS
// ================================

export const getIslamicUISpacing = () => ({
  // Islamic form sections
  sectionSpacing: getResponsiveSpacing(32),
  preferenceGroupSpacing: getResponsiveSpacing(24),
  optionSpacing: getResponsiveSpacing(12),
  
  // Islamic cards and buttons
  islamicCardPadding: getResponsiveSpacing(20),
  prayerButtonSize: isMobileWeb() ? 48 : 56,
  madhubButtonHeight: isMobileWeb() ? 44 : 50,
  
  // Marriage preference specific
  marriageOptionSpacing: getResponsiveSpacing(16),
  polygamyCardSpacing: getResponsiveSpacing(20),
  wifeCountButtonSize: isMobileWeb() ? 50 : 56,
});

export default {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getResponsiveBorderRadius,
  getResponsiveIconSize,
  getResponsiveLayoutValues,
  getScreenDimensions,
  getResponsiveContainer,
  getIslamicUISpacing,
  isMobileWeb,
  isTabletWeb,
  isDesktopWeb,
  isMobile,
  responsiveStyle,
  BREAKPOINTS,
};

