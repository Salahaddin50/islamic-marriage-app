const fs = require('fs');
const path = require('path');

console.log('Checking web build output...');

const buildDir = path.join(__dirname, '..', 'web-build');

if (!fs.existsSync(buildDir)) {
  console.error('ERROR: web-build directory does not exist!');
  process.exit(1);
}

console.log('web-build directory exists.');

const indexPath = path.join(buildDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('ERROR: index.html not found in web-build directory!');
  process.exit(1);
}

console.log('index.html found.');

const staticDir = path.join(buildDir, 'static');
if (!fs.existsSync(staticDir)) {
  console.warn('WARNING: static directory not found in web-build. This might be an issue depending on your build.');
} else {
  console.log('static directory found.');
}

console.log('Build output check completed.');
