# Unsorted product plan

## Product promise

Unsorted is a private thought inbox: speak or write without formatting, then act on each thought only when it becomes useful.

## Core experience

1. A person speaks or writes a messy stream of text in one calm capture sheet.
2. The app splits it into individual thoughts locally.
3. Each thought is classified as a question, idea, or general thought.
4. The thought has immediate, optional actions: Search web, Ask AI, and More.
5. More actions can resolve or delete it.

The original goal is not automatic organization. It is reducing the friction between having a thought and choosing what to do with it.

## MVP: ship this

| Capability | MVP behavior | Why it matters |
| --- | --- | --- |
| Capture | One multiline thought dump with no required title, tag, or folder | Makes capture genuinely faster than a conventional notes app |
| Voice capture | On-device voice-to-text when supported by the iPhone | Lets someone capture a thought without typing or sending audio to Unsorted |
| Thought splitting | Split at new lines and sentence endings; show the prospective count before saving | Delivers the central magic without a cloud model |
| Classification | Local rules identify questions and ideas | Lets actions feel relevant while preserving privacy |
| Inline actions | Search web, Ask AI with a consent step, and More | Turns a note into an immediately useful unit |
| Home widget | A compact count of loose thoughts on the iPhone Home Screen | Keeps the capture habit visible without adding organization work |
| Resolution and search | Resolve an item when it is done; search text locally | Enough control after capture, not before it |
| Privacy | Local SQLite, no account, no analytics, no automatic sends | Clear App Store disclosure and product differentiation |

## Not in v1

- Cloud sync or a user account
- Shared notes and collaboration
- In-app paid AI API calls
- Calendar, task-manager, or note-app integrations
- Tasks, folders, workspaces, or project management
- Automatic sending of any note content

These may be valuable later, but each introduces privacy, support, and App Review surface area that delays launch.

## Tech stack

| Layer | Choice | Rationale |
| --- | --- | --- |
| Client | Expo SDK 57 + React Native + TypeScript | Works on Windows and ships iOS/Android from one codebase |
| Persistence | `expo-sqlite` | Durable local database that works offline |
| Segmentation | Deterministic local TypeScript rules | Fast, private, testable, and zero-cost at MVP scale |
| Search / AI | Browser deep links after explicit tap | No server, credentials, or note transmission by default |
| Voice | `expo-speech-recognition` using required on-device recognition | Captures speech without a transcription backend when the iPhone supports it |
| Widget | `expo-widgets` + Expo UI | Adds an iOS Home Screen companion with no native Xcode work |
| Release | EAS Build + EAS Submit + TestFlight | Creates signed iOS builds and submits them from Windows |

## Quality gates before public release

1. Test capture/splitting with at least 50 real anonymous brain dumps; manually check false splits and missed splits.
2. Confirm data remains after force-closing and reopening the app.
3. Confirm Search web and Ask AI never run until a user taps the button; verify the AI consent copy.
4. Confirm Voice asks for microphone permission only when tapped, transcribes locally, and handles an unavailable on-device recognizer gracefully.
5. Add the Home Screen widget and confirm its thought count updates after capture and resolution.
6. Test VoiceOver labels, Dynamic Type, light/dark appearance, and iPhone SE-sized screens.
7. Use a TestFlight build on a real iPhone for at least one week.
8. Publish the privacy policy and support page, then complete App Store metadata and App Privacy disclosures.

## First post-launch upgrade

Improve splitting with a compact on-device model or user-corrected feedback only after the rule-based version has enough real evidence about where it fails. Sync should arrive after the app has proved the core capture loop.

## Post-launch backlog: audio thoughts

**Concept:** Let a person capture an **audio thought** alongside text and voice-to-text. This is not dictation: it preserves the original sound for musical ideas, spoken reflections, conversation notes, or any moment where the recording matters more than a transcript.

### Initial scope (v1.1 candidate)

- Record, stop, and play an audio thought locally on-device.
- Save the audio file plus duration, timestamp, and local file path in the existing local persistence layer.
- Show a compact audio-thought card with playback, duration, resolve, delete, and export/share actions.
- Request microphone permission only after a person explicitly chooses Audio.
- Provide a storage view or setting that makes local recording usage understandable.

### Explicitly defer

- Cloud sync or account-backed audio
- Background recording
- Automatic transcription, audio search, or AI processing
- Automatic uploading or sharing

**Product rule:** Audio must remain useful even if it is never transcribed. A future “transcribe” action may be optional, but the original local recording remains the source of truth.
