// Test script to verify Vercel routing
const https = require('https');
const url = process.argv[2] || 'https://your-app-url.vercel.app';

console.log(`Testing routing for: ${url}`);

// Test the base URL
testUrl(url);

// Test a non-existent path to verify SPA routing
testUrl(`${url}/test-route`);

function testUrl(testUrl) {
  console.log(`\nTesting URL: ${testUrl}`);
  
  https.get(testUrl, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Route is working correctly!');
        // Check if the response contains our test page content
        if (data.includes('Zawajplus App Test Page')) {
          console.log('✅ Test page content found!');
        } else {
          console.log('❌ Test page content not found in response.');
        }
      } else {
        console.log('❌ Route returned non-200 status code.');
      }
    });
  }).on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
}

console.log('\nNote: After deployment, run this script with:');
console.log('node scripts/test-vercel-routing.js https://your-app-url.vercel.app');
