module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { 
        jsxImportSource: "nativewind",
        router: { basename: "/" }
      }],
      "nativewind/babel"
    ],
    plugins: [
      'react-native-reanimated/plugin'
    ]
  };
};
