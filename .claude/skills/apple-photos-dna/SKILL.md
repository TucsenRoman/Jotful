---
name: apple-photos-dna
description: Apple Photos' iOS 26 design system (edge-to-edge content on white, controls as three floating glass islands per row, relative-date title capsule, filmstrip, pull-up info panel, edge date scrubber), codified as Jotful's second reference alongside apple-wallet-dna. Use when building or judging Jotful's detail view, media viewing, info panel or date scrubber.
---

# Apple Photos DNA

Picked by the user on 2026-10-18 as the second half of Jotful's reskin: Wallet for the home stack and cards, Photos for opening one thought (detail view), its media, its info, and the date scrubber on the home stack. Jotful borrows the system, never the marks.

## Files
- `PROMPT.md`: the payload (under 2KB). Attach `reference/viewer-2.jpg` and `info-0.png` first.
- `dna.json`: the full record: palette, type, space, 7 signatures, the weird move, 4 archetypes, bans, tests P1–P10, uncertain values.
- `reference/`: press and Apple Support screenshots, sources in `reference/SOURCES.md`. **Local only** (excluded through `.git/info/exclude`; the repo is public).
- `example/`: rebuilds from dna.json alone.

## Pairing with apple-wallet-dna
One style per spec; the split is by screen. Home stack, cards, tags: Wallet. Detail view, media, info, scrubber: Photos. Shared ground: system font, white glass controls, colour only in content (Jotful's tag colours are content).

## Known gaps
The date scrubber and the video player were not captured; their rules are inferred. Replace with real screens (the user's phone, or Mobbin) when available.
