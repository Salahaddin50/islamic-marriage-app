const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add polyfills for AWS SDK and Buffer
config.resolver.alias = {
  ...config.resolver.alias,
  'buffer': require.resolve('buffer'),
  // Force uuid to our shim
  'uuid': path.resolve(__dirname, 'shims/uuid-shim.js'),
};

// Remove problematic web stubs for native builds
// config.resolver.alias['react-native-get-random-values'] = require.resolve('./web-stubs/react-native-get-random-values.js');

// Add CSS support for web
config.resolver.assetExts.push('css');

// Hard override all uuid subpath resolutions (e.g. 'uuid/wrapper.mjs') to the shim
const originalResolveRequest = config.resolver.resolveRequest;
const uuidShimPath = path.resolve(__dirname, 'shims/uuid-shim.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'uuid' || (typeof moduleName === 'string' && moduleName.startsWith('uuid/'))) {
    return { type: 'sourceFile', filePath: uuidShimPath };
  }
  if (typeof originalResolveRequest === 'function') {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Optimize for native builds
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false, // Changed to false for better compatibility
  },
});

module.exports = config;