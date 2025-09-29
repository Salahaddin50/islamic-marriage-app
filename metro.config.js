const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for AWS SDK and Buffer
config.resolver.alias = {
  ...config.resolver.alias,
  'buffer': require.resolve('buffer'),
  // Force uuid to use a custom shim to provide a default export for react-native-gifted-chat
  'uuid': require.resolve('./shims/uuid-shim.js'),
};

// Remove problematic web stubs for native builds
// config.resolver.alias['react-native-get-random-values'] = require.resolve('./web-stubs/react-native-get-random-values.js');

// Add CSS support for web
config.resolver.assetExts.push('css');

// Optimize for native builds
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false, // Changed to false for better compatibility
  },
});

module.exports = config;