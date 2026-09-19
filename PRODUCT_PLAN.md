# Unsorted product plan

## Product promise

Unsorted is a private thought inbox: write without formatting, then act on each idea only when it becomes useful.

## Core experience

1. A person writes a messy stream of text in one calm note canvas.
2. The app splits it into individual thoughts locally.
3. Each thought is classified as a question, idea, task, or general thought.
4. The thought has immediate, optional actions: Search web, Ask AI, and More.
5. More actions can move it to Ideas/Tasks, share it, or delete it.

The original goal is not automatic organization. It is reducing the friction between having a thought and choosing what to do with it.

## MVP: ship this

| Capability | MVP behavior | Why it matters |
| --- | --- | --- |
| Capture | One multiline thought dump with no required title, tag, or folder | Makes capture genuinely faster than a conventional notes app |
| Thought splitting | Split at new lines and sentence endings; show the prospective count before saving | Delivers the central magic without a cloud model |
| Classification | Local rules identify questions, ideas, and tasks | Lets actions feel relevant while preserving privacy |
| Inline actions | Search web, Ask AI with a consent step, and More | Turns a note into an immediately useful unit |
| Organization | Move an item to Ideas or Tasks; local text search | Enough structure after capture, not before it |
| Privacy | Local SQLite, no account, no analytics, no automatic sends | Clear App Store disclosure and product differentiation |

## Not in v1

- Cloud sync or a user account
- Shared notes and collaboration
- In-app paid AI API calls
- Calendar, task-manager, or note-app integrations
- Audio transcription
- Automatic sending of any note content

These may be valuable later, but each introduces privacy, support, and App Review surface area that delays launch.

## Tech stack

| Layer | Choice | Rationale |
| --- | --- | --- |
| Client | Expo SDK 57 + React Native + TypeScript | Works on Windows and ships iOS/Android from one codebase |
| Persistence | `expo-sqlite` | Durable local database that works offline |
| Segmentation | Deterministic local TypeScript rules | Fast, private, testable, and zero-cost at MVP scale |
| Search / AI | Browser deep links after explicit tap | No server, credentials, or note transmission by default |
| Release | EAS Build + EAS Submit + TestFlight | Creates signed iOS builds and submits them from Windows |

## Quality gates before public release

1. Test capture/splitting with at least 50 real anonymous brain dumps; manually check false splits and missed splits.
2. Confirm data remains after force-closing and reopening the app.
3. Confirm Search web and Ask AI never run until a user taps the button; verify the AI consent copy.
4. Test VoiceOver labels, Dynamic Type, light/dark appearance, and iPhone SE-sized screens.
5. Use a TestFlight build on a real iPhone for at least one week.
6. Publish the privacy policy and support page, then complete App Store metadata and App Privacy disclosures.

## First post-launch upgrade

Improve splitting with a compact on-device model or user-corrected feedback only after the rule-based version has enough real evidence about where it fails. Sync should arrive after the app has proved the core capture loop.
