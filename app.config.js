const appConfig = require('./app.json');

const expo = structuredClone(appConfig.expo);

// The Watch target needs its own Apple provisioning profile. This flag is used
// only for an emergency phone-only development build while that profile is set up.
if (process.env.JOTFUL_PHONE_ONLY_BUILD === '1') {
  expo.plugins = expo.plugins.filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== '@appsent-co/react-native-watchos' && name !== '@bacons/apple-targets';
  });
}

// Dev builds install next to the TestFlight / App Store app (same setup as viseez):
// their own name, bundle id and link scheme. APP_VARIANT=development is set by
// eas.json's development profiles and when starting the dev server. The widget
// App Group (group.<bundle id>) and the Watch app (<bundle id>.watch) follow the
// bundle id, so the dev app's widgets and Watch never touch the store app's data.
if (process.env.APP_VARIANT === 'development') {
  expo.name = 'Jotful Dev';
  expo.scheme = 'jotful-dev';
  expo.ios = { ...expo.ios, bundleIdentifier: 'com.tucsenroman.unsorted.dev' };
}

module.exports = { expo };
