const fs = require('fs');

// Read the current icons.ts file
const content = fs.readFileSync('constants/icons.ts', 'utf8');

// Extract property names from the export object
const exportMatch = content.match(/export default \{([\s\S]*)\}/);
if (!exportMatch) {
  console.error('Could not find export default block');
  process.exit(1);
}

const exportContent = exportMatch[1];
const lines = exportContent.split('\n').filter(line => line.trim());

let newContent = `import { getAssetUri } from '../utils/assetLoader';

export default {
`;

lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('//') && trimmed !== '{' && trimmed !== '}') {
    // Extract property name
    const match = trimmed.match(/^\s*([a-zA-Z0-9_]+)[,:]/);
    if (match) {
      const propName = match[1];
      if (propName && propName !== 'export' && propName !== 'default') {
        // Convert camelCase to kebab-case for file paths
        let fileName = propName.replace(/([A-Z])/g, '-$1').toLowerCase();
        if (fileName.startsWith('-')) fileName = fileName.substring(1);
        
        // Special cases for known file name patterns
        if (propName === 'fasfFood') fileName = 'fast-food';
        if (propName === 'heart2Outline') fileName = 'heart2_outline';
        if (propName === 'dashboard2Outline') fileName = 'dashboard2Outline';
        if (propName === 'editPencil') fileName = 'edit_pencil';
        if (propName === 'masterCardLogo') fileName = 'mastercard_logo';
        if (propName === 'walletIcon') fileName = 'wallet_icon';
        if (propName === 'loveLocation') fileName = 'love_location';
        if (propName.startsWith('loveLocation')) fileName = propName.replace('loveLocation', 'love_location');
        
        newContent += `    ${propName}: getAssetUri("assets/icons/${fileName}.png"),\n`;
      }
    }
  }
});

newContent += '};\n';

// Write the fixed file
fs.writeFileSync('constants/icons.ts', newContent);
console.log('Successfully fixed icons.ts with all getAssetUri calls');
