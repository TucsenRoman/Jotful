module.exports = function (api) {
  // The Watch bundle must not use NativeWind: its JSX wrapper pulls in
  // Reanimated and full React Native, which the Watch runtime doesn't have.
  const watch = api.caller((caller) => caller?.platform === 'watchos');
  if (watch) return { presets: ['babel-preset-expo'] };
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel']
  };
};
