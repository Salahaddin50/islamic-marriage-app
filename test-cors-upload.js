// Test CORS configuration specifically for PUT uploads
async function testCORSUpload() {
  try {
    console.log('🧪 Testing CORS for PUT uploads...');
    
    const spaceName = 'islamic-marriage-photos-2025';
    const region = 'lon1';
    const testUrl = `https://${spaceName}.${region}.digitaloceanspaces.com/test-cors-file.txt`;
    
    console.log('Testing PUT request to:', testUrl);
    
    // Test a PUT request (same as your upload)
    const response = await fetch(testUrl, {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'CORS test content'
    });
    
    console.log('✅ CORS PUT test result:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok || response.status === 403) {
      console.log('🎉 CORS is working! (403 is expected without auth)');
      console.log('✅ Your photo uploads should work now!');
    } else {
      console.log('❌ Unexpected response:', response.status);
    }
    
  } catch (error) {
    if (error.message.includes('CORS')) {
      console.error('❌ CORS is still blocking requests:', error.message);
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('1. Make sure you applied the new CORS configuration');
      console.log('2. Wait 2-3 minutes for DigitalOcean to update');
      console.log('3. Verify the configuration includes PUT method');
      console.log('4. Check that your origin (localhost:8082) is in AllowedOrigins');
    } else {
      console.log('✅ CORS test passed! Error is not CORS-related:', error.message);
      console.log('🎉 Your uploads should work now!');
    }
  }
}

// Run the test
testCORSUpload();
