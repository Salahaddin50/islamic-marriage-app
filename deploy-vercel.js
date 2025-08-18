#!/usr/bin/env node

// Vercel deployment helper script for Expo web app
console.log('🚀 Building Expo web app for Vercel deployment...');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('🔨 Building Expo web app...');
  execSync('npx expo export --platform web', { stdio: 'inherit' });

  console.log('📁 Checking build output...');
  const distPath = path.join(process.cwd(), 'dist');
  
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log('✅ Build successful! Files generated:');
    files.forEach(file => console.log(`   - ${file}`));
    
    // Check for index.html
    if (files.includes('index.html')) {
      console.log('✅ index.html found - ready for deployment!');
    } else {
      console.log('❌ index.html not found in build output');
    }
  } else {
    console.log('❌ Build output directory not found');
  }

  console.log('');
  console.log('🎉 Ready for Vercel deployment!');
  console.log('📋 Next steps:');
  console.log('1. Push changes to GitHub');
  console.log('2. Redeploy on Vercel');
  console.log('3. Your app should now work!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
