const fs = require('fs');
const path = require('path');
const { withDangerousMod, withFinalizedMod } = require('expo/config-plugins');

// Fixes for the Hermes pieces that @appsent-co/react-native-watchos 0.1.7
// brings into the Watch app. Must be listed before that plugin in app.json:
// finalized mods run in reverse plugin order, and the hermesc rewrite needs
// the library's bundle phase to exist already.

// React Native 0.86 ships hermesc in the `hermes-compiler` package, but the
// Watch bundle phase still looks in react-native/sdks/hermesc.
const OLD = "require.resolve('react-native/package.json')), 'sdks/hermesc/osx-bin/hermesc')";
const NEW = "require.resolve('hermes-compiler/package.json')), 'hermesc/osx-bin/hermesc')";

function withHermescPath(config) {
  return withFinalizedMod(config, ['ios', (config) => {
    const iosDir = config.modRequest.platformProjectRoot;
    const xcodeproj = fs.readdirSync(iosDir).find((name) => name.endsWith('.xcodeproj'));
    if (!xcodeproj) return config;
    const pbxproj = path.join(iosDir, xcodeproj, 'project.pbxproj');
    const contents = fs.readFileSync(pbxproj, 'utf8');
    if (contents.includes(OLD)) fs.writeFileSync(pbxproj, contents.split(OLD).join(NEW));
    return config;
  }]);
}

// The library's hermes.framework has no MinimumOSVersion, so App Store
// Connect rejects the upload (ITMS-90360, ITMS-90208). Its arm64_32 slice is
// built for watchOS 9.0. Patch the installed copy before CocoaPods embeds it.
const HERMES_MIN_WATCHOS = '9.0';

function withHermesMinimumOS(config) {
  return withDangerousMod(config, ['ios', (config) => {
    const pkg = require.resolve('@appsent-co/react-native-watchos/package.json', { paths: [config.modRequest.projectRoot] });
    const xcframework = path.join(path.dirname(pkg), 'build', 'xcframework', 'hermes.xcframework');
    if (!fs.existsSync(xcframework)) return config;
    for (const slice of fs.readdirSync(xcframework)) {
      const plist = path.join(xcframework, slice, 'hermes.framework', 'Info.plist');
      if (!fs.existsSync(plist)) continue;
      const contents = fs.readFileSync(plist, 'utf8');
      if (contents.includes('<key>MinimumOSVersion</key>')) continue;
      fs.writeFileSync(plist, contents.replace(/<\/dict>\s*<\/plist>\s*$/, `\t<key>MinimumOSVersion</key>\n\t<string>${HERMES_MIN_WATCHOS}</string>\n</dict>\n</plist>\n`));
    }
    return config;
  }]);
}

module.exports = function withWatchHermesc(config) {
  return withHermesMinimumOS(withHermescPath(config));
};
