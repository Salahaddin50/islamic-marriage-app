// Global polyfills for DigitalOcean and AWS SDK
import { Buffer } from 'buffer';
import { Platform } from 'react-native';

// react-native-get-random-values is handled via metro resolver alias

// Make Buffer available globally for AWS SDK
if (typeof global !== 'undefined') {
  global.Buffer = Buffer;
}

// Also add to window for web environments
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
}

// Polyfill for react-native-get-random-values on web
if (Platform.OS === 'web') {
  // Use crypto.getRandomValues if available, otherwise use Math.random as fallback
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Modern browsers have crypto.getRandomValues
    const getRandomValues = (array: any) => {
      return window.crypto.getRandomValues(array);
    };
    
    // Make it available globally for react-native-gifted-chat
    if (!(window as any).getRandomValues) {
      (window as any).getRandomValues = getRandomValues;
    }
  }
}

export {};










