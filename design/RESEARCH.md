# Jotful reskin research

Sources: Apple HIG JSON endpoints (developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json, saved in `hig/`). Swipe actions and tag UX are NOT in the HIG; those bullets come from UIKit docs and app behavior (marked "app behavior").

## Part 1: Apple criteria

### Sheets  (https://developer.apple.com/design/human-interface-guidelines/sheets)
- Two system detents: **large** (full) and **medium** (about half height). Custom detents allowed. Large is always supported; medium-only stops it expanding.
- Medium = progressive disclosure (share sheet). Skip medium when content needs full height (Mail/Messages compose).
- Resizable sheets should show a **grabber** (small horizontal bar at top). Drag to resize, tap to cycle detents.
- Swipe down must dismiss. Unsaved changes: confirm with an action sheet.
- iPhone sheets can be **nonmodal**: parent stays tappable while the sheet is up (Notes formatting sheet is Apple's example). This is the right model for a small persistent bottom sheet (Maps, Find My, Music mini player use it; HIG only names Notes).
- Sheet vs full screen: sheet for a short, self-contained task. Complex or long flows, or media/camera, go full screen.
- One sheet at a time; close the first before opening another.
- Buttons: Cancel/Close leading, Done trailing. Never show Cancel + Done + Back together; pair Done with Cancel or Back.

### Swipe actions on rows  (app behavior + https://developer.apple.com/documentation/uikit/uiswipeactionsconfiguration)
- HIG has no swipe-actions page. Lists page only says to support editing and keep rows short: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
- UIKit: `leading` config = swipe from the left edge (right swipe), `trailing` = from the right edge (mirrors in RTL).
- The first action in the array sits farthest from the row, and **full swipe runs it** (`performsFirstActionWithFullSwipe` defaults true).
- Mail: trailing = Trash (red), More (gray), Flag (orange); leading = Read/Unread (blue). Reminders: trailing = Delete (red), Flag (orange), Info (gray). Destructive goes on the trailing edge, outermost.
- Destructive style = system red. Others are tinted with system colors, icons (SF Symbols) with short labels.
- Haptic: a light tick when the full-swipe threshold is crossed; destructive full swipe asks no confirm (relies on undo).

### Color  (https://developer.apple.com/design/human-interface-guidelines/color)
- Don't use one color for two meanings. Color for status/interactivity must be consistent.
- Never rely on color alone; pair with label or glyph.
- Use system colors via API, do not hard-code values (they change by release). System set: red, orange, yellow, green, mint, teal, cyan, blue, indigo, purple, pink, brown, plus gray 1-6.
- Provide light, dark and increased-contrast variants even if the app ships one appearance (Liquid Glass adapts).
- Liquid Glass has no color of its own; tint sparingly, put color on the **background** of the one primary action (prominent button), not on every control.
- Tags (app behavior, not HIG): Finder's 7 tag colors are red, orange, yellow, green, blue, purple, gray (Apple default names Red, Orange, Yellow, Green, Blue, Purple, Gray). Reminders and Notes (iOS 15+) use typed **#tags** (no spaces, many per item), shown as colored text pills, browsed in a **Tag Browser** (tag grid at the bottom of the main screen) that filters by one or more tags and feeds Smart Lists / Smart Folders. Sources: https://appleinsider.com/articles/21/08/02/how-to-use-tags-in-reminders-ios-15 , https://9to5mac.com/2021/10/22/how-to-organize-iphone-reminders-with-tags-ios-15/

### Toolbars / nav bar in iOS 26  (https://developer.apple.com/design/human-interface-guidelines/toolbars)
- Three zones: leading (back/sidebar, title), center, trailing (key actions, search, More). Aim for max **3 groups**; fewer items beats crowded.
- iOS: only the most important actions in the bar, extras in a **More** menu. Use a large title that collapses on scroll.
- Use the standard Back/Close symbols, not text labels.
- Use plain system symbols **without borders**; the glass group is the container. One **prominent** (tinted) primary action (Done/Submit), on the trailing side.
- Reduce custom backgrounds and tint; let content under the glass set the look. Avoid label colors close to the content behind.
- A "+" (add) is a normal trailing bar item when adding is a main task of that screen; keep text-labeled buttons separated by fixed space from symbol buttons.
- Titles: short, under 15 characters; don't use app name as title.

### Materials / Liquid Glass / type  (https://developer.apple.com/design/human-interface-guidelines/materials , .../typography)
- Liquid Glass is the **functional layer** (tab bars, toolbars, sidebars, controls) floating above content. Do NOT use it in the content layer (cards, backgrounds).
- Use it sparingly on custom controls. Variants: **regular** (default, blurs, for text-heavy), **clear** (very translucent, only over photo/video; add ~35% dark dim if the content is bright).
- Content layer uses standard materials: ultra-thin, thin, regular, thick; use system vibrant colors on top.
- SF Pro iOS default sizes (pt / leading): Large Title 34/41 regular (bold emphasized), Title 1 28/34, Title 2 22/28, Title 3 20/25, Headline 17/22 semibold, **Body 17/22**, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1 12/16, Caption 2 11/13. Min readable size 11 pt, default 17 pt.
- Text styles scale with Dynamic Type; the system adjusts tracking per size.

### Haptics  (https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- Three feedback families: **Notification** (task outcome: success/warning/error), **Impact** (physical metaphor: snap, thud; light/medium/heavy/soft/rigid), **Selection** (values changing, e.g. picker ticks).
- Use patterns for their documented meaning; don't reuse a pattern for a different meaning.
- Keep a clear cause and effect; consistent across the app.
- Match haptic intensity/sharpness to the animation it goes with; pair with visual/audio.
- Short haptics for discrete events; avoid long-running ones. Don't overuse.
- Make haptics optional and never required; standard controls already play system haptics.
- Don't haptic during camera/mic use where vibration disrupts it (relevant to Jotful recording).

## Part 2: Rotary card files

### How the object works
- A **Rolodex** (Rolodex = "rolling index", patented 1950s; Wikipedia credits Hildaur Neilsen, 1956; Cooper Hewitt dates one to 1950) is a rotating card file. Sources: https://en.wikipedia.org/wiki/Rolodex , https://www-6.collection.cooperhewitt.org/objects/18653089
- Cards have a slot at the top edge (two notches) and **hang on a horizontal spindle/rail** (two rings) running through the drum.
- The cards fan out around the spindle like a wheel. Only the **top edges** of the cards behind and in front are visible as a fan; **one card lies flat open** facing you at the top front.
- A **knob at each end** of the spindle spins the whole wheel; a ball-bearing detent (Rolomatic) holds it at any stop.
- **Tabbed alphabet dividers** (A-Z guide cards with raised tabs, often blue) stick out so you jump to a letter.
- Cards are small (1.75x3.25 in, 2.25x4 in, or 3x5 in). Card pops forward when you tap a release; opens like a page being turned.
- Variants: open (stand with exposed cards), covered, flip-top (image 1), vertical drum (image 5 is a large one seen from the side).
- Wheeldex / library catalog wheels: no good web results; the Rolodex is the canonical form.

### Photos (local files in this folder)
| File | Source | Description |
|---|---|---|
| rolodex-1.jpg | https://commons.wikimedia.org/wiki/File:Rolodex.agr.jpg (CC BY 2.5) | Flip-top Rolodex from the front: open card flat, A-D blue tabs stacked behind |
| rolodex-3.jpg | https://commons.wikimedia.org/wiki/File:Rolodex%E2%84%A2_67236_Rotary_Business_Card_File.jpg (CC BY-SA 3.0) | Best one: open rotary file at 3/4 angle, blue tabbed dividers, white fan of cards on the drum, side knobs |
| rolodex-4.jpg | https://commons.wikimedia.org/wiki/File:Rollkartei_hg.jpg (CC BY-SA 2.5) | Steel-stand rotary file, front 3/4 view, front card flat, dividers A, B, C visible, cards fan out left |
| rolodex-5.jpg | https://commons.wikimedia.org/wiki/File:A_large_filled_rolodex_viewed_from_the_side.jpg (CC BY-SA 2.0) | Side view of a full drum: the cards form a radial sunburst around the knob |
| rolodex-6.jpg | https://commons.wikimedia.org/wiki/File:Rolodex-Linear.jpg (CC BY-SA 4.0) | Cards seen edge-on as stacked colored layers with tabs: how the top-edge strips look |

### Digital interpretations (reference only)
| File / URL | Description |
|---|---|
| ref-coverflow.png, https://en.wikipedia.org/wiki/Cover_Flow | Cover Flow: centered face-on item, neighbors angled back in perspective with reflection (horizontal, not a drum) |
| ref-radioshack-digital-rolodex.jpg, https://commons.wikimedia.org/wiki/File:Modern_Rolodex.JPG | Rolodex-branded LCD digital organizer (1990s): the brand's own "digital Rolodex" |
| https://www.framer.com/marketplace/components/nr-rolodex/ | Framer "NR - Rolodex": upright front card, others lean back with index tabs, drag/arrow keys |
| https://21st.dev/community/components/explore/rolodex-animation | 21st.dev set of React rolodex card-cycling components |
| https://www.npmjs.com/package/react-rolodex | react-rolodex: vertical rolodex-style card component |
| https://www.framer.com/community/marketplace/components/3d-deck-carousel-pro/ | 3D deck carousel: active card forward, neighbors scale and recede |
| https://dribbble.com/SandrineBJ/collections/7504100-Interaction | Dribbble collection with a "Rolodex card interaction effect" shot (not downloaded) |

## Design takeaways
1. Wallet-style stack and a Rolodex are the same idea: a pile where you only see each item's top strip and one is open. In Wallet you scroll a vertical stack; a Rolodex rotates a drum. Rotation = scroll mapped to angle.
2. Alphabet/tag tabs ride the card edge; Finder tag colors (7 colors) and #tags could become the colored tabs.
3. Persistent bottom sheet should be nonmodal with medium/large (and a small custom) detents, a grabber, and swipe-down dismiss.
