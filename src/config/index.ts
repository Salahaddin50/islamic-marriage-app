// ============================================================================
// ENTERPRISE CONFIGURATION - HUME DATING APP
// ============================================================================
// Environment-based configuration management for scalable deployment
// Supports development, staging, and production environments
// ============================================================================

import Constants from 'expo-constants';

// ================================
// ENVIRONMENT DETECTION
// ================================

export const ENV = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

export type Environment = typeof ENV[keyof typeof ENV];

export const getCurrentEnvironment = (): Environment => {
  if (__DEV__) return ENV.DEVELOPMENT;
  
  const releaseChannel = Constants.expoConfig?.releaseChannel;
  if (releaseChannel === 'staging') return ENV.STAGING;
  
  return ENV.PRODUCTION;
};

export const isDevelopment = getCurrentEnvironment() === ENV.DEVELOPMENT;
export const isStaging = getCurrentEnvironment() === ENV.STAGING;
export const isProduction = getCurrentEnvironment() === ENV.PRODUCTION;

// ================================
// API CONFIGURATION
// ================================

const API_ENDPOINTS = {
  [ENV.DEVELOPMENT]: {
    BASE_URL: 'http://localhost:3000/api/v1',
    WS_URL: 'ws://localhost:3000',
    UPLOAD_URL: 'http://localhost:3000/api/v1/upload',
  },
  [ENV.STAGING]: {
    BASE_URL: 'https://api-staging.hume-dating.com/api/v1',
    WS_URL: 'wss://api-staging.hume-dating.com',
    UPLOAD_URL: 'https://api-staging.hume-dating.com/api/v1/upload',
  },
  [ENV.PRODUCTION]: {
    BASE_URL: 'https://api.hume-dating.com/api/v1',
    WS_URL: 'wss://api.hume-dating.com',
    UPLOAD_URL: 'https://api.hume-dating.com/api/v1/upload',
  },
};

export const API_CONFIG = API_ENDPOINTS[getCurrentEnvironment()];

// ================================
// AUTHENTICATION CONFIGURATION
// ================================

export const AUTH_CONFIG = {
  // JWT Token Configuration
  ACCESS_TOKEN_KEY: '@hume_access_token',
  REFRESH_TOKEN_KEY: '@hume_refresh_token',
  USER_DATA_KEY: '@hume_user_data',
  
  // Token Expiry (in milliseconds)
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // OAuth Configuration
  GOOGLE_CLIENT_ID: {
    [ENV.DEVELOPMENT]: 'dev-google-client-id',
    [ENV.STAGING]: 'staging-google-client-id',
    [ENV.PRODUCTION]: 'prod-google-client-id',
  },
  FACEBOOK_APP_ID: {
    [ENV.DEVELOPMENT]: 'dev-facebook-app-id',
    [ENV.STAGING]: 'staging-facebook-app-id',
    [ENV.PRODUCTION]: 'prod-facebook-app-id',
  },
  APPLE_CLIENT_ID: {
    [ENV.DEVELOPMENT]: 'dev.hume.dating',
    [ENV.STAGING]: 'staging.hume.dating',
    [ENV.PRODUCTION]: 'com.hume.dating',
  },
};

// ================================
// CHAT & REAL-TIME CONFIGURATION
// ================================

export const CHAT_CONFIG = {
  // WebSocket Configuration
  RECONNECT_INTERVAL: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  
  // Message Configuration
  MAX_MESSAGE_LENGTH: 1000,
  MAX_IMAGES_PER_MESSAGE: 5,
  TYPING_INDICATOR_TIMEOUT: 3000, // 3 seconds
  
  // File Upload Configuration
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/mov'],
};

// ================================
// MATCHING & DISCOVERY CONFIGURATION
// ================================

