const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Explicitly set node_modules paths
config.resolver.nodeModulesPaths = [
  './node_modules',
  '../node_modules',
];

// Add polyfills for AWS SDK and Buffer
config.resolver.alias = {
  ...config.resolver.alias,
  'buffer': require.resolve('buffer'),
  // Add web stubs for react-native-maps
  'react-native-maps': require.resolve('./web-stubs/react-native-maps.js'),
};

// Explicitly define source and asset extensions
config.resolver.sourceExts = ['ts', 'tsx', 'js', 'jsx', 'json', 'wasm', 'mjs', 'cjs', 'web.js', 'web.ts', 'web.tsx'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'mp4', 'mov', 'avi', 'm4a', 'mp3', 'wav', 'aac'];

// Add web platform support
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Explicitly set Babel transformer path and disable inline requires
config.transformer.babelTransformerPath = require.resolve('metro-react-native-babel-transformer');
config.transformer.assetPlugins = ['expo-asset/tools/uri'];
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

module.exports = config;