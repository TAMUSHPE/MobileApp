module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "nativewind/babel",
      [
        "inline-dotenv",
        {
          unsafe: true,
        },
      ],
      "react-native-worklets/plugin",
    ],
  };
};
