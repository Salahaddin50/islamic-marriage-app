// Script to configure CORS for DigitalOcean Spaces
const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK for DigitalOcean
const spacesEndpoint = new AWS.Endpoint(process.env.EXPO_PUBLIC_DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.EXPO_PUBLIC_DO_SPACES_KEY,
  secretAccessKey: process.env.EXPO_PUBLIC_DO_SPACES_SECRET,
  region: process.env.EXPO_PUBLIC_DO_SPACES_REGION,
});

const corsConfiguration = {
  CORSRules: [
    {
      AllowedOrigins: [
        'http://localhost:8081',
        'http://localhost:8082',
        'http://127.0.0.1:8081',
        'http://127.0.0.1:8082',
        'https://*.vercel.app',
        '*'
      ],
      AllowedMethods: [
        'GET',
        'PUT',
        'POST',
        'DELETE',
        'HEAD',
        'OPTIONS'
      ],
      AllowedHeaders: [
        '*'
      ],
      ExposeHeaders: [
        'ETag',
        'x-amz-request-id',
        'x-amz-version-id'
      ],
      MaxAgeSeconds: 86400
    }
  ]
};

async function configureCORS() {
  try {
    console.log('🌊 Configuring CORS for DigitalOcean Space...');
    console.log('Space:', process.env.EXPO_PUBLIC_DO_SPACES_NAME);
    
    const params = {
      Bucket: process.env.EXPO_PUBLIC_DO_SPACES_NAME,
      CORSConfiguration: corsConfiguration
    };

    await s3.putBucketCors(params).promise();
    
    console.log('✅ CORS configuration applied successfully!');
    console.log('');
    console.log('📋 CORS Rules Applied:');
    console.log('   - Origins: localhost:8081, localhost:8082, *.vercel.app, *');
    console.log('   - Methods: GET, PUT, POST, DELETE, HEAD, OPTIONS');
    console.log('   - Headers: * (all)');
    console.log('   - Max Age: 24 hours');
    console.log('');
    console.log('🎉 Your Islamic marriage app can now upload photos!');
    console.log('');
    console.log('🔄 Please refresh your browser and try uploading again.');
    
  } catch (error) {
    console.error('❌ Failed to configure CORS:', error.message);
    console.log('');
    console.log('📋 Manual Setup Required:');
    console.log('1. Go to DigitalOcean Dashboard');
    console.log('2. Navigate to Spaces → islamic-marriage-photos-2025');
    console.log('3. Find Settings/API/Permissions tab');
    console.log('4. Add CORS configuration manually');
    console.log('');
    console.log('CORS JSON to paste:');
    console.log(JSON.stringify(corsConfiguration.CORSRules, null, 2));
  }
}

configureCORS();


