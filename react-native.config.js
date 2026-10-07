const phoneOnlyBuild = process.env.JOTFUL_PHONE_ONLY_BUILD === '1';

module.exports = phoneOnlyBuild
  ? {
      dependencies: {
        '@appsent-co/react-native-watchos': {
          platforms: { ios: null },
        },
      },
    }
  : {};
