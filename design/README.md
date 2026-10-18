# Jotful redesign (Oct 2026)

The approved mocks for the reskin: Apple Wallet's system for the home stack and cards, Apple Photos' for opening a thought. Decisions, round by round: [DIRECTION.md](DIRECTION.md). Apple research: [RESEARCH.md](RESEARCH.md).

Open the HTML files in a browser (a local server works best for the interactive ones: `node ~/.claude/skills/ui-mockup/tools/serve.js design/mocks`).

| Screen | Files | Status |
|---|---|---|
| Home (Rolodex stack, flip, end stops, date scrubber, count, filter, hide resolved) | `mocks/r6/home.html` (interactive), `frames.html`, `scrubber.html`, `filter.html`, `count.html`, `NOTES.md` (motion values + Reanimated plan) | Approved |
| Thought detail (one template for every text / voice / photo / video combo) | `mocks/r8/detail/` (`gen.js` builds `1-…8-*.html`, `matrix.html`, `NOTES.md` = the standard) | Approved |
| Capture sheet (peek, writing, one-button voice) | `mocks/r3/sheet/peek.html`, `writing.html`, `voice-one*.html` | Approved. Camera and photo picking keep the current app UI. |
| Swipe on a thought (right resolves, left pins, small circles, others fade) | `mocks/r3/swipe/frames.html`, `swipe.html` | Approved |

Specs the mocks follow: `.claude/skills/apple-wallet-dna/` and `.claude/skills/apple-photos-dna/` (each with `PROMPT.md`, `dna.json`), Apple's documented numbers in `.claude/skills/apple-wallet-dna/research/APPLE_SPECS.md`. Their `reference/` screenshots stay local (this repo is public).

## Photo credits
Mock photos are from [Unsplash](https://unsplash.com) under the Unsplash License: `photo-1541663038764-58fefe6f66b8` (bakery-2), `photo-1554428350-f46d65e299bb` (bakery-1), `photo-1786588103181-29cf8a6ab4c2` (bakery-3), `photo-1595351298020-038700609878` (pottery-1), `photo-1590605095243-072811dbe64c` (pottery-2), `photo-1489599849927-2ee91cede3ba` (movie-1), `photo-1517604931442-7e0c8ed2963c` (movie-2), `photo-1521410843026-323be9ead002` (car-1), `photo-1607913894042-2c770aa8a0e4` (car-2), `photo-1526399743290-f73cb4022f48` (market-1), `photo-1485637701894-09ad422f6de6` (market-2), `photo-1510127034890-ba27508e9f1c` (camera-1), `photo-1516961642265-531546e84af2` (camera-2), `photo-1599733442143-127f1f5540f3` (book-1), `photo-1528577931167-e99f3cdbca37` (book-2).
