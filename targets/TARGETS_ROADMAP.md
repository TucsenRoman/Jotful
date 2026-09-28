# Jotful Apple target roadmap

`targets/` is the home for code and configuration that belongs to an Apple
target rather than the main phone app. It is deliberately plural: a target is
a separately built Apple component that still ships with Jotful.

## Current targets

### Main iPhone app

The default Expo target is the source of truth for Jotful's local database,
media, recovery drafts, and the primary UI.

### Apple Watch companion (`watch/`)

Purpose: rapid, private capture from the wrist.

The Watch queues a uniquely identified text capture through WatchConnectivity.
The paired iPhone must durably store that capture before it acknowledges it.
That acknowledgement/deduplication work is intentionally the next Watch
milestone; it prevents retries from creating duplicates or losing a thought.

### iPhone/iPad widgets (`widgets/`)

Purpose: glance at recent jots and start a text or voice capture without
opening the full app.

The existing Capture and Recents widget sources live here now. They continue
to use `expo-widgets`, which generates the native WidgetKit extensions from
the `expo-widgets` entry in `app.json`. This keeps their current snapshot
updates and App Group behavior intact while organizing the source beside the
other target-specific code.

## Candidate targets (not active implementation)

### Watch complication / Watch widget

Purpose: a Watch-face entry point that opens Jotful straight into capture, or
shows a small count of unresolved jots. Keep it deliberately lightweight;
the full Watch app remains the place to write and review. This is a `watch-widget`
target built with WidgetKit and should follow validation of the Watch companion.

### Share extension

Purpose: save selected text, links, photos, or audio from another iPhone app
into Jotful. The extension would write a durable incoming-capture record to
the shared App Group, then the main app would import it into the normal draft
and recovery pipeline. It must never rely on the main app already running.

### App Clip

Purpose: an instant, very small Jotful experience launched from a QR code or
NFC tag, for example at a rehearsal or studio. It should only capture a
temporary thought and hand it off safely after the full app is installed.
It is lower priority because Jotful's value is private, persistent capture,
not anonymous use.

### Siri and Shortcuts (App Intents) (Future MCP connection)

Purpose: phrases and Shortcuts actions such as “Jot a music idea” or “Open
Jotful capture.” This is implemented with Apple's App Intents/Shortcuts APIs,
not MCP: Siri needs an explicit user-authorized native intent that creates a
normal local jot. Voice capture must preserve the same draft and recovery
guarantees as the phone composer.
