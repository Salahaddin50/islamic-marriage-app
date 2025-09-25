// AWS SDK Configuration - Platform Safe
import { Platform } from 'react-native';

// Only import AWS SDK if we're on web platform
let AWS: any;

try {
  if (Platform.OS === 'web') {
    AWS = require('aws-sdk');
    
    // Configure AWS globally for browser environment
    AWS.config.update({
      region: process.env.EXPO_PUBLIC_DO_SPACES_REGION || 'nyc3',
      accessKeyId: process.env.EXPO_PUBLIC_DO_SPACES_KEY,
      secretAccessKey: process.env.EXPO_PUBLIC_DO_SPACES_SECRET,
    });

    // Set AWS to use the browser environment
    AWS.config.setPromisesDependency(null);
  } else {
    // For mobile platforms, create a minimal stub to prevent imports from failing
    AWS = {
      S3: class MockS3 {
        constructor(config?: any) {
          this.config = config;
        }
        upload(params: any) {
          return {
            promise: () => Promise.reject(new Error('Media uploads not supported on mobile. Please use the web version.'))
          };
        }
        getObject(params: any) {
          return {
            promise: () => Promise.reject(new Error('AWS operations not supported on mobile. Please use the web version.'))
          };
        }
        deleteObject(params: any) {
          return {
            promise: () => Promise.reject(new Error('AWS operations not supported on mobile. Please use the web version.'))
          };
        }
        headObject(params: any) {
          return {
            promise: () => Promise.reject(new Error('AWS operations not supported on mobile. Please use the web version.'))
          };
        }
        listObjectsV2(params: any) {
          return {
            promise: () => Promise.reject(new Error('AWS operations not supported on mobile. Please use the web version.'))
          };
        }
        private config: any;
      },
      config: {
        update: () => {},
        setPromisesDependency: () => {},
      },
      Endpoint: class MockEndpoint {
        constructor(endpoint?: string) {
          this.endpoint = endpoint;
        }
        private endpoint: string | undefined;
      }
    };
  }
} catch (error) {
  console.log('AWS SDK initialization error (expected on mobile):', error);
  // Fallback stub if anything goes wrong
  AWS = {
    S3: class FallbackS3 {
      constructor() {}
      upload() { return { promise: () => Promise.reject(new Error('AWS not available')) }; }
      getObject() { return { promise: () => Promise.reject(new Error('AWS not available')) }; }
      deleteObject() { return { promise: () => Promise.reject(new Error('AWS not available')) }; }
      headObject() { return { promise: () => Promise.reject(new Error('AWS not available')) }; }
      listObjectsV2() { return { promise: () => Promise.reject(new Error('AWS not available')) }; }
    },
    config: { update: () => {}, setPromisesDependency: () => {} },
    Endpoint: class { constructor() {} }
  };
}

export default AWS;










