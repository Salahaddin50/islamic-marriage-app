// Script to prepare Expo web build for Vercel deployment
const fs = require('fs');
const path = require('path');

console.log('Preparing Expo web build for Vercel deployment...');

// Paths
const rootDir = path.join(__dirname, '..');
const webBuildDir = path.join(rootDir, 'web-build');
const testBuildDir = path.join(rootDir, 'web-build-test');
const fallbackHtml = path.join(testBuildDir, 'fallback.html');

// Ensure web-build directory exists
if (!fs.existsSync(webBuildDir)) {
  console.log('Creating web-build directory...');
  fs.mkdirSync(webBuildDir, { recursive: true });
}

// Check if index.html exists in web-build
const indexPath = path.join(webBuildDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.warn('WARNING: index.html not found in web-build directory.');
  
  // Copy fallback.html to index.html if it exists
  if (fs.existsSync(fallbackHtml)) {
    console.log('Copying fallback.html to index.html...');
    fs.copyFileSync(fallbackHtml, indexPath);
  } else {
    console.error('ERROR: fallback.html not found in web-build-test directory.');
    // Create a simple index.html
    console.log('Creating a simple index.html...');
    fs.writeFileSync(indexPath, `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hume App - Error</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <h1>Hume App</h1>
          <p>There was an error building the application.</p>
          <p>Please check the build logs for more information.</p>
        </body>
      </html>
    `);
  }
}

// Create a _redirects file for Vercel
const redirectsPath = path.join(webBuildDir, '_redirects');
console.log('Creating _redirects file...');
fs.writeFileSync(redirectsPath, `
# Redirects for SPA
/*    /index.html   200
`);

// Create a vercel.json file inside web-build
const vercelConfigPath = path.join(webBuildDir, 'vercel.json');
console.log('Creating vercel.json inside web-build...');
fs.writeFileSync(vercelConfigPath, JSON.stringify({
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}, null, 2));

console.log('Build preparation completed.');
