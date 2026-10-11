const fs = require('fs');
const path = require('path');
const { withFinalizedMod } = require('expo/config-plugins');

// React Native 0.86 ships hermesc in the `hermes-compiler` package, but the
// Watch bundle phase from @appsent-co/react-native-watchos still looks in
// react-native/sdks/hermesc. Point it at the new home once the project exists.
const OLD = "require.resolve('react-native/package.json')), 'sdks/hermesc/osx-bin/hermesc')";
const NEW = "require.resolve('hermes-compiler/package.json')), 'hermesc/osx-bin/hermesc')";

module.exports = function withWatchHermesc(config) {
  return withFinalizedMod(config, ['ios', (config) => {
    const iosDir = config.modRequest.platformProjectRoot;
    const xcodeproj = fs.readdirSync(iosDir).find((name) => name.endsWith('.xcodeproj'));
    if (!xcodeproj) return config;
    const pbxproj = path.join(iosDir, xcodeproj, 'project.pbxproj');
    const contents = fs.readFileSync(pbxproj, 'utf8');
    if (contents.includes(OLD)) fs.writeFileSync(pbxproj, contents.split(OLD).join(NEW));
    return config;
  }]);
};
