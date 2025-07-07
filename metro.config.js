// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add .cjs support
config.resolver.assetExts.push("cjs");

// Setup react-native-svg-transformer safely
if (!config.transformer) config.transformer = {};
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer"
);

if (!config.resolver) config.resolver = {};
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

module.exports = config;
