# Jotful brand: rules for code

**To see the brand, open the brand book:** https://claude.ai/artifact/88xS8w3fFuU4Key1M8FjHA (source: [BRAND_BOOK.html](BRAND_BOOK.html)). This file only holds what code and assets need.

## Color

| Name | Hex | Use |
| --- | --- | --- |
| Canvas | `#FAF8F3` | Behind every screen |
| Card | `#FFFDF8` | Thought cards, settings groups, the capture sheet, text on Roast |
| Cream | `#F5F0E6` | Logo only (light logo field, dark moth body) |
| Roast | `#242019` | Text, Ask AI pill, dark surfaces |
| Persimmon | `#EF705A` | Capture and action. Keep it rare |
| Moth Green | `#58795C` | Right wing of the moth, middle of the wordmark |
| Moss | `#74876A` | Quiet details, secondary text |
| Blush | `#F8D8D1` | Selected or gentle feedback |
| Oat | `#E4DFD6` | Dividers, pill outlines, progress tracks |
| Mist | `#F1EEE7` | Tag and icon-button fills, idle buttons |
| Quiet | `#9B9187` | Faint text: "Tap to capture", "Clear thought", disabled labels |

**Save gradient:** the active "Save thought" button fades diagonally from `#E89A89` (soft persimmon) through `#C5A096` and `#9CAA94` to Moss `#74876A`. It's the only gradient in the UI besides the wordmark.

In code these colors are `unsorted-*` in `tailwind.config.js` (`line` = Oat, `cream` = Card, `ink` = Roast). Use those names, not raw color values.

## Type

- **Fraunces SemiBold (600):** headings, the wordmark, capture prompts.
- **DM Sans 400 / 500 / 700:** everything else.
- Sentence case everywhere. All caps only for small tags (Idea, Draft, Photo…).

## Wordmark

"Jotful" in Fraunces SemiBold, 34pt, -1 letter spacing. The gradient runs 150px from the text's left edge: Persimmon → Moth Green (48%) → Roast. The header shows it alone, without the moth. Don't invent other treatments for the name.

## Moth files

| File | Use |
| --- | --- |
| `assets/brand/moth-mark-light.svg` | In-app, on light surfaces |
| `assets/brand/moth-mark-dark.svg` | In-app, on dark surfaces |
| `assets/brand/moth-light.svg`, `moth-dark.svg` | Square tiles with a background field |
| `assets/brand/moth-light-loop.svg`, `moth-dark-loop.svg`, `moth-tinted-loop.svg` | App icon appearances |

- React Native: `MothMark` (`src/brand/MothMark.tsx`) is transparent by default; `dark` gives a Cream body; `withBackdrop` only for a square tile.
- Never redraw, stretch, rotate, mirror, outline, shadow or recolor it. Minimum 20px; clear space is a quarter of its width.

## Updating the moth or icons

1. Edit the source SVG and `MothMark` together. Never use a raster copy as the master.
2. `npm run icons:ios` (Light Loop default, plus Dark Loop and Tinted Loop), and `node scripts/render-app-icon.cjs` for `assets/icon-1024.png`.
3. Check it at 20, 32, 40 and 1024px on Canvas and Roast.
4. Unapproved concepts go in `assets/explorations/`.
5. Update the brand book (`brand-book` skill) in the same pass.

## Open decisions

- Hand-draw the wordmark as a vector instead of rendering it from Fraunces?
- A social/avatar crop beyond the app icon.
- Photo or illustration references for marketing.
