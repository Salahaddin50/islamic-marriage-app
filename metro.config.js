const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for AWS SDK and Buffer
config.resolver.alias = {
  ...config.resolver.alias,
  'buffer': require.resolve('buffer'),
  // Add web stubs for react-native-maps
  'react-native-maps': require.resolve('./web-stubs/react-native-maps.js'),
};

// Add web platform support
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Add buffer to the global polyfills
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Web-specific configuration
if (process.env.EXPO_OS === 'web') {
  // Additional web configurations can go here
  config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];
}

module.exports = config;