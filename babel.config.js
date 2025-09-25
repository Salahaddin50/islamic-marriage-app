module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NOTE: This must be listed last per react-native-reanimated docs
      'react-native-reanimated/plugin'
    ]
  };
};
