# Jotful

Private, offline-first iPhone capture app for thoughts, voice, recordings, photos and video. **Live on the App Store** (App Store Connect app ID `6815049329`). Formerly "Unsorted": the bundle ID (`com.tucsenroman.unsorted`), Expo slug and npm package name still use the old name and must not change.

Open work lives in [TODO.md](TODO.md). Product scope: [PRODUCT_PLAN.md](PRODUCT_PLAN.md). Brand: see `## UI foundations` below.

## Stack

Expo SDK 57 · React Native 0.86 · TypeScript · NativeWind (Tailwind 3) · expo-sqlite for local storage. Native modules mean it does **not** run in Expo Go; it needs a dev client build.

- `App.tsx`: main iPhone UI. `src/`: storage, capture, audio, segmentation logic.
- `targets/watch/`: Apple Watch companion. `targets/widgets/`: Capture and Recents widgets (built through `expo-widgets`). Roadmap: `targets/TARGETS_ROADMAP.md`.
- `support-site/`: static support and privacy pages.

## Commands

```bash
npx expo start --dev-client      # dev server for an installed dev build
npx tsc --noEmit                 # typecheck
npm run verify:segmentation      # segmentation checks
npm run icons:ios                # re-render iOS icon variants from assets/brand
```

## Builds and release (EAS, cloud only; this is a Windows machine with no Xcode)

| Profile | Use |
|---|---|
| `development` | Dev client including the Watch target |
| `development-phone` | Dev client without the Watch target |
| `preview` | Internal test build |
| `production` | App Store build. Phone-only for now (`JOTFUL_PHONE_ONLY_BUILD=1`) until the Watch provisioning profile exists |

- `eas build -p ios --profile production`, then `eas submit -p ios --profile production`.
- `appVersionSource` is `local` and `production` auto-increments, so every production build bumps `buildNumber` in `app.json`. Commit that bump.
- EAS uploads the working tree, committed or not. Commit before building so the build matches a commit.
- Credentials and signing live in EAS, not on this machine.

## Verifying a change

1. Typecheck, and run `verify:segmentation` if capture or classification logic changed.
2. Check it on the iPhone through the dev client (`npx expo start --dev-client`).
3. Before any release build, run [RELEASE_TEST_PLAN.md](RELEASE_TEST_PLAN.md) and work through [APP_STORE_CONNECT_CHECKLIST.md](APP_STORE_CONNECT_CHECKLIST.md).

## UI foundations
- Brand book: https://claude.ai/artifact/88xS8w3fFuU4Key1M8FjHA (source: [BRAND_BOOK.html](BRAND_BOOK.html); refresh with the `brand-book` skill)
- Docs: [BRAND.md](BRAND.md) holds the short rules for code: colors, type, wordmark, moth files, icon workflow.
- Tokens: `tailwind.config.js` (`unsorted-*` colors, an old name) plus a `colors` object in `App.tsx`. No single tokens file yet.
- Fonts: Fraunces 600 and DM Sans 400/500/700 via `@expo-google-fonts`, loaded in `App.tsx`.
- Platforms: Expo (iPhone), light theme only for now.
- Signature: moth mark, gradient Fraunces wordmark, swipe-to-resolve/pin thought cards, small all-caps kind tags, dark Ask AI pill, capture sheet with a random prompt, audio timeline, "Hold that thought." empty state.
