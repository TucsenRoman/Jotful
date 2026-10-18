# Jotful inventory (2026-10-18, from code: App.tsx, CaptureSheet.tsx, AudioTimeline.tsx)
Job: full visual redo. Structure stays. Marks pending from user (default keep).

## Home (feed)
1. Header: gradient Fraunces wordmark, Search and Settings square buttons
2. Search mode: field replaces header, "Search jots", X closes
3. Thought cards: kind tag (Idea / Question / Thought / Photo…), text with headings, bullets, numbers, checkboxes, rich text
4. Swipe right = resolve (strike + fade), swipe left = pin, two haptic detents, long right reserved
5. Card actions: Copy, Search, dark Ask AI pill
6. Attachments on cards: photos, "Video attached", audio timeline ("Playback is coming next.")
7. Empty state: moth + "Hold that thought." + "Speak or type it exactly as it arrives."

## Capture sheet
8. Bottom sheet with a random prompt ("What are you daydreaming of?"…)
9. "Write your thought…" + optional label, rich-text editor
10. Media: camera (photo/video switch, flip camera), library, review photos, remove
11. Raw audio recording with timeline
12. Save thought button with the persimmon→moss gradient; Clear thought

## Settings
13. Grouped cards: Open with (Preferred AI, browser), Capture, Your space, About

## Brand
14. Moth mark + app icons (light/dark/tinted loop)
15. Light theme only, warm paper palette, Fraunces + DM Sans

## Drift found (docs vs code)
- BRAND.md lists Moth Green #58795C, Oat, Mist, Quiet, Blush; code has no Moth Green token (wordmark hex is hardcoded) and a second `colors` object in App.tsx. Moot if reskinned; fold into one tokens file during the build.