export const MATCHING_CONFIG = {
  // Discovery Settings
  DEFAULT_RADIUS: 50, // kilometers
  MAX_RADIUS: 100, // kilometers
  MIN_RADIUS: 1, // kilometers
  
  // Age Range Settings
  MIN_AGE: 18,
  MAX_AGE: 80,
  DEFAULT_AGE_RANGE: [22, 35] as [number, number],
  
  // Swipe Settings
  DAILY_LIKE_LIMIT: {
    FREE: 10,
    PREMIUM: 100,
    PLATINUM: -1, // unlimited
  },
  DAILY_SUPER_LIKE_LIMIT: {
    FREE: 1,
    PREMIUM: 5,
    PLATINUM: 10,
  },
  
  // Algorithm Settings
  COMPATIBILITY_WEIGHTS: {
    interests: 0.3,
    lifestyle: 0.25,
    values: 0.25,
    preferences: 0.2,
  },
};

// ================================
// PUSH NOTIFICATION CONFIGURATION
// ================================

export const NOTIFICATION_CONFIG = {
  // Expo Push Notifications
  EXPO_PROJECT_ID: Constants.expoConfig?.extra?.eas?.projectId,
  
  // Notification Types
  CATEGORIES: {
    NEW_MATCH: 'new_match',
    NEW_MESSAGE: 'new_message',
    PROFILE_VISIT: 'profile_visit',
    SUPER_LIKE: 'super_like',
    SYSTEM: 'system',
  },
  
  // Timing Configuration
  QUIET_HOURS: {
    START: 22, // 10 PM
    END: 8,    // 8 AM
  },
  
  // Batch Settings
  BATCH_SIZE: 1000,
  BATCH_DELAY: 1000, // 1 second between batches
};

// ================================
// PAYMENT & SUBSCRIPTION CONFIGURATION
// ================================

export const PAYMENT_CONFIG = {
  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: {
    [ENV.DEVELOPMENT]: 'pk_test_dev_key',
    [ENV.STAGING]: 'pk_test_staging_key',
    [ENV.PRODUCTION]: 'pk_live_production_key',
  },
  
  // Subscription Plans
  PLANS: {
    PREMIUM: {
      MONTHLY: 'premium_monthly',
      YEARLY: 'premium_yearly',
    },
    PLATINUM: {
      MONTHLY: 'platinum_monthly',
      YEARLY: 'platinum_yearly',
    },
  },
  
  // Feature Access
  FEATURES: {
    FREE: ['basic_swipe', 'limited_likes', 'basic_filters'],
    PREMIUM: ['unlimited_likes', 'rewind', 'boost', 'advanced_filters', 'read_receipts'],
    PLATINUM: ['priority_likes', 'super_boost', 'see_who_likes', 'message_before_match'],
  },
};

// ================================
// MEDIA & UPLOAD CONFIGURATION
// ================================

export const MEDIA_CONFIG = {
  // Image Configuration
  MAX_PROFILE_PHOTOS: 6,
  PHOTO_UPLOAD_QUALITY: 0.8,
  THUMBNAIL_SIZE: { width: 300, height: 300 },
  PREVIEW_SIZE: { width: 800, height: 800 },
  
  // Video Configuration
  MAX_VIDEO_DURATION: 30, // seconds
  VIDEO_QUALITY: 'high',
  
  // CDN Configuration
  CDN_BASE_URL: {
    [ENV.DEVELOPMENT]: 'http://localhost:3000/uploads',
    [ENV.STAGING]: 'https://cdn-staging.hume-dating.com',
    [ENV.PRODUCTION]: 'https://cdn.hume-dating.com',
  },
  
  // Image Processing
  IMAGE_FORMATS: ['webp', 'jpeg', 'png'],
  AUTO_OPTIMIZATION: true,
};

// ================================
// SECURITY CONFIGURATION
// ================================

export const SECURITY_CONFIG = {
  // Rate Limiting
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: 5,
    PASSWORD_RESET: 3,
    SWIPES_PER_MINUTE: 60,
    MESSAGES_PER_MINUTE: 20,
  },
  
  // Validation Rules
  PASSWORD_REQUIREMENTS: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
  },
  
  // Biometric Settings
  BIOMETRIC_PROMPT: {
    TITLE: 'Authenticate with Biometrics',
    SUBTITLE: 'Use your fingerprint or face to access Hume',
    FALLBACK_TITLE: 'Use PIN instead',
  },
  
  // Content Moderation
  CONTENT_FILTERING: {
    ENABLE_AUTO_MODERATION: true,
    PROFANITY_FILTER: true,
    IMAGE_MODERATION: true,
    REPORT_THRESHOLD: 3,
  },
};

