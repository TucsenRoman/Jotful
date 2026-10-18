# r6 Rolodex: motion values and RN plan

Files: `home.html` (interactive, built by `node gen.js` from `../r5/tint.html` + `motion.css` + `motion.js`), `frames.html` (5 frozen moments; `home.html?p=0.5` freezes any moment).

## The model
One number drives the whole stack: `p` = cards fallen so far (float). Front index `f = floor(p)`, fall progress `t = p - f`.
Cards are in pure time order, newest first (index 0 = newest). `p` runs from 0 (newest in front) to N-1 (oldest in front); dragging down walks back in time. No loop.
Card `k = i - f`: `k < 0` already fell (hidden), `k == 0` is the falling card (progress `t`), `k > 0` sits at depth `d = k - t`.
Drag up just makes `p` go down, so the reverse motion is the same path backwards.
Pinned has no special order in this prototype: the pin shows only as a mark in the meta line.

## Values
| What | Value |
|---|---|
| Drag per card (`D`) | 320px, finger tracked 1:1 (`p = p0 + dy / D`) |
| Front card rest | top 440px, 346x244, radius 13 |
| Behind: offset per step | 64, 60, 56, 52, 48px higher (5 visible behind) |
| Behind: scale per step | -0.06 (1, .94, .88, .82, .76, .70) |
| Behind: brightness per step | -2.5% |
| Depth 5 to 6 | fades out; deeper (older) cards hidden until they move up |
| Card left edge | 36px (left ~28px of the stack area kept clear for a date scrubber), width 334 |
| Meta line | real capture date per card, Aug 3 to Oct 18 2026 (Today, Yesterday, then `Mon D`) |
| Fall: transform-origin | top edge centre (`50% 0`) |
| Fall: rotateX | `84deg * t` (bottom swings toward viewer) |
| Fall: translateY | `320px * t` |
| Fall: scale | `1 + 0.06 * t` |
| Fall: opacity | 1 until t=0.7, then to 0 at t=1 (passes under the sheet, z above stack, below sheet) |
| Perspective | 900px, origin 50% 380px (screen) |
| Commit | fraction > 0.35, or flick > 0.5px/ms (either direction) |
| Spring | duration 400ms, dampingRatio 0.8, starts with release velocity; = stiffness 246.7, damping 25.1, mass 1 |
| Ends | past the oldest card (down) or newest (up): drag moves at 0.3x (rubber band), release springs back to the end, no commit, no haptic |
| Haptic | one rigid impact per swap: on commit at release, or when a card fully clears mid-drag |
| Reduced motion | no tilt/track; release past threshold = 140ms crossfade out, swap, fade in |

## React Native build (Reanimated 3/4 + RNGH + expo-haptics)
```tsx
const D = 320;
const p = useSharedValue(0);          // cards fallen
const p0 = useSharedValue(0);
const notified = useSharedValue(0);
const reduced = useReducedMotion();

const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
const notify = (n: number) => { 'worklet';
  if (n !== notified.value) { notified.value = n; scheduleOnRN(tap); } // runOnJS(tap)() on Reanimated 3
};

const MAX = N - 1;
const rubber = (raw: number) => { 'worklet';
  return raw > MAX ? MAX + (raw - MAX) * 0.3 : raw < 0 ? raw * 0.3 : raw;
};

const pan = Gesture.Pan()
  .activeOffsetY([-8, 8])
  .onBegin(() => { cancelAnimation(p); p0.value = p.value; })
  .onUpdate(e => {
    p.value = rubber(p0.value + e.translationY / D);
    if (p.value < 0 || p.value > MAX) return;   // rubber band: no haptic
    if (Math.floor(p.value) > notified.value) notify(Math.floor(p.value));
    else if (Math.ceil(p.value) < notified.value) notify(Math.ceil(p.value));
  })
  .onEnd(e => {
    const f = Math.floor(p.value), frac = p.value - f, v = e.velocityY / 1000; // px/ms
    let tg = p.value > MAX ? MAX : p.value < 0 ? 0   // past an end: spring back
      : frac < 1e-4 ? f
      : v > 0.5 ? f + 1 : v < -0.5 ? f
      : e.translationY >= 0 ? (frac > 0.35 ? f + 1 : f) : (frac < 0.65 ? f : f + 1);
    tg = Math.min(MAX, Math.max(0, tg));
    notify(tg);                                      // no-op when tg == current card
    p.value = reduced ? tg   // pair with a 140ms opacity crossfade on the stack
      : withSpring(tg, { duration: 400, dampingRatio: 0.8, velocity: e.velocityY / D });
  });
```
Per card (`index` = position in time order, `N` from props), one `useAnimatedStyle`:
```tsx
const style = useAnimatedStyle(() => {
  if (p.value < 0) { /* newest-end rubber band: front lifts by p*D, rest at rest depths */ }
  const f = Math.floor(p.value), t = p.value - f, k = index - f;
  if (k < 0) return { opacity: 0 };                         // newer, already fell
  if (k === 0) return {                                      // falling
    zIndex: 1500,
    opacity: interpolate(t, [0.7, 1], [1, 0], 'clamp'),
    transform: [{ perspective: 900 }, { translateY: 320 * t }, { rotateX: `${84 * t}deg` }, { scale: 1 + 0.06 * t }],
  };
  const d = k - t, dc = Math.min(d, 5);
  return {
    zIndex: 1000 - Math.round(d * 10),
    opacity: Math.min(1, Math.max(0, 6 - d)),
    transform: [{ translateY: stackY(dc) }, { scale: 1 - 0.06 * dc }],  // stackY: cumulative 64/60/56/52/48, negative
  };
});
```
Notes for the build:
- Set `transformOrigin: 'top'` on each card (RN 0.74+), or wrap with translateY(-h/2) ... translateY(h/2) around rotateX/scale.
- Dimming: a black overlay View with `opacity: 0.025 * dc` reads better on device than a filter.
- Only the front card gets `pointerEvents="auto"` for its Search / Ask AI / Copy pills; the pan sits on the stack container.
- `scheduleOnRN` is from `react-native-worklets` (Reanimated 4); on Reanimated 3 use `runOnJS(tap)()`.
- Judge feel on the phone, not the emulator.

