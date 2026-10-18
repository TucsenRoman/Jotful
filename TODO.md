# Jotful to-do

Temporary list. Once tasks have a more stable home (a Notion database, for example), move the open items there, point `CLAUDE.md` at it, and delete this file.

## 1.0.3: Apple Watch
- [x] Builds with the Watch app (`production-watch` profile): 15–18 reached TestFlight but the Watch app showed a black screen. Build 19 (`c54e386`, keeps NativeWind out of the Watch bundle) works.
- [x] Watch capture landing on the iPhone, tested on real devices with build 19 (Oct 18, 2026).
- [ ] Merge `feat/reskin` (which now carries the Watch sync) into main.

## 1.0.2 release
- [x] Watch 1.0.2 (build 10, EAS `394acc07`) through App Store review. Approved Oct 11, 2026; auto-released. Carries the Jotful alert text, 5 new screenshots, and the new support and privacy links.

## 1.0.1 release
- [x] Watch 1.0.1 (build 9) through App Store review. Live since about Oct 7, 2026 (auto-released on approval). The live build is EAS `bf7cd3c2`; the other build 9 (`ba664d87`) and build 8 were never submitted.
- [x] Publish the renamed Jotful privacy policy and support page. Live at https://tucsenroman.github.io/Jotful/ and https://tucsenroman.github.io/Jotful/privacy.html; set in App Store Connect with 1.0.2.
- [ ] Run `RELEASE_TEST_PLAN.md` on the iPhone and keep anonymized screenshots. Skipped for 1.0.2; do it before the next release.

## Next
- [ ] The Watch provisioning profile exists (`HQ3YJ2KKK3`) and `production-watch` works: fold it into `production` by dropping `JOTFUL_PHONE_ONLY_BUILD`.
- [x] Watch capture acknowledgement and deduplication: the iPhone saves each Watch capture once by id and confirms it back (`src/watchSync.ts`). Tested on real devices Oct 18, 2026.
- [ ] **Security alerts (found 2026-10-18).** `npm audit`: 45 issues (1 critical `shell-quote`, 28 high), nearly all in Expo and Metro build tooling; most fixes come with the next Expo SDK. No Dependabot yet.
- [ ] **Local Node.js is 20** (end of life Oct 2026). Upgrade on this PC.
