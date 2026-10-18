# Jotful brand: rules for code

**To see the brand, open the brand book:** https://claude.ai/artifact/88xS8w3fFuU4Key1M8FjHA (source: [BRAND_BOOK.html](BRAND_BOOK.html)). This file only holds what code and assets need. The approved screens are in [design/](design/README.md); the app is being rebuilt to match them (Oct 2026), so until that lands the code still shows the old warm-paper look.

## Color

The UI is quiet greys, black and white. Colour comes only from tags.

| Name | Hex | Use |
| --- | --- | --- |
| Page | `#F2F1F6` | Behind home |
| White | `#FFFFFF` | Detail page, sheets, glass buttons |
| Grouped grey | `#F2F2F7` | Detail content card, info rows, grey pills |
| Ink | `#020204` | Titles, text, Ask AI (the one black button) |
| Secondary text | `rgba(60,60,67,0.6)` | Meta, captions |
| Faint text | `rgba(60,60,67,0.3)` | The floating "13 more" count |
| System blue | `#0A84FF` | Save in the writing sheet, "Adjust" links only |

**Tag colours.** One colour per tag, never two meanings. Bright on the small tag pill (white text, Idea uses black); the home card is a ~9% tint of it over white with dark text (`color-mix(in srgb, <tag> 9%, white)`). Filter pills: ~15% tint with the bright colour as text. Detail cards are grey, not tinted.

| Tag | Hex |
| --- | --- |
| Idea | `#F2B705` |
| Question | `#0A6CFF` |
| Movie | `#E5383B` |
| Music | `#E83E8C` |
| Book | `#F57C1F` |
| Place | `#2DA44E` |
| Person | `#8E44EC` |
| To-do | `#0FA3A3` |
| Untagged | white card, no pill |

Persimmon `#EF705A` and Moth Green `#58795C` now live only in the moth's wings and the wordmark. Roast and Cream are retired: the moth's body is Ink `#020204` on light and White `#FFFFFF` on dark, dark tiles and the app icon field are Apple graphite `#1C1C1E`, and the wordmark ends in Ink. (The SVG files, `MothMark` and the app icons still carry Roast/Cream until the build updates them.) Light only; the dark values in the brand book are a proposal.

## Type

- **Fraunces SemiBold (600):** the "Jotful" wordmark only.
- **System font (SF Pro; Inter on the web):** everything else, Apple Dynamic Type steps only: 34 / 22 / 17 / 15 / 13 / 12 / 11. Max four sizes per screen.
- Button labels in title case ("Ask AI", "Search Web", "Copy"). Small all-caps for tag pills only.

## Sizes (Apple's documented specs, see `.claude/skills/apple-wallet-dna/research/APPLE_SPECS.md`)

- Buttons: 44pt capsules, 16pt side padding, 6pt icon gap, 12pt between controls; icon-only actions are 44pt circles.
- Side margins 16pt. Nested radii are concentric (detail card 24, its media 12).

## Wordmark

"Jotful" in Fraunces SemiBold, 34pt, -1 letter spacing. The gradient runs 150px from the text's left edge: Persimmon → Moth Green (48%) → Ink. The header shows it with the small moth before it. Don't invent other treatments for the name.

## Moth files

| File | Use |
| --- | --- |
| `assets/brand/moth-mark-light.svg` | In-app, on light surfaces |
| `assets/brand/moth-mark-dark.svg` | In-app, on dark surfaces |
| `assets/brand/moth-light.svg`, `moth-dark.svg` | Square tiles with a background field |
| `assets/brand/moth-light-loop.svg`, `moth-dark-loop.svg`, `moth-tinted-loop.svg` | App icon appearances |

- React Native: `MothMark` (`src/brand/MothMark.tsx`) is transparent by default; `dark` gives a white body (Cream until the build); `withBackdrop` only for a square tile.
- Never redraw, stretch, rotate, mirror, outline, shadow or recolor it. Minimum 20px; clear space is a quarter of its width.

## Updating the moth or icons

1. Edit the source SVG and `MothMark` together. Never use a raster copy as the master.
2. `npm run icons:ios` (Light Loop default, plus Dark Loop and Tinted Loop), and `node scripts/render-app-icon.cjs` for `assets/icon-1024.png`.
3. Check it at 20, 32, 40 and 1024px on Page and Ink.
4. Unapproved concepts go in `assets/explorations/`.
5. Update the brand book (`brand-book` skill) in the same pass.

## Open decisions

- Dark mode values (proposal in the brand book).
- Hand-draw the wordmark as a vector instead of rendering it from Fraunces?
- A social/avatar crop beyond the app icon.