## Date scrubber (Photos-style, left gutter)
Spec: apple-photos-dna "Date scrubber" + ban "No visible scrubber at rest". Code: `scrubber.js`, frames: `scrubber.html`.

| What | Value |
|---|---|
| Track | x 17, y 170 to 670 (stack height), 2px, rgba(2,2,4,.06); newest at top, oldest at bottom, one card per step (index, not time) |
| Month ticks | 6x2 faint dashes at the first card of each month (Oct, Sep, Aug) |
| Thumb | 6x36 white glass pill, 44x44 hit area, centred on the track; follows `p` while the stack moves, follows the finger while grabbed |
| Bubble | glass capsule 34 tall, 15/600, left 44 (over the cards), centred on the thumb; "Sep 21", plus ", 2025" when not 2026; only while grabbed |
| Show / hide | fades in (250ms) whenever `p` changes; hidden 0.6s after motion stops (in step with the count text) and the finger is up; not tappable while hidden |
| Jump | more than 2 cards from the current one: set `p` directly + 120ms fade-in (no fall); 1 or 2 cards: the normal spring |
| Haptics | `Haptics.selectionAsync()` each time the bubble's month changes; rigid tap once on release if the card changed |

Reanimated plan:
```tsx
const visible = useSharedValue(0), grabbing = useSharedValue(0), thumbY = useSharedValue(0);
const lastMonth = useSharedValue(-1);
const months = dates.map(d => d.getMonth());          // passed to the worklet as a plain array
const yFor = (v: number) => { 'worklet'; return TOP + Math.min(MAX, Math.max(0, v)) / MAX * H; };

// show while the stack moves; fade 1s after it stops
useAnimatedReaction(() => p.value, (v, prev) => {
  if (prev !== null && v !== prev) {
    if (!grabbing.value) thumbY.value = yFor(v);
    visible.value = withSequence(withTiming(1, { duration: 250 }),
                                 withDelay(1000, withTiming(grabbing.value ? 1 : 0, { duration: 250 })));
  }
});

const scrubPan = Gesture.Pan()                         // on the 44x44 thumb only; blocks the stack pan
  .hitSlop({ horizontal: 19 })
  .onBegin(() => { cancelAnimation(p); grabbing.value = 1; visible.value = 1; p.value = Math.round(p.value);
                   lastMonth.value = months[p.value]; })
  .onUpdate(e => {
    const y = Math.min(TOP + H, Math.max(TOP, e.absoluteY - pageTop));
    thumbY.value = y;
    const i = Math.round((y - TOP) / H * MAX);
    if (i === bubbleIndex.value) return;
    bubbleIndex.value = i;                              // bubble text via useDerivedValue + AnimateableText, or scheduleOnRN(setLabel, i)
    if (months[i] !== lastMonth.value) { lastMonth.value = months[i]; scheduleOnRN(Haptics.selectionAsync); }
    if (Math.abs(i - p.value) > 2) { p.value = i; stackFade.value = 0.55; stackFade.value = withTiming(1, { duration: 120 }); }
    else p.value = withSpring(i, { duration: 400, dampingRatio: 0.8 });
  })
  .onFinalize(() => {
    grabbing.value = 0;
    p.value = withSpring(bubbleIndex.value, { duration: 400, dampingRatio: 0.8 });
    notify(bubbleIndex.value);                          // rigid tap if the card changed
    visible.value = withDelay(1000, withTiming(0, { duration: 250 }));
  });
// Gesture.Exclusive(scrubPan, pan) on the stack container so a thumb grab never also drags the stack.
```
Notes:
- The white glass thumb is faint on the light page in the mock; judge it on the phone and darken the shadow if it gets lost.
- Index mapping keeps every card reachable; switch to time-proportional spacing only if long gaps between thoughts should feel long.

## Cards left, filter, resolved (round 3)
Code: `filter.js`, `filter.css`, extra thoughts in `gen-extra.js` (17 total, 2 resolved). Frames: `filter.html`.

