// AWS SDK Configuration for Browser Environment
import AWS from 'aws-sdk';

// Configure AWS globally for browser environment
AWS.config.update({
  region: process.env.EXPO_PUBLIC_DO_SPACES_REGION || 'nyc3',
  accessKeyId: process.env.EXPO_PUBLIC_DO_SPACES_KEY,
  secretAccessKey: process.env.EXPO_PUBLIC_DO_SPACES_SECRET,
});

// Set AWS to use the browser environment
AWS.config.setPromisesDependency(null);

export default AWS;









