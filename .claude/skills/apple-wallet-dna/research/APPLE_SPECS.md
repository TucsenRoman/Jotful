# Apple iOS specs for Jotful (cited)

Copied 2026-10-18 from viseez's apple-fitness-dna research (researched 2026-10-11), Fitness-only parts removed. Shared by apple-wallet-dna and apple-photos-dna. Source tags as below.

Researched 2026-10-11. Source tags: **[HIG]** = developer.apple.com Human Interface Guidelines (fetched from Apple's own page JSON, `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`); **[WWDC]** = Apple WWDC25 session page; **[APPLE]** = apple.com / newsroom; **[3P]** = third-party, fills a gap Apple does not publish.


## 1. Typography

### Fonts
| Fact | Value | Source |
|---|---|---|
| System font | San Francisco (SF Pro, SF Compact, SF Mono, ...) plus New York serif; variable fonts | https://developer.apple.com/design/human-interface-guidelines/typography |
| Optical sizes | System fonts use *dynamic optical sizes* that merge Text and Display into one continuous design; discrete Text/Display only needed in design tools lacking variable-font support | https://developer.apple.com/design/human-interface-guidelines/typography |
| Text/Display switch point | Not stated in the current HIG. Legacy convention is 20 pt (Text below, Display at/above) - treat as **[3P/legacy, unverified]**. Tracking table below changes sign near 24 pt, which is where the type "opens up". | - |
| Weights | Ultralight to Black; "prefer Regular, Medium, Semibold, or Bold"; avoid Ultralight/Thin/Light | https://developer.apple.com/design/human-interface-guidelines/typography |
| Rounded | SF Pro, SF Compact, SF Arabic/Armenian/Georgian/Hebrew exist in rounded variants "to coordinate text with the appearance of soft or rounded UI elements, or to provide an alternative typographic voice" | https://developer.apple.com/design/human-interface-guidelines/typography |
| Where Fitness uses rounded numerals | **Not documented.** watchOS: "In complications, watchOS uses SF Compact Rounded" (https://developer.apple.com/design/human-interface-guidelines/typography). Rounded numerals in Fitness/Activity are observation only. |
| Default / minimum size iOS | 17 pt default, 11 pt minimum | https://developer.apple.com/design/human-interface-guidelines/typography |
| iOS 26 direction | Typography "now bolder and left-aligned to improve readability in key moments like alerts and onboarding" | https://developer.apple.com/videos/play/wwdc2025/356/ |
| Emphasized weights added to Dynamic Type tables | Dec 16, 2025 change | https://developer.apple.com/design/human-interface-guidelines/typography |

### iOS / iPadOS Dynamic Type, Large (default) size
Source for all rows: https://developer.apple.com/design/human-interface-guidelines/typography

| Style | Weight | Size pt | Leading pt | Emphasized weight |
|---|---|---|---|---|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subhead | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

Other size steps (Large Title / Body in pt, same page): xSmall 31 / 14; Small 32 / 15; Medium 33 / 16; xLarge 36 / 19; xxLarge 38 / 21; xxxLarge 40 / (Title 1 34, Large Title 40, leading 48).

### Tracking (iOS, SF Pro) - 1/1000 em, and points
Source: https://developer.apple.com/design/human-interface-guidelines/typography ("In a running app, the system font dynamically adjusts tracking at every point size"; table is for mockups.)

| Size pt | 11 | 12 | 13 | 15 | 17 | 20 | 22 | 24 | 28 | 34 | 40 | 48 | 56 | 64 | 72 | 80+ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tracking /1000 em | +6 | 0 | -6 | -16 | -26 | -23 | -12 | +3 | +14 | +12 | +10 | +8 | +6 | +4 | +2 | 0 |
| Tracking pt | +0.06 | 0 | -0.08 | -0.23 | -0.43 | -0.45 | -0.26 | +0.07 | +0.38 | +0.40 | +0.37 | +0.35 | +0.30 | +0.22 | +0.14 | 0 |

SF Pro **Rounded** tracking is looser at small sizes (same page): 12 pt +46, 17 pt +22, 20 pt +18, 28 pt +13, 32 pt +12 (per 1/1000 em).

## 2. Color

### System colors (iOS 26-era values, HIG June 9, 2025 update; Dec 16, 2025 Liquid Glass update)
Source: https://developer.apple.com/design/human-interface-guidelines/color (swatch alt text).

| Name | Light | Dark | Increased contrast light | Increased contrast dark |
|---|---|---|---|---|
| Red | #FF383C | #FF4245 | #E9152D | #FF6165 |
| Orange | #FF8D28 | #FF9230 | #C55300 | #FFA056 |
| Yellow | #FFCC00 | #FFD600 | #A16A00 | #FEDF43 |
| Green | #34C759 | #30D158 | #008932 | #4AD968 |
| Mint | #00C8B3 | #00DAC3 | #008575 | #54DFCB |
| Teal | #00C3D0 | #00D2E0 | #008198 | #3BDDEC |
| Cyan | #00C0E8 | #3CD3FE | #007EAE | #6DD9FF |
| Blue | #0088FF | #0091FF | #1E6EF4 | #5CB8FF |
| Indigo | #6155F5 | #6D7CFF | #564ADE | #A7AAFF |
| Purple | #CB30E0 | #DB34F2 | #B02FC2 | #EA8DFF |
| Pink | #FF2D55 | #FF375F | #E7124D | #FF8AC4 |
| Brown | #AC7F5E | #B78A66 | #956D51 | #DBA679 |

Change note: these differ from the pre-iOS 26 values (e.g. old systemBlue #007AFF / #0A84FF, systemRed #FF3B30 / #FF453A, systemGreen #34C759 / #30D158). WWDC25: system colors "adjusted in subtle but meaningful ways... improving hue differentiation" (https://developer.apple.com/videos/play/wwdc2025/356/).

### System grays (iOS UIKit)
Source: https://developer.apple.com/design/human-interface-guidelines/color

| Name | Light | Dark | IC light | IC dark |
|---|---|---|---|---|
| systemGray | #8E8E93 | #8E8E93 | #6C6C70 | #AEAEB2 |
| systemGray2 | #AEAEB2 | #636366 | #8E8E93 | #7C7C80 |
| systemGray3 | #C7C7CC | #48484A | #AEAEB2 | #545456 |
| systemGray4 | #D1D1D6 | #3A3A3C | #BCBCC0 | #444446 |
| systemGray5 | #E5E5EA | #2C2C2E | #D8D8DC | #363638 |
| systemGray6 | #F2F2F7 | #1C1C1E | #EBEBF0 | #242426 |

### Backgrounds, labels, separators, fills [3P: values from https://noahgilmore.com/blog/dark-mode-uicolor-compatibility; Apple's HIG gives the names and roles but no numbers. These are the classic iOS 13+ values; iOS 26 not re-verified.]
HIG role text: two sets, system and grouped, each primary/secondary/tertiary; "Primary for the overall view; Secondary for grouping content within the view; Tertiary for grouping within secondary elements"; use grouped set for grouped table views (https://developer.apple.com/design/human-interface-guidelines/color).

| Token | Light | Dark |
|---|---|---|
| systemBackground | #FFFFFF | #000000 |
| secondarySystemBackground | #F2F2F7 | #1C1C1E |
| tertiarySystemBackground | #FFFFFF | #2C2C2E |
| systemGroupedBackground | #F2F2F7 | #000000 |
| secondarySystemGroupedBackground | #FFFFFF | #1C1C1E |
| tertiarySystemGroupedBackground | #F2F2F7 | #2C2C2E |
| label | #000000 | #FFFFFF |
| secondaryLabel | rgba(60,60,67,0.60) | rgba(235,235,245,0.60) |
| tertiaryLabel | rgba(60,60,67,0.30) | rgba(235,235,245,0.30) |
| quaternaryLabel | rgba(60,60,67,0.18) | rgba(235,235,245,0.18) |
| separator | rgba(60,60,67,0.29) | rgba(84,84,88,0.60) |
| opaqueSeparator | #C6C6C8 | #38383A |
| systemFill | rgba(120,120,128,0.20) | rgba(120,120,128,0.36) |
| secondarySystemFill | rgba(120,120,128,0.16) | rgba(120,120,128,0.32) |
| tertiarySystemFill | rgba(118,118,128,0.12) | rgba(118,118,128,0.24) |
| quaternarySystemFill | rgba(116,116,128,0.08) | rgba(118,118,128,0.18) |

Dark mode: surfaces step #000000 (base) -> #1C1C1E (secondary) -> #2C2C2E (tertiary); this is the closest documented match to the Fitness look (true black plus graphite tiles). Source: the table above [3P].

### Liquid Glass color rules
Source: https://developer.apple.com/design/human-interface-guidelines/color
- Liquid Glass "has no inherent color" and takes color from content behind it; can be tinted ("stained glass") for emphasis, e.g. prominent buttons.
- Apply color sparingly; for primary actions color the **background**, not symbols/text; "Refrain from adding color to the background of multiple controls."
- Bars/tab bars default to monochrome symbols/text that flip dark/light with content behind.
- Avoid label colors similar to colorful content behind; prefer monochrome bars over rich content, or an accent with enough differentiation. In apps with monochromatic content, brand color as accent "can be effective".

---

## 3. Layout

| Fact | Value | Source |
|---|---|---|
| Min touch target iOS | 44 x 44 pt hit region; default control size 44x44, minimum control size 28x28 | https://developer.apple.com/design/human-interface-guidelines/buttons ; https://developer.apple.com/design/human-interface-guidelines/accessibility |
| Spacing between controls | "about 12 points of padding around elements that include a bezel" | https://developer.apple.com/design/human-interface-guidelines/accessibility |
| Safe areas | Respect system safe areas, margins and guides; content must not be covered by Dynamic Island, toolbars, tab bars. No numeric iPhone margins published in the HIG. | https://developer.apple.com/design/human-interface-guidelines/layout |
| Standard side margin | Not published in current HIG. 16 pt (compact) is the UIKit layout-margin default - **[3P/knowledge, unverified]**. |
| Controls vs content | Use Liquid Glass for controls; do not put a solid/semi-opaque bar background under controls; "use a scroll edge effect"; extend full-screen backgrounds under bars | https://developer.apple.com/design/human-interface-guidelines/layout |
| Size classes | Lay out by size class, not device | https://developer.apple.com/design/human-interface-guidelines/layout |
| Grid | Only tvOS has numeric grids (40 pt gutters); none for iPhone | https://developer.apple.com/design/human-interface-guidelines/layout |
| Concentric corners | Three shape types: **fixed** (constant radius), **capsule** (radius = half the height), **concentric** (radius = parent radius minus padding). "By aligning radii and margins around a shared center, shapes can comfortably nest." Capsule is the basis of bars, buttons, sliders, switches and grouped-table corners. Phone layouts near screen edges: "use a capsule with extra margin." | https://developer.apple.com/videos/play/wwdc2025/356/ |
| Concentric in toolbars | "standard buttons, text fields, headers, and footers have corner radii that are concentric with bar corners"; custom components must match | https://developer.apple.com/design/human-interface-guidelines/toolbars |
| Device-matching radii | iOS app icons masked so corners "precisely match the curvature of other rounded interface elements... and the bezel of the physical device" | https://developer.apple.com/design/human-interface-guidelines/app-icons |
| Numeric corner radii (cards, tiles) | Not published. |
| Left alignment | Align for scanning; important items top/leading | https://developer.apple.com/design/human-interface-guidelines/layout |

---

## 4. Components

### Tab bar (iOS 26) - https://developer.apple.com/design/human-interface-guidelines/tab-bars (change log: Jul 28 2025, Dec 16 2025, **Jun 8 2026 "Updated terminology and art"**)
- "A tab bar floats above content at the bottom of the screen. Its items rest on a Liquid Glass background that allows content beneath to peek through."
- Navigation only, not actions. Keep visible; do not hide or disable tabs; avoid overflow (More); single-word labels; SF Symbols, prefer filled; icons above labels in compact width.
- Badge = red oval with white text (number or "!"); reserve for critical info.
- Minimize on scroll: tab bar can minimize and move an attached accessory (Music MiniPlayer) inline; exit by tapping a tab or scrolling to top. API: `tabBarMinimizeBehavior(.onScrollDown)`; re-expands on opposite scroll. (https://developer.apple.com/videos/play/wwdc2025/323/)
- Bottom accessory: `tabViewBottomAccessory`; read `tabViewBottomAccessoryPlacement` to adapt content when collapsed. Do not put screen-specific actions (e.g. checkout) in it. (https://developer.apple.com/videos/play/wwdc2025/323/ ; https://developer.apple.com/videos/play/wwdc2025/356/)
- Dedicated Search tab at trailing end (`Tab(role: .search)`).
- No pt height published for iPhone (tvOS only: 68 pt).

### Navigation bar / large title - https://developer.apple.com/design/human-interface-guidelines/toolbars
- "Use a large title to help people stay oriented... transitions to a standard title as people begin scrolling." Large Title style = 34 pt Regular (Bold emphasized).
- Titles under 15 characters; do not title with the app name.
- Use standard Back/Close symbols, not text labels.
- Reduce custom toolbar backgrounds/tint; use scroll edge effect instead. Group items by function and frequency, aim for max three groups; do not group symbols with text.
- `.prominent` style for one key action (Done/Submit), trailing side, tinted. WWDC25: primary action "appears tinted, often as a blue checkmark on iOS". (https://developer.apple.com/videos/play/wwdc2025/356/)
- Scroll edge effect: soft is default on iOS; "not decorative"; do not mix or stack soft and hard. (https://developer.apple.com/videos/play/wwdc2025/356/)

### Buttons - https://developer.apple.com/design/human-interface-guidelines/buttons
- Hit region at least 44x44 pt. Always include a press state on custom buttons.
- One or two prominent buttons per view; distinguish preferred option by style, not size.
- Roles: normal, primary (accent color), cancel, destructive (system red). Do not make a destructive button primary.
- Text labels: title-style capitalization, start with a verb ("Add to Cart").
- iOS: button can show an activity indicator with changed label ("Checkout" -> "Checking out...").
- Capsule shape for iOS 26 controls: WWDC25 says large controls use capsules; capsule radius = half height. (https://developer.apple.com/videos/play/wwdc2025/356/) Numeric button heights for iOS not published (visionOS sizes: 28/32/44/52/64 pt).

### Segmented controls - https://developer.apple.com/design/human-interface-guidelines/segmented-controls
- Max about five segments on iPhone; equal widths; text or images, not mixed; nouns with title-style capitalization; use for closely related subviews, tab bar for separate sections.
- Chips/filter pills: no HIG component; treat as capsule buttons.

### Sheets - https://developer.apple.com/design/human-interface-guidelines/sheets
- Detents: large (full) and medium (~half); custom detents allowed; include a grabber on resizable sheets; swipe to dismiss; Cancel leading, Done trailing; one sheet at a time; never all of Cancel/Done/Back.
- iOS 26: partial-height sheets are inset with Liquid Glass background; bottom edges pull in to nest in the display curve; at full height the glass becomes opaque and anchors to the edge. Remove custom `presentationBackground`. (https://developer.apple.com/videos/play/wwdc2025/323/)
- Action sheets spring from the tapped element. (https://developer.apple.com/videos/play/wwdc2025/356/)

### Materials - https://developer.apple.com/design/human-interface-guidelines/materials (change: Liquid Glass)
- Two kinds: Liquid Glass (functional layer for controls/navigation) and standard materials (content layer; iOS: ultra-thin, thin, regular, thick).
- "Don't use Liquid Glass in the content layer." Exception: transient interactive elements (sliders, toggles) take glass while active.
- Use Liquid Glass sparingly on custom controls; limit to the most important functional elements.
- **Regular**: blurs and adjusts luminosity; default; use when background may hurt legibility or with significant text (alerts, sidebars, popovers).
- **Clear**: highly translucent, only over visually rich media (photos, video). If underlying content is bright, add a dark dimming layer of **35% opacity**; not needed if content is dark or AVKit supplies dimming.
- Small elements (toolbars, tab bars) flip light/dark; larger elements (sidebars) are more opaque.
- Vibrant labels/fills on materials: label, secondary, tertiary, quaternary (avoid quaternary on thin/ultraThin).
- Apply glass to the control itself, not its inner views. (https://developer.apple.com/videos/play/wwdc2025/356/)

---

## 6. Motion and haptics
Motion - https://developer.apple.com/design/human-interface-guidelines/motion
- Purposeful, brief, precise; avoid motion on frequent interactions; let people cancel/not wait; "Make motion optional... supplement visual feedback by also using alternatives like haptics and audio."
- Liquid Glass motion "responds to direct touch interaction with greater emphasis"; more subdued with trackpad.
- No spring constants/durations published in the HIG. Reduced motion: HIG motion page says make it optional; Reduce Motion specifics are in Accessibility (user preference: no accessibility audit per CLAUDE.md, listed here only for completeness).
- Menus "pop open" from the button; action sheets spring from source (https://developer.apple.com/videos/play/wwdc2025/219/ ; /356/).

Haptics - https://developer.apple.com/design/human-interface-guidelines/playing-haptics
- Use system patterns by documented meaning; consistent; complement visuals; match haptic intensity/sharpness to the animation; avoid overuse; short haptics for discrete events; make optional.
- iOS patterns: Notification (success, warning, error), Impact (light, medium, heavy, rigid, soft), Selection.
- Custom haptics via Core Haptics: transient (taps) and continuous events, with sharpness and intensity.

Ring-closing celebration: **no HIG spec.** Apple marketing says awards fill "a digital trophy case in the Fitness app on iPhone" (https://www.apple.com/watch/close-your-rings/). Watch plays a haptic + animation on close (observation, not documented in sources fetched).

---

## 7. Voice and writing - https://developer.apple.com/design/human-interface-guidelines/writing (Dec 16 2025: language patterns, possessive pronouns)
- Determine voice, then match tone to context. Apple's own example: workout goal reached -> tone is "light and congratulatory"; serious situations -> "straightforward and direct."
- Be clear, fewer words, read aloud, plain language, no jargon.
- Action oriented: use a verb on buttons; "Send" beats "Let's do it!"; avoid cute/clever labels.
- Capitalization: "Title case is generally considered formal, while sentence case is more casual. Choose a style for each UI element type and use it consistently." Buttons and segmented labels: HIG says title-style capitalization for button labels (https://developer.apple.com/design/human-interface-guidelines/buttons) and segment labels.
- Multi-step flows: start with "Get Started"; be consistent with "Continue"/"Next".
- Use possessives sparingly ("Favorites" not "Your Favorites"); avoid "we"; say "tap", not "click", on touch devices.
- Empty states: give a clear next step with a button. Errors: near the problem, no blame, say how to fix, no "oops!".
- Settings: describe what it does when on.

---


---

## 8. Jotful applied rules (derived from the above, 2026-10-18)
- Buttons: 44pt tall capsules (radius = half height), 16pt horizontal padding, icon-label gap 6pt, label 15–17pt semibold; sized to content, never squeezed. Icon-only actions: 44pt circles.
- Spacing between bezeled controls: 12pt. Side margins: 16pt.
- Nested shapes are concentric: inner radius = outer radius − padding (a 24pt card with 12pt padding holds 12pt-radius media; pills inside are capsules).
- Button labels: title-style capitalization, start with a verb when possible ("Ask AI", "Search Web", "Copy").
- Type: Dynamic Type sizes only (34/28/22/20/17/16/15/13/12/11), max 4 per screen.
- Greys: page #FFFFFF, grouped/secondary surface #F2F2F7 (systemGray6), separators rgba(60,60,67,0.29), secondary text rgba(60,60,67,0.60).
