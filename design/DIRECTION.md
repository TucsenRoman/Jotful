# Jotful direction (2026-10-18)

Chosen: **Apple Wallet's skin on Jotful's structure** (like Apple Fitness → Viseez). Thoughts are a stack of passes; each kind has its own finish; the front card opens with Search / Ask AI / Copy; white system background, SF system type, big bold title, black round buttons, white capture sheet with the random prompt.

## Settled in round 3 (2026-10-18)
- Colour = tag. One colour per tag, from Apple's system set (see brief-r3.md). Untagged = white card. Tag name always shown in caps next to the colour.
- Home stack becomes a Rolodex (rotary card file) take on Wallet's stack.
- No + in the header: title + one glass group (Search, Settings). Capture lives in the sheet.
- Detail view stays (card on top, panels below), placement driven by NOTES.md reasoning.
- Spec: .claude/skills/apple-wallet-dna (Wallet DNA, local refs). Research: design/RESEARCH.md.

## Settled in round 4 (2026-10-18, user feedback on round 3)
- Tag colours stay, but calmer: deep, muted finishes like real Wallet cards (brick, mulberry, rust, mustard, forest, slate, dusk violet, deep teal), white text, faint top sheen. Too bright = cartoony.
- Peek sheet: liked, keep.
- Voice: tap an X to cancel (no slide-to-cancel); keep swipe-up to lock.
- Swipe flipped: RIGHT = resolve, LEFT = pin. (Code today is the opposite; change at build.) Reserved long swipe moves to the left side.
- Swipe action backs are neutral (graphite / white), never a tag colour.
- Resolved card: grey + struck through only, no "Done" label.
- Mock imagery: real Unsplash photos, never drawn placeholder shapes.

## Settled in round 5 (2026-10-18)
- Tag colour moves to a bright pill around the tag label (the r3 bright hexes). The card itself is either a very faint tint of the tag colour or plain grey: both to be mocked, user picks.
- Camera and photo capture: reuse the existing Jotful interface (src/components/CaptureSheet.tsx); don't redesign it.
- Detail view: still not right; find a different reference than Wallet for it.

## Settled in round 6 (2026-10-18)
- TINTED cards win: card = faint tint (~9%) of its tag colour, dark text; bright tag colour only on the pill (design/mocks/r5/tint.html).
- Rolodex simplified: front card biggest, cards behind smaller, no tabs sticking out. Drag down: the front card pulls forward, its bottom dips in and it falls on its face out of view; the next card comes forward; one haptic per swap.

## Settled in round 7 (2026-10-18)
- Rolodex flip animation approved ("really clean"). No loop: time order (newest in front), stops at both ends.
- Add a date scrubber on the LEFT edge, modelled on Apple Photos' scroll-indicator date bubble.
- Second reference: Apple Photos (apple-photos-dna), combined with Wallet: Wallet = home stack and cards; Photos = detail view, media, date scrubber. Detail: Photos-style, with actions moved to the top-right glass group or a vertical floating glass bar on the left over the image.

## Settled in round 8 (2026-10-18)
- Detail A and B rejected (too much negative space). Info-style layout liked: it becomes the base.
- Detail must be standardized across every content combo (text, voice, media = image/video, mixed). Hero priority media > voice > text; Ask AI + Search overlaid on the hero in the same spot for every type.

- Date scrubber (design/mocks/r6/home.html, scrubber.html) approved as is.

## Settled in round 9 (2026-10-18)
- Detail matrix (one template, hero priority) liked. Override of Photos DNA: the hero is inset (16pt margins, rounded), never edge to edge.
- Front Rolodex card shows a quiet "N more" count.
- Filter in the header group: tag multi-select + "Show resolved". Resolved are hidden by default, shown in their time position when toggled. Never moved to the back (breaks time grounding). (Recommended by Claude; user to confirm.)

- Detail view with inset hero APPROVED ("so much better"): design/mocks/r8/detail (gen.js, detail.css, NOTES.md = the standard).

## Settled in round 10 (2026-10-18)
- "Search" → "Search web" with a globe icon (it opens the browser). Even padding on card action pills.
- Filter button leaves the header; it sits at the left of the chip row under the title (plain floating icon by default, pill version to compare).
- Filter/chip tag pills: tinted background, bold tag colour as text.
- Detail: ALL of a thought's content in ONE card (media → voice → text), action pills at the card's bottom inside it.

## Settled in round 11 (2026-10-18)
- Filter: plain floating icon at the left of the chip row (approved). Writing sheet: fine for now.
- Count must be visible while dragging (capsule above the stack), plus the quiet one on the front card.
- Voice lock: NOT swipe-up (fights the iOS home gesture). Comparing slide-left vs. drag-out ring.

## Settled in round 12 (2026-10-18)
- Detail content card is grey (#F2F2F7) for every thought; tag colour only on the pill.
- Swipe actions: small circle revealed beside the card, not a full-height back card.
- Follow Apple's documented specs (APPLE_SPECS.md in apple-wallet-dna/research): 44pt capsules, 16pt padding, 12pt between controls, title-case labels ("Search Web").

## Settled in round 13 (2026-10-18)
- Detail view (grey card, Apple-spec buttons) approved.
- Voice: ONE button does everything (hold, slide-left lock, tap to save); no secondary cancel/stop buttons; cancel = swipe the sheet down + Undo.
- Count while swiping: plain subtle grey floating text, no pill.
- Swipe: other cards fade out while one card is swiped.

## Settled in round 14 (2026-10-18)
- Voice: hold, locked (stop square, tap to save) and swipe-down cancel APPROVED. Lock gesture = mic fixed; a circle grows from it with drag distance until it meets a target ring that appears on drag → locks.
- Swipe on a thought (right resolve, left pin, small circles, others fade) ACCEPTED.
- Count as floating grey text APPROVED; scrubber shows whenever the Rolodex is swiped, with the count.

## Round 15 (2026-10-18): ALL APPROVED ("locked and loaded")
- Voice ring lock approved; scrubber-with-count approved. Last tweak: count text 8pt above the fan, 12pt tertiary grey.
- Final mock set: design/mocks/r6/home.html (+count, filter, scrubber, frames strips), design/mocks/r8/detail (template + NOTES.md), design/mocks/r3/sheet (peek, writing, voice-one*), design/mocks/r3/swipe (frames, swipe).

## Brand book decisions (2026-10-18)
- Wordmark: KEEP the gradient Fraunces "Jotful" (persimmon → moth green → roast, BRAND.md spec) as the one brand moment in the header; the rest of the UI is system font. The mocks' plain system "Jotful" is superseded.
- Light is the truth; dark values shown as a proposal.

Lost: Moonjar (lavender wash, highlighter), Amy (chunky outlines, peeking moth). Carry-overs: pending user answer.

Round-1 rough mock (not kept). Known rough edges: card titles cut mid-line by the next card; capture buttons cut at the bottom; no swipe hint; pinned uses an Apple Card-like gradient (check against Wallet's real finishes).

Inventory/keep-list: design/INVENTORY.md (all keep; #15 warm paper theme + Fraunces/DM Sans is what changes).
