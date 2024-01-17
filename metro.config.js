// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("@expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Existing customization
  config.resolver.assetExts.push("cjs");

  // Setup for react-native-svg-transformer
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  };
  config.resolver = {
    ...config.resolver,
    assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...config.resolver.sourceExts, "svg"],
  };

  return config;
})();
