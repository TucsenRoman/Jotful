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

module.exports = { expo };
