const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for AWS SDK and Buffer
config.resolver.alias = {
  ...config.resolver.alias,
  'buffer': require.resolve('buffer'),
  // Add web stubs for react-native-maps
  'react-native-maps': require.resolve('./web-stubs/react-native-maps.js'),
};

// Ensure font extensions are included in asset extensions
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

// Disable inline requires for better web compatibility
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

module.exports = config;