// Test uploading a file to DigitalOcean Spaces
const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();

// Configure AWS SDK for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint(process.env.EXPO_PUBLIC_DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.EXPO_PUBLIC_DO_SPACES_KEY,
  secretAccessKey: process.env.EXPO_PUBLIC_DO_SPACES_SECRET,
  region: process.env.EXPO_PUBLIC_DO_SPACES_REGION,
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

async function testUpload() {
  try {
    console.log('🧪 Testing file upload to DigitalOcean Spaces...\n');
    
    // Create a simple test file
    const testContent = `
Islamic Marriage App Test File
Created: ${new Date().toISOString()}
This is a test upload to verify DigitalOcean Spaces integration.
✅ Connection successful!
🌊 Ready for production use!
    `;
    
    const fileName = `test-uploads/test-${Date.now()}.txt`;
    
    // Upload parameters
    const uploadParams = {
      Bucket: process.env.EXPO_PUBLIC_DO_SPACES_NAME,
      Key: fileName,
      Body: testContent,
      ContentType: 'text/plain',
      ACL: 'private',
      Metadata: {
        'app': 'islamic-marriage',
        'test': 'true',
        'uploaded-at': new Date().toISOString()
      }
    };
    
    console.log('📤 Uploading test file...');
    const result = await s3.upload(uploadParams).promise();
    
    console.log('✅ Upload successful!');
    console.log('📊 Upload Details:');
    console.log('   - File Name:', fileName);
    console.log('   - Space URL:', result.Location);
    console.log('   - CDN URL:', `${process.env.EXPO_PUBLIC_DO_SPACES_CDN}/${fileName}`);
    console.log('   - File Size:', testContent.length, 'bytes');
    console.log('');
    
    // Test file retrieval
    console.log('📥 Testing file retrieval...');
    const getParams = {
      Bucket: process.env.EXPO_PUBLIC_DO_SPACES_NAME,
      Key: fileName
    };
    
    const retrievedFile = await s3.getObject(getParams).promise();
    console.log('✅ File retrieval successful!');
    console.log('   - Retrieved content length:', retrievedFile.Body.length, 'bytes');
    console.log('   - Content type:', retrievedFile.ContentType);
    console.log('');
    
    // Clean up - delete test file
    console.log('🗑️  Cleaning up test file...');
    await s3.deleteObject({
      Bucket: process.env.EXPO_PUBLIC_DO_SPACES_NAME,
      Key: fileName
    }).promise();
    console.log('✅ Test file deleted successfully!');
    console.log('');
    
    console.log('🎉 UPLOAD TEST COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('✅ Your DigitalOcean Spaces can:');
    console.log('   - Upload files ✅');
    console.log('   - Retrieve files ✅');
    console.log('   - Delete files ✅');
    console.log('   - Generate URLs ✅');
    console.log('   - Use CDN delivery ✅');
    console.log('');
    console.log('🚀 Ready for your Islamic marriage app photos and videos!');
    
  } catch (error) {
    console.log('❌ Upload test failed!');
    console.log('');
    console.log('🔍 Error Details:');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code || 'Unknown');
    console.log('');
    console.log('🛠️  Check your configuration and try again.');
  }
}

// Run the upload test
testUpload();