| What | Value |
|---|---|
| Stack | always `allThoughts.filter(match)` in time order, newest first; `p`, ends, scrubber and ticks all run on this list. Changing the filter resets to the newest match (`p = 0`) |
| Cards left | front card only, right end of the meta row, 13pt regular #8E8E93, no background: "14 more"; oldest card: "Last one" |
| Filter button | middle of the header glass capsule (Search · Filter · Settings); outline icon, becomes a filled ink circle when any filter is on |
| Popover | glass, 300 wide, radius 26, under the button, scales in from its top-right corner. "Tags" label 13 grey; pills 30 tall: off = 1.5px outline + tag-colour text, on = filled tag colour + check; divider; "Show resolved" switch (iOS green). Applies live; selection tick per change; tap outside closes |
| Chip row | y 110 under the title: quiet grey chips "• Music ×", plus "Resolved shown ×" when on; × removes that filter |
| Resolved | hidden by default (like Reminders). With "Show resolved" on they sit at their own date, greyed and struck through; never moved to the back |
| Empty | "No thoughts match." centred in the stack area |

Reanimated / RN plan:
- Keep the filtered list in React state (`useMemo` over thoughts, tags, showResolved). Pass `N` into the worklets as a shared value (`count.value = list.length`) so `rubber`, `settle` and the scrubber clamp to the right end.
- On filter change: `cancelAnimation(p); p.value = 0; notified.value = 0;` and key the card views by thought id so only matching cards mount.
- Count text is plain React on the front card: `left = N - 1 - Math.round(p)`; update it from `useAnimatedReaction(() => Math.round(p.value), i => scheduleOnRN(setFront, i))`.
- Popover: an absolutely positioned glass `BlurView` (expo-blur) with `entering={ZoomIn.springify()}` anchored top-right, or a native menu if it should feel fully system. `Haptics.selectionAsync()` on each pill or switch change.

## Round 4 changes (supersede round 3 where they differ)
- Card actions: "Search web" with Lucide globe (it opens the browser) · Ask AI · Copy. 15pt labels, 15pt icons, 6pt icon gap; each pill = content width + an equal share of the spare room, so inner sides are equal (~11pt; 14pt does not fit three labels on the 334pt card), 8pt apart, 12pt from the card edges. RN: `flexGrow: 1, flexBasis: 'auto', paddingHorizontal: 10` on each pill.
- Filter moved out of the header (capsule = Search · Settings). It sits at the left of the row under the title (y 110): plain 22pt icon, filled ink circle when a filter is on; followed by muted "All thoughts" or the active chips. `?filter=pill` shows the chip-shaped variant (grey at rest, ink when on). Popover now opens from that icon (top 146, left 16, scales from its top-left).
- Tag pills (menu) and chips (row): 15% tag tint over white, bold tag-colour text (Idea text #B88A00 for legibility). Selected menu pill: 26% tint + check + 1.5pt tag-colour border. Card tag pills unchanged.

## Round 5: live count, stack lifted
- Live count capsule: glass, 28 tall, 13pt semibold, centred at y 152 (under the filter row, above the stack). Fades in (200ms) whenever `p` moves (drag, spring, wheel, scrubber, filter change); text = `N - 1 - round(p)` + " more" ("Last one" at the end), so it ticks down as each card passes halfway; fades out 0.6s after the stack settles. Quiet count on the front card stays. RN: `useAnimatedReaction(() => Math.round(p.value), ...)` sets the text via `scheduleOnRN`; opacity = `withSequence(withTiming(1,{duration:200}), withDelay(600, withTiming(0)))` restarted on each change of `p`.
- Stack lifted: front card top 416 (was 440); 4 cards behind (was 5), steps 60/56/52/48. Front action pills now end 70pt above the capture sheet; the back card starts at y 200, clear of the capsule.
- `?filter=pill` variant removed; the plain filter icon is the design.

## Round 6: Apple button + margin spec (APPLE_SPECS.md s8)
- Front card actions: Ask AI (primary, ink) · Search Web (Lucide globe) · Copy as a 44pt icon-only circle. 44pt capsules (radius 22), 16pt horizontal padding, 6pt icon-label gap, 17pt icons, 15pt semibold, sized to content, 12pt apart, 14pt inset from the card edges. Measured: 100 + 141 + 44 + 2x12 = 309 of 313 available; nothing clipped.
- Side margins 16pt: header, filter row, capture sheet, and the card's right edge (card 36 to 377, width 341; the left 36 keeps the scrubber gutter).
- RN: `height: 44, borderRadius: 22, paddingHorizontal: 16, gap: 6, flexGrow: 0`; actions row `gap: 12`; Copy `width: 44` with `accessibilityLabel="Copy"`.

## Round 7
- Live count is plain floating text, not a capsule: 13pt regular, rgba(60,60,67,0.6), no background, centred at y 156 above the stack; same fade-in 200ms / fade-out 0.6s after settle and live updates.
- Round 8: live count text sits 8pt above the top card of the fan (top 177, back card at 200), 12pt regular, tertiary grey rgba(60,60,67,0.3).
