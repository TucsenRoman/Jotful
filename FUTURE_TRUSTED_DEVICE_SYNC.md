# Trusted-device sync (post-MVP)

## Status

This is a future direction, not an MVP feature and not active implementation work.

Jotful should eventually let one person's devices exchange jots without
requiring a Jotful account, Google account, email, or a third-party cloud
service. The first useful use case is a music idea captured on an iPhone and
viewed beside MuseScore on a trusted computer.

## Product shape

- A paired Apple Watch can send a capture to its companion iPhone.
- A phone can send or synchronize jots with a trusted nearby computer on the
  same LAN.
- A future desktop Jotful companion can provide a searchable, side-by-side
  reference surface for creative software such as MuseScore.
- Remote, account-backed sync may be considered later, but is not required for
  local trusted-device sync.

## Trust and privacy

- Pair devices explicitly through a QR code or short confirmation code.
- Give every device its own cryptographic identity stored in platform secure
  storage.
- Encrypt sync traffic end-to-end between paired devices.
- Let the owner view, rename, revoke, and re-pair trusted devices.
- Never make a device discoverable or accept an incoming jot without an
  explicit pairing decision.

## Reliability contract

The originating device remains the source of truth until the receiving device
has durably stored and acknowledged a transfer.

- Every jot and attachment gets a stable transfer ID.
- Outgoing transfers persist in a local queue and retry safely.
- Incoming transfers are idempotent: retrying cannot create duplicate jots.
- Text and metadata transfer as small encrypted events; audio, photos, and
  video transfer as resumable files.
- Failed, offline, or interrupted transfers stay recoverable rather than being
  deleted.
- Capture drafts remain local recovery records and are never discarded merely
  because a sync attempt began.

## Transport choices

### Apple Watch to iPhone

Use Apple's WatchConnectivity framework. Immediate messages are useful while
the phone is reachable; background user-info/file transfers queue when it is
not. No Jotful account is needed because the Watch and iPhone are already a
paired Apple-device relationship.

### iPhone to nearby computer

Use LAN discovery (for example Bonjour) only to find candidate devices. The
actual connection should be authenticated with the keys established during
pairing, rather than trusting a device merely because it is on the same Wi-Fi.
Mobile operating-system background limits mean reliable LAN sync should be
designed around a foreground app and a persistent retry queue; it must not
promise instant delivery while both apps are asleep.

## Explicit non-goals for the MVP

- No phone-to-computer/device sync implementation yet.
- No accounts, cloud relay, email forwarding, Google integration, or shared
  multi-user workspaces.
- No automatic nearby-device pairing.
- No removal of local media after an attempted transfer.

## Eventual delivery order

1. Watch capture and Watch-to-phone durability.
2. A desktop Jotful companion and a local read-only inbox.
3. Explicit trusted-device pairing.
4. Encrypted LAN sync for text, then attachments.
5. Optional remote sync only if it adds clear value beyond local pairing.
