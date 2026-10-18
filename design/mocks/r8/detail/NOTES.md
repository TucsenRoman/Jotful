# Thought detail, round 8: one template for every combo (the standard)

Generator: `node gen.js` writes `<combo>.html` from a thought shaped like `src/storage.ts` (text + attachments of kind image / video / audio). Shared styles: `detail.css`. Board: `check/board-full.png`. Matrix: `matrix/board-full.png`.

## Text rule
Stand-in labels the app writes when there's no real text ("Photo", "2 photos", "Video", "Audio recording") count as NO text and are never shown.

## Top bar (always)
Three glass islands: Close · relative date over time ("Today / 9:12 AM") · Resolve + More. More = Pin/Unpin, Edit, Share, Delete (red). No bottom bar.

## The content card (one per thought, holds ALL its content)
A framed object like a home card: 16pt side margins, 12pt below the top bar, 24pt corners, 12pt inner padding, 12pt between blocks. Background = #F2F2F7 (systemGray6) for every thought; the tag colour appears only in the tag pill.

Inside, top to bottom, only what exists:
1. **Media** (image or video): 250pt tall, 12pt corners (concentric: 24 − 12 padding). Several = swipe, page dots bottom-right, thin filmstrip under it inside the card. Video = poster, glass play glyph, duration chip, thin scrub bar.
2. **Voice row:** play button, waveform, duration, on a white inner row with 12pt corners.
3. **Text:** 22pt; 28pt when the text is the only content.
4. **Actions, always the card's bottom edge:** Ask AI · Search Web (globe; it opens the thought in the browser) · Copy. Per Apple (APPLE_SPECS.md s.8): 44pt capsules, 16pt side padding, 6pt icon-label gap, 15pt semibold title-case labels, sized to content, 12pt apart; Copy is a 44pt circle. Row width 314pt fits the 337pt inner width.

Voice-only thought: the card is the dark voice block (big play, draggable waveform, times) with the same action row at its bottom in smoked glass.

## Under the card (fixed order, only what exists)
1. Tag pills (bright) + Add.
2. One grey grouped card: captured date/time + blue Adjust · From (iPhone / Camera / Widget / Watch) · Attachments count (only if any) · Pinned toggle.
3. Resolve, full-width grey pill.

The page starts right under the top bar and scrolls; nothing is pinned to the bottom, so there's no dead space.

## Matrix
1-text · 2-voice · 3-photo · 4-video · 5-text-photos · 6-text-voice · 7-voice-photo · 8-text-voice-photo.

## Photos DNA notes
Kept: glass islands, no colour on chrome (blue only on Adjust).
Apple specs: Dynamic Type sizes only, at most 4 per screen (28 or 22 / 17 / 15 / 13); 16pt margins; 12pt between bezeled controls; 44pt targets; separators rgba(60,60,67,.29); secondary text rgba(60,60,67,.6).
Deliberate Jotful overrides of the Photos DNA (user's call):
1. The content is a framed card (16pt margins, 24pt corners), not edge-to-edge square media, so it matches the home cards.
2. No bottom island bar; Share and Delete live in More.
3. The actions live inside the content card instead of in a bottom capsule.
