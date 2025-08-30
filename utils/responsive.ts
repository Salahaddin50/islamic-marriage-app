import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Breakpoints for responsive design
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1200,
};

// Get responsive width
export const getResponsiveWidth = (percentage: number): number => {
  if (Platform.OS === 'web') {
    // For web, use viewport width or max width for better UX
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : screenWidth;
    const maxWidth = Math.min(viewportWidth, 600); // Max width for mobile-like experience
    return (percentage / 100) * maxWidth;
  }
  return (percentage / 100) * screenWidth;
};

// Get responsive height
export const getResponsiveHeight = (percentage: number): number => {
  if (Platform.OS === 'web') {
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : screenHeight;
    return (percentage / 100) * viewportHeight;
  }
  return (percentage / 100) * screenHeight;
};

// Get responsive font size
export const getResponsiveFontSize = (size: number): number => {
  if (Platform.OS === 'web') {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : screenWidth;
    
    if (viewportWidth <= BREAKPOINTS.mobile) {
      return size * 0.9; // Slightly smaller on mobile web
    } else if (viewportWidth <= BREAKPOINTS.tablet) {
      return size * 1.0; // Normal size on tablet
    } else {
      return size * 1.1; // Slightly larger on desktop
    }
  }
  return size;
};

// Get responsive padding/margin
export const getResponsiveSpacing = (spacing: number): number => {
  if (Platform.OS === 'web') {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : screenWidth;
    
    if (viewportWidth <= BREAKPOINTS.mobile) {
      return Math.max(spacing * 0.8, 8); // Minimum spacing of 8
    } else if (viewportWidth <= BREAKPOINTS.tablet) {
      return spacing;
    } else {
      return spacing * 1.2;
    }
  }
  return spacing;
};

// Check if current screen size is mobile
export const isMobileWeb = (): boolean => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.innerWidth <= BREAKPOINTS.mobile;
  }
  return false;
};

// Check if current screen size is tablet
export const isTabletWeb = (): boolean => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.innerWidth > BREAKPOINTS.mobile && window.innerWidth <= BREAKPOINTS.tablet;
  }
  return false;
};

// Check if current screen size is desktop
export const isDesktopWeb = (): boolean => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.innerWidth > BREAKPOINTS.tablet;
  }
  return false;
};

// Get responsive container width
export const getContainerWidth = (): number => {
  if (Platform.OS === 'web') {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : screenWidth;
    
    if (viewportWidth <= BREAKPOINTS.mobile) {
      return Math.min(viewportWidth - 32, 400); // Mobile: full width minus padding, max 400
    } else if (viewportWidth <= BREAKPOINTS.tablet) {
      return Math.min(viewportWidth - 64, 600); // Tablet: with more side padding, max 600
    } else {
      return Math.min(viewportWidth - 128, 800); // Desktop: centered with max width
    }
  }
  return screenWidth - 32;
};

// Updated SIZES object with responsive values
export const RESPONSIVE_SIZES = {
  // Global SIZES
  base: 8,
  font: 14,
  radius: 30,
  padding: getResponsiveSpacing(8),
  padding2: getResponsiveSpacing(12),
  padding3: getResponsiveSpacing(16),

  // FONTS Sizes - responsive
  largeTitle: getResponsiveFontSize(50),
  h1: getResponsiveFontSize(36),
  h2: getResponsiveFontSize(22),
  h3: getResponsiveFontSize(16),
  h4: getResponsiveFontSize(14),
  body1: getResponsiveFontSize(30),
  body2: getResponsiveFontSize(20),
  body3: getResponsiveFontSize(16),
  body4: getResponsiveFontSize(14),

  // App Dimensions - responsive
  width: getContainerWidth(),
  height: getResponsiveHeight(100),
  screenWidth,
  screenHeight,
};

// Safe navigation utility for handling back navigation when history is lost
export const safeGoBack = (navigation: any, router: any, fallbackRoute: string = '/(tabs)/home') => {
  try {
    // First try the standard navigation back
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    
    // If navigation doesn't work, try router back
    if (router?.canGoBack && router.canGoBack()) {
      router.back();
      return;
    }
    
    // If both fail, navigate to fallback route
    if (router?.replace) {
      router.replace(fallbackRoute);
    } else if (router?.push) {
      router.push(fallbackRoute);
    } else if (navigation?.navigate) {
      navigation.navigate(fallbackRoute);
    }
  } catch (error) {
    // Last resort: redirect to home on web or navigate to fallback
    console.warn('Navigation failed, using fallback:', error);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.history.length > 1 ? window.history.back() : window.location.href = '/';
      } catch {
        window.location.href = '/';
      }
    } else if (router?.replace) {
      router.replace(fallbackRoute);
    }
  }
};