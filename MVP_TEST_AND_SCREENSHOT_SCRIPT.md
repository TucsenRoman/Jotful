# Unsorted v1 — iPhone Test and Screenshot Script

Run this script in the installed development build before creating the production build. Keep the app in light appearance and use the same iPhone for every screenshot.

## Test 1 — The core capture loop

1. Start with an empty All thoughts workspace.
2. Tap the thin capture footer. It should stay inset from the screen edges, rise above the keyboard, and never float mid-screen.
3. Enter this exact brain dump:

   ```text
   What should the first Unsorted launch include?
   Maybe a daily review could help people return to ideas.
   Remember to ask three friends to try the beta.
   ```

4. Confirm the sheet reports **3 separate thoughts found locally**.
5. Tap **Save thoughts**.
6. Confirm that three cards appear, labelled Question, Idea, and Task.

Screenshot A: the three resulting thought cards and their inline actions.

## Test 2 — Actions stay intentional

1. Tap **Search** on the question. Confirm a browser opens only after the tap.
2. Tap **Ask AI** on the idea. Confirm the consent alert appears before a browser opens.
3. Tap the ellipsis on the idea and choose **Make a task**. Confirm it moves into Tasks and the card label changes to Task.
4. Tap **Resolve** on any card, then **Reopen**. Confirm both state changes work.

Screenshot B: an open Thought actions menu showing Make an idea / Make a task / Move / Resolve choices.

## Test 3 — Workspace and local search

1. Use the workspace pill in the header and select **Tasks**. Confirm only task cards are visible.
2. Tap the header search icon and search `beta`. Confirm the matching task is found.
3. Clear search, switch back to **All thoughts**, and verify all cards return.

Screenshot C: the expanded header search with a filtered thought.

## Test 4 — Offline and persistence

1. Turn on Airplane Mode.
2. Create one thought: `Offline capture still works.`
3. Force-quit Unsorted and reopen it.
4. Confirm the thought remains. Turn off Airplane Mode afterwards.

Screenshot D: the empty-state screen with the branded capture footer, or the capture sheet open with a messy draft.

## Release decision

The MVP passes only when every confirmation above succeeds. Record any issue with the screenshot and the exact action that caused it. The four screenshots above are also the intended App Store screenshot story; replace any that expose personal notes with the supplied sample text.
