const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { withWatchosMetro } = require('@appsent-co/react-native-watchos/metro-config');
const path = require('path');

// Expo 57 throws "No support package is known for platform watchos" when it
// bundles the Watch app. Treat watchos like the other non-React-Native hosts.
const autolinkingDir = path.dirname(require.resolve('expo-modules-autolinking/package.json', { paths: [path.dirname(require.resolve('expo/package.json'))] }));
const autolinkingPlatforms = require(path.join(autolinkingDir, 'build/platforms'));
const getSupportPackageForPlatform = autolinkingPlatforms.getSupportPackageForPlatform;
autolinkingPlatforms.getSupportPackageForPlatform = (platform) => (platform === 'watchos' ? null : getSupportPackageForPlatform(platform));

const config = withWatchosMetro(getDefaultConfig(__dirname));

module.exports = withNativeWind(config, { input: './global.css' });
