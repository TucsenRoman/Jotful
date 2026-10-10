# Jotful to-do

Temporary list. Once tasks have a more stable home (a Notion database, for example), move the open items there, point `CLAUDE.md` at it, and delete this file.

## 1.0.2 release
- [ ] Watch 1.0.2 (build 10, EAS `394acc07`) through App Store review. Submitted Oct 10, 2026; auto-releases on approval. Carries the Jotful alert text, 5 new screenshots, and the new support and privacy links.

## 1.0.1 release
- [x] Watch 1.0.1 (build 9) through App Store review. Live since about Oct 7, 2026 (auto-released on approval). The live build is EAS `bf7cd3c2`; the other build 9 (`ba664d87`) and build 8 were never submitted.
- [x] Publish the renamed Jotful privacy policy and support page. Live at https://tucsenroman.github.io/Jotful/ and https://tucsenroman.github.io/Jotful/privacy.html; set in App Store Connect with 1.0.2.
- [ ] Run `RELEASE_TEST_PLAN.md` on the iPhone and keep anonymized screenshots. Skipped for 1.0.2; do it before the next release.

## Next
- [ ] Set up the Apple Watch provisioning profile, then drop `JOTFUL_PHONE_ONLY_BUILD` from the `production` profile so the Watch app ships.
- [ ] Watch capture acknowledgement and deduplication (next Watch milestone in `targets/TARGETS_ROADMAP.md`).