// ================================
// ANALYTICS & MONITORING CONFIGURATION
// ================================

export const ANALYTICS_CONFIG = {
  // Event Tracking
  TRACK_USER_ACTIONS: !isDevelopment,
  TRACK_PERFORMANCE: true,
  TRACK_ERRORS: true,
  
  // Analytics Providers
  MIXPANEL_TOKEN: {
    [ENV.DEVELOPMENT]: 'dev_mixpanel_token',
    [ENV.STAGING]: 'staging_mixpanel_token',
    [ENV.PRODUCTION]: 'prod_mixpanel_token',
  },
  
  // Error Monitoring
  SENTRY_DSN: {
    [ENV.DEVELOPMENT]: null,
    [ENV.STAGING]: 'staging_sentry_dsn',
    [ENV.PRODUCTION]: 'prod_sentry_dsn',
  },
  
  // Performance Monitoring
  PERFORMANCE_SAMPLE_RATE: isDevelopment ? 1.0 : 0.1,
};

// ================================
// FEATURE FLAGS CONFIGURATION
// ================================

export const FEATURE_FLAGS = {
  // Core Features
  ENABLE_VIDEO_CHAT: false,
  ENABLE_VOICE_MESSAGES: true,
  ENABLE_STORIES: false,
  ENABLE_LIVE_STREAMING: false,
  
  // Experimental Features
  ENABLE_AI_MATCHING: false,
  ENABLE_PERSONALITY_QUIZ: true,
  ENABLE_ICEBREAKERS: true,
  ENABLE_BLIND_DATES: false,
  
  // Business Features
  ENABLE_PREMIUM_ANALYTICS: true,
  ENABLE_REFERRAL_PROGRAM: true,
  ENABLE_GIFT_SUBSCRIPTIONS: false,
  
  // Development Features
  ENABLE_DEBUG_MODE: isDevelopment,
  ENABLE_MOCK_DATA: isDevelopment,
  SHOW_PERFORMANCE_METRICS: isDevelopment,
};

// ================================
// CACHE CONFIGURATION
// ================================

export const CACHE_CONFIG = {
  // TTL Settings (Time To Live in milliseconds)
  USER_PROFILE_TTL: 5 * 60 * 1000, // 5 minutes
  MATCHES_TTL: 10 * 60 * 1000, // 10 minutes
  DISCOVERY_TTL: 2 * 60 * 1000, // 2 minutes
  CHAT_MESSAGES_TTL: 60 * 60 * 1000, // 1 hour
  
  // Cache Sizes
  MAX_CACHED_PROFILES: 100,
  MAX_CACHED_IMAGES: 50,
  MAX_CACHED_MESSAGES: 1000,
  
  // Prefetch Settings
  PREFETCH_PROFILES: 10,
  PREFETCH_IMAGES: 5,
};

// ================================
// DEVELOPMENT CONFIGURATION
// ================================

export const DEV_CONFIG = {
  // Debug Settings
  ENABLE_REACTOTRON: isDevelopment,
  ENABLE_FLIPPER: isDevelopment,
  LOG_LEVEL: isDevelopment ? 'debug' : 'error',
  
  // Mock Data
  USE_MOCK_API: false,
  MOCK_DELAY: 1000, // 1 second delay for mock API calls
  
  // Testing
  E2E_TEST_MODE: false,
  BYPASS_AUTH: false,
};

// ================================
// EXPORT CONSOLIDATED CONFIG
// ================================

export const CONFIG = {
  ENV: getCurrentEnvironment(),
  API: API_CONFIG,
  AUTH: AUTH_CONFIG,
  CHAT: CHAT_CONFIG,
  MATCHING: MATCHING_CONFIG,
  NOTIFICATIONS: NOTIFICATION_CONFIG,
  PAYMENT: PAYMENT_CONFIG,
  MEDIA: MEDIA_CONFIG,
  SECURITY: SECURITY_CONFIG,
  ANALYTICS: ANALYTICS_CONFIG,
  FEATURES: FEATURE_FLAGS,
  CACHE: CACHE_CONFIG,
  DEV: DEV_CONFIG,
} as const;

export default CONFIG;
