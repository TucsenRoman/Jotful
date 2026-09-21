# Unsorted

An offline-first Expo / React Native app that turns one unstructured text dump into separate, actionable thoughts.

## Start on Windows

1. Install current Node LTS, then run `npm install` in this folder.
2. For an iPhone, use the development-build route below. The App Store version of Expo Go does not support the SDK version used by this project.
3. The final bundle identifier is already `com.tucsenroman.unsorted`.

## Test on your iPhone (recommended)

This is the production-aligned route and works from Windows:

```text
npx expo install expo-dev-client
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios --profile development
```

Open the EAS build link on the iPhone and install the internal build. Then start the project with `$env:EXPO_UNSTABLE_TUNNEL_V2="1"; npx expo start --dev-client --tunnel --clear` and scan its QR code from the installed Unsorted development app. Tunnel mode bypasses Windows firewall or local-network restrictions, although it is slower.

## Ship without a Mac

Log in to Expo, then run `npx eas-cli@latest build:configure`. The included `eas.json` has a production profile. A production iOS build and TestFlight upload can be started from Windows with:

```text
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

That creates the signed build in Expo's cloud and submits it to TestFlight; you still select the build and submit it for Apple review in App Store Connect.

## Privacy boundary

Notes are stored in a local SQLite database. The app has no account, analytics, backend, or sync. Voice capture requires on-device recognition and is unavailable rather than cloud-backed when that isn't supported. Search and AI actions use the selected thought only, after the user taps an action. Do not add analytics, cloud transcription, remote AI, or sync without updating the privacy policy and App Store privacy disclosure.

## Before App Review

- Add a polished 1024 × 1024 app icon and screenshots.
- Set your support URL and privacy-policy URL in App Store Connect.
- Test the production build through TestFlight.
- Complete App Privacy in App Store Connect. The current code is designed to truthfully report no data collection.
