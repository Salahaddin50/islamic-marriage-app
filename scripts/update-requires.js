const fs = require('fs');
const path = require('path');

const iconsPath = path.join(__dirname, '..', 'constants', 'icons.ts');
const content = fs.readFileSync(iconsPath, 'utf8');

// Replace all require statements with safeRequire
const updatedContent = content.replace(/const\s+(\w+)\s+=\s+require\(/g, 'const $1 = safeRequire(');

fs.writeFileSync(iconsPath, updatedContent, 'utf8');
