const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { withWatchosMetro } = require('@appsent-co/react-native-watchos/metro-config');

const config = withWatchosMetro(getDefaultConfig(__dirname));

module.exports = withNativeWind(config, { input: './global.css' });
