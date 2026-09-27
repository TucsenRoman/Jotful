# Jotful brand kit

This is the working source of truth for Jotful's visual identity. It records the choices already represented in the app, so new screens, social posts, website work, and future logo explorations all start from the same foundation.

## Brand in one sentence

**Jotful is a bright, private landing place for the thoughts that arrive before they have a category.**

The visual language should feel warm, encouraging, playful, and clear—not productivity-software cold, overly mystical, or precious.

## Logo system

### Primary mark: the moth

The moth is Jotful's distinctive symbol: it suggests attraction to fragments of thought, private nocturnal capture, and transformation without implying that every thought must be polished.

The approved logo family has four hand-authored vectors, imported from `Untitled.zip` into [`assets/brand/`](assets/brand/).

| Variant | Intended use | Construction |
| --- | --- | --- |
| `Light.svg` | Light UI and light marketing surfaces | Cream square field; Persimmon-to-Cream left wing, Moth Green right wing, Roast body. |
| `Dark.svg` | Dark UI and dark marketing surfaces | Roast square field; the same wings, Cream body. |
| `Light_Loop.svg` | Light-theme loop/app-avatar use | Light mark plus a Roast loop line. |
| `Dark_Loop.svg` | Dark-theme loop/app-avatar use | Dark mark plus a Cream loop line. For the iOS Dark icon export, its square field is removed so the system can supply the appearance background. |
| `Tinted_Loop.svg` | iOS tinted Home Screen appearance | Grayscale loop mark, preserving tonal hierarchy for the system tint. |

### Transparent UI marks

Use the transparent marks inside the product wherever the surrounding surface already establishes the theme. They deliberately have no square field or loop:

| Variant | Use on | Source |
| --- | --- | --- |
| Light mark | Cream and other light surfaces | [`assets/brand/moth-mark-light.svg`](assets/brand/moth-mark-light.svg) |
| Dark mark | Roast and other dark surfaces | [`assets/brand/moth-mark-dark.svg`](assets/brand/moth-mark-dark.svg) |

The React Native `MothMark` component is transparent by default. Pass `dark` for a Cream body on a dark surface, and pass `withBackdrop` only when a compact square logo tile is explicitly needed.

### Visual reference

| Light | Dark |
| --- | --- |
| ![Light moth](assets/brand/moth-light.svg) | ![Dark moth](assets/brand/moth-dark.svg) |

| Light Loop | Dark Loop |
| --- | --- |
| ![Light loop moth](assets/brand/moth-light-loop.svg) | ![Dark loop moth](assets/brand/moth-dark-loop.svg) |

| Tinted Loop |
| --- |
| ![Tinted loop moth](assets/brand/moth-tinted-loop.svg) |

Do not redraw, stretch, crop, add outlines, add a drop shadow, or recolor individual parts of the moth. Preserve the three-part construction: two asymmetrical wings and the narrow central body. The color treatment belongs to the selected theme variant rather than serving as an outline or structural divider.

### Clear space and minimum size

- Keep clear space around the mark equal to at least **one quarter of the mark's width** on every side.
- In interface use, do not render the mark below **20 px** square. For favicons or very small system surfaces, use the exported app icon instead of simplifying the vector by hand.
- Keep the mark upright. It should never be mirrored, rotated, or used as a repeating pattern behind copy.

### Lockups

Until a wordmark is formally drawn, use a simple text lockup rather than creating an unofficial logo.

| Context | Treatment |
| --- | --- |
| App icon | Use the Dark Loop mark on a Roast square field; export from the approved `Dark_Loop.svg` source. The operating system applies any needed icon mask. |
| Product header | Moth plus the name **Jotful** in DM Sans Bold. |
| Marketing / editorial | Moth above or to the left of **Jotful** in DM Sans Bold; keep the name sentence case. |
| Small UI | Moth alone, with an accessible label such as “Jotful”. |

Use the mark by itself when the product name is already visible in the surrounding context. Do not pair it with a system font, all-caps wordmark, or an illustrated type treatment.

## Color

| Role | Name | Hex | Use |
| --- | --- | --- | --- |
| Core light | Cream | `#F5F0E6` | Main light surface; light-theme logo field and dark-theme moth body. |
| Core dark | Roast | `#242019` | Primary text, dark-theme logo field, light-theme moth body. |
| Core accent | Persimmon | `#EF705A` | Primary moth wing and capture/action emphasis. |
| Logo supporting accent | Moth Green | `#58795C` | Secondary moth wing in every approved logo variant. |
| Supporting UI accent | Moss | `#74876A` | Secondary information and calm UI state. |
| Soft accent | Blush | `#F8D8D1` | Selected, active, or gentle feedback surfaces. |
| Divider | Oat | `#EAE4DA` | Quiet separators on cream surfaces. |

The mark is theme-specific, not background-neutral: use the complete Light or Dark variant as supplied. Its left wing may use the approved Persimmon-to-Cream gradient; its right wing remains Moth Green. Do not construct new logo fills or add strokes. In ordinary UI, prefer flat color fields and let Persimmon stay scarce enough to retain its meaning.

## Typography

| Job | Family | Default weight | Notes |
| --- | --- | --- | --- |
| Display / product name | Fraunces | SemiBold (600) | Warm, reflective, and used sparingly for headings. |
| Body / controls | DM Sans | Regular (400), Medium (500), Bold (700) | Clear, practical, and legible at small sizes. |

Use sentence case for headings, labels, and product naming. Avoid all caps except compact system labels where scanability is more important than voice.

## Image and illustration direction

When making future imagery, favor close, intimate, lightly textured subjects: paper, lamplight, hands, small found objects, and moments of reflection. Lighting should be soft and warm; colors should sit near cream, roast, persimmon, and moss.

Avoid literal moth photography as a decorative shortcut, neon gradients, high-gloss productivity imagery, busy collages, and stock-office aesthetics. The moth mark itself carries the symbolic role.

## Voice for visual decisions

Choose treatments that feel:

- private rather than performative
- spacious rather than empty
- gentle rather than passive
- considered rather than over-designed

If a new asset competes with the moth or makes Persimmon feel like an alarm color, simplify it.

## Asset workflow

1. Start from the vector mark for product and web work; do not export raster copies as new masters.
2. Import the four approved source vectors without changing their paths, gradients, or view boxes. Keep Light/Dark and standard/Loop as distinct files.
3. Generate 1024 px iOS exports with `node scripts/render-ios-icons.cjs`: Light Loop for the default appearance, transparent-background Dark Loop for the system Dark appearance, and grayscale Tinted Loop for tinted appearances.
4. Use `assets/icon-1024.png` as the default/Android fallback, generated from Light Loop with `node scripts/render-app-icon.cjs`.
5. When updating the moth, update the source SVG and the React Native implementation together, regenerate every icon export, then review it at 20 px, 32 px, 40 px, and 1024 px on both Cream and Roast.
6. Add approved exports in `assets/` with descriptive names. Keep exploratory concepts in a separate `assets/explorations/` folder until approved.

## Open decisions

These are intentionally not locked yet:

- A custom drawn wordmark versus the Fraunces text lockup.
- A defined social/avatar crop beyond the app icon.
- A small set of photographic or illustration references for marketing.

Any new work on those decisions should update this document with the approved outcome and the source asset location.
