const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for AWS SDK and Buffer
config.resolver.alias = {
  ...config.resolver.alias,
  'buffer': require.resolve('buffer'),
};

// Add buffer to the global polyfills
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;