---
name: apple-wallet-dna
description: Apple Wallet's iOS 26 design system (pale grey page, deep stack of saturated pass cards showing only their top strip, large black title, white glass buttons, white panels under an open card), codified as the bar for Jotful's reskin. Use when building or judging Jotful UI against the Wallet reference (home stack, thought detail, capture sheet, any new screen).
---

# Apple Wallet DNA

The reference the user picked on 2026-10-18 for Jotful's reskin: Apple Wallet for iPhone. Jotful borrows its system (thoughts become passes), never its marks.

## Files
- `PROMPT.md`: the payload (under 2KB). Attach `reference/stack.jpg` and `card-detail.jpg` first.
- `dna.json`: the full record: measured colours, geometry, 7 signatures, the weird move, 4 archetypes, bans, tests W1–W11, reconstruction log, uncertain values.
- `reference/`: press and App Store screenshots of Wallet. **Local only**: excluded through `.git/info/exclude` because the Jotful repo is public. Never commit or publish them.
- `example/`: screens rebuilt from dna.json alone, used to test the spec.

## How to use in Jotful
Thoughts are cards; each kind (Idea, Question, Thought, Photo, Voice, Draft) gets its own finish. The moth and the wordmark stay Jotful's; the system font replaces Fraunces and DM Sans in chrome (open question for the user: keep Fraunces on card titles?). Tests are judged by eye on rendered output; W1, W2, W4, W5, W7, W8, W10 could be scripted later.
