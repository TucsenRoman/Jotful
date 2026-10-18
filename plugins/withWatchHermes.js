const fs = require('fs');
const path = require('path');
const { withDangerousMod, withFinalizedMod } = require('expo/config-plugins');

// Fixes for the Hermes pieces that @appsent-co/react-native-watchos 0.1.7
// brings into the Watch app. Must be listed before that plugin in app.json:
// finalized mods run in reverse plugin order, and the bundle fix needs the
// library's bundle phase to exist already.

const PHASE_NAME = '[RNW] Bundle React Native (watchOS)';

// The library's bundle phase pre-compiles the Watch JS to Hermes bytecode
// with React Native's hermesc. React Native 0.86 ships Hermes 1.0 (bytecode
// 98), but the Watch runs the library's Hermes 0.12, which can't load it: a
// black screen and "Error: check metro for logs". Ship plain JS instead;
// Hermes reads source on any version, at a small cold-start cost.
function withPlainJsBundle(config) {
  return withFinalizedMod(config, ['ios', (config) => {
    const iosDir = config.modRequest.platformProjectRoot;
    const xcodeproj = fs.readdirSync(iosDir).find((name) => name.endsWith('.xcodeproj'));
    if (!xcodeproj) return config;
    const pbxprojPath = path.join(iosDir, xcodeproj, 'project.pbxproj');
    const rnwDir = path.dirname(require.resolve('@appsent-co/react-native-watchos/package.json', { paths: [config.modRequest.projectRoot] }));
    const xcode = require(require.resolve('xcode', { paths: [rnwDir] }));
    const project = xcode.project(pbxprojPath).parseSync();
    const phases = project.hash.project.objects.PBXShellScriptBuildPhase || {};
    let changed = false;
    for (const [key, phase] of Object.entries(phases)) {
      if (key.endsWith('_comment') || String(phase.name).replace(/"/g, '') !== PHASE_NAME) continue;
      const script = JSON.parse(phase.shellScript);
      const cut = script.indexOf('HERMESC_BIN=');
      if (cut < 0) continue;
      phase.shellScript = JSON.stringify(script.slice(0, cut).trimEnd() + '\n');
      changed = true;
    }
    if (changed) fs.writeFileSync(pbxprojPath, project.writeSync());
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

module.exports = function withWatchHermes(config) {
  return withHermesMinimumOS(withPlainJsBundle(config));
};
