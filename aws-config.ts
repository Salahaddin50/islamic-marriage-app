// AWS SDK Configuration for Browser Environment
import AWS from 'aws-sdk';

// Configure AWS globally for browser environment
AWS.config.update({
  region: process.env.EXPO_PUBLIC_DO_SPACES_REGION || 'nyc3',
  accessKeyId: process.env.EXPO_PUBLIC_DO_SPACES_KEY || 'dummy_key_for_build',
  secretAccessKey: process.env.EXPO_PUBLIC_DO_SPACES_SECRET || 'dummy_secret_for_build',
});

// Set AWS to use the browser environment
AWS.config.setPromisesDependency(null);

// Log warning if using dummy credentials
if (process.env.EXPO_PUBLIC_DO_SPACES_KEY === undefined || process.env.EXPO_PUBLIC_DO_SPACES_SECRET === undefined) {
  console.warn('AWS credentials not configured. Media upload functionality will not work.');
}

export default AWS;
