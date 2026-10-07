# Jotful — iPhone release test plan

Run this script in an installed development build before creating a production
build. Keep screenshots free of personal notes.

## Test 1 — The core capture loop

1. Cold-launch Jotful. Confirm the keyboard stays hidden until capture, search,
   or another text field is deliberately opened.
2. Start with an empty Jotful inbox.
3. Open the capture footer. It should rise above the keyboard without blocking
   the Search or Settings buttons.
4. Enter this exact brain dump:

   ```text
   What should the first Unsorted launch include?
   Maybe a daily review could help people return to ideas.
   I should ask three friends to try the beta.
   ```

5. Confirm the **Save thought** control becomes active, then tap it.
6. Confirm that three cards appear, labelled Question, Idea, and Thought.

Screenshot A: the three resulting thought cards and their inline actions.

## Test 2 — Actions stay intentional

1. Tap **Search** on the question. Confirm a browser opens only after the tap.
2. Tap **Ask AI** on the idea. Confirm the consent alert appears before a browser opens.
3. Tap **Copy** beside Ask AI. Confirm the thought is available to paste elsewhere.
4. Tap the ellipsis on the idea and choose **Settle this thought**. Confirm its state changes.
5. Tap **Bring it back**. Confirm the thought returns to the active list.

Screenshot B: a thought with Search, Ask AI, and Resolve actions.

## Test 3 — Voice, audio, and local search

1. Tap the capture footer, then the microphone control. Grant microphone permission when iOS asks.
2. Speak: `Could a daily review help people return to ideas?` Pause for at least five seconds, then continue speaking. Confirm recording continues until the stop control is tapped; save the resulting thought.
3. Record an audio thought, save it, force-quit the app, and reopen it.
   Confirm playback still works from the list item.
4. Before installing the next build over this one, record and save a second
   audio thought. Install the update without deleting Jotful, then confirm both
   recordings still play. This verifies that recordings are stored in durable
   app Documents storage rather than an update-cleared cache location.
5. Tap the header search icon and search `beta`. Confirm the matching thought is found.
6. Clear search and verify all thoughts return.

Screenshot C: voice capture or the expanded header search with a filtered thought.

## Test 4 — Offline, draft recovery, and persistence

1. Turn on Airplane Mode.
2. Create one thought: `Offline capture still works.`
3. Begin an unsaved text, photo, video, and audio capture one at a time, then
   force-quit Jotful before saving each. Confirm a recovered item is marked
   **Draft** after reopening.
4. Force-quit Jotful and reopen it.
4. Confirm the thought remains. Turn off Airplane Mode afterwards.

Screenshot D: the empty-state screen with the branded capture footer, or the capture sheet open with a messy draft.

## Test 5 — Home Screen widget

1. Long-press the iPhone Home Screen and add **Jotful** in the widget gallery.
2. Confirm the widget renders on its neutral background with circular write and microphone controls, without crashing the app.
3. Tap each action: write should open the capture sheet ready to type, and the microphone should open it ready to record.

## Release decision

The MVP passes only when every confirmation above succeeds. Record any issue with the screenshot and the exact action that caused it. The four screenshots above are also the intended App Store screenshot story; replace any that expose personal notes with the supplied sample text.
