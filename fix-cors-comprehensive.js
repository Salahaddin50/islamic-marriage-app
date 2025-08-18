// Comprehensive CORS fix for DigitalOcean Spaces
// This script creates a proper CORS configuration for file uploads

console.log('🔧 Creating comprehensive CORS configuration...');

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: [
        'http://localhost:8080',
        'http://localhost:8081', 
        'http://localhost:8082',
        'http://localhost:3000',
        'http://localhost:19006',
        'https://localhost:8080',
        'https://localhost:8081', 
        'https://localhost:8082',
        'https://localhost:3000',
        'https://localhost:19006',
        // Add your production domains here when deploying
        // 'https://yourapp.com',
        // 'https://www.yourapp.com'
      ],
      AllowedMethods: [
        'GET',
        'HEAD', 
        'PUT',
        'POST',
        'DELETE',
        'OPTIONS'
      ],
      AllowedHeaders: [
        '*'
      ],
      ExposeHeaders: [
        'ETag',
        'x-amz-meta-custom-header',
        'x-amz-request-id',
        'x-amz-id-2'
      ],
      MaxAgeSeconds: 3600
    }
  ]
};

console.log('\n📋 CORS Configuration to apply:');
console.log(JSON.stringify(corsConfig, null, 2));

console.log('\n🎯 INSTRUCTIONS:');
console.log('1. Copy the CORS configuration above');
console.log('2. Go to DigitalOcean Control Panel');
console.log('3. Navigate to: Spaces → islamic-marriage-photos-2025 → Settings → CORS');
console.log('4. REPLACE the existing CORS configuration with the one above');
console.log('5. Click "Save"');
console.log('6. Wait 1-2 minutes for changes to propagate');
console.log('\n✨ This configuration specifically enables PUT requests for file uploads!');

// Test function to verify CORS after configuration
console.log('\n🧪 After applying CORS, run this test:');
console.log('node test-cors-upload.js');
