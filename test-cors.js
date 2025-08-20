// Simple CORS test for DigitalOcean Spaces
async function testCORS() {
  try {
    console.log('🧪 Testing CORS configuration...');
    
    const spaceName = 'islamic-marriage-photos-2025';
    const region = 'lon1';
    const testUrl = `https://${spaceName}.${region}.digitaloceanspaces.com/`;
    
    console.log('Testing URL:', testUrl);
    
    // Test a simple HEAD request to check CORS
    const response = await fetch(testUrl, {
      method: 'HEAD',
      mode: 'cors'
    });
    
    console.log('✅ CORS test passed!');
    console.log('Response status:', response.status);
    console.log('🎉 Your photo uploads should work now!');
    
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure you saved the CORS configuration in DigitalOcean');
    console.log('2. Wait 1-2 minutes for changes to take effect');
    console.log('3. Try refreshing your browser completely');
  }
}

// Run the test
testCORS();


