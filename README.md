# Jotful

Jotful is a private, offline-first capture app for thoughts, recordings,
photos, and videos. Capture first; decide what to do with it later.

## Project map

- `App.tsx` — iPhone app UI.
- `src/` — local SQLite storage, capture, audio, and thought logic.
- `targets/watch/` — Apple Watch companion target.
- `targets/widgets/` — source for the iPhone/iPad widgets.
- `support-site/` — static support and privacy pages.
- `targets/TARGETS_ROADMAP.md` — Apple-target roadmap.
- `FUTURE_TRUSTED_DEVICE_SYNC.md` — post-MVP trusted-device sync proposal.

## Development

Run `npm install`, then start an installed development client with:

```powershell
npx expo start --dev-client --tunnel --clear
```

Jotful uses native modules, so it does not run in Expo Go. See
[RELEASE_TEST_PLAN.md](./RELEASE_TEST_PLAN.md) before a release build.
