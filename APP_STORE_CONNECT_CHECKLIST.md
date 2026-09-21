# Unsorted v1 — App Store Connect checklist

This is the remaining owner-operated work before public submission. The app’s bundle identifier is already locked as `com.tucsenroman.unsorted`.

## Prepare outside the codebase

- [ ] Publish [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) at a public HTTPS URL and replace `[DATE]` and `[SUPPORT EMAIL]` with real values.
- [ ] Publish a support page at a public HTTPS URL that includes a working contact email. Apple requires the Support URL to lead to actual contact information.
- [ ] Run [MVP_TEST_AND_SCREENSHOT_SCRIPT.md](./MVP_TEST_AND_SCREENSHOT_SCRIPT.md) on the iPhone and retain the four anonymized screenshots.
- [ ] Commit the current icon, visual polish, voice capture, widget, and action changes after the on-device check passes.

## Create the app record in App Store Connect

1. Open **Apps** → **+** → **New App**.
2. Use **Unsorted**, primary language **English (U.S.)**, platform **iOS**, bundle ID `com.tucsenroman.unsorted`, SKU `unsorted-ios-001`, and full access.
3. Add the prepared metadata from [APP_STORE_LISTING.md](./APP_STORE_LISTING.md): Productivity primary category, subtitle, description, keywords, support URL, and privacy-policy URL.
4. Upload at least one (up to ten) device screenshots in the screenshot slots App Store Connect displays. Use the highest-size iPhone screenshots if the UI is identical across sizes.
5. In **App Privacy**, choose **No, we do not collect data from this app** for this v1 only after confirming Voice remains on-device. This remains accurate only while Unsorted keeps notes in local SQLite, does not retain or transmit voice, and sends a thought only through the user-initiated browser handoff.
6. Complete the age rating, content rights, and App Review contact fields truthfully. These are account-owner decisions.

## Build, TestFlight, and review

1. After the development build passes the script, create and upload the release build from Windows:

   ```powershell
   npx eas-cli@latest build --platform ios --profile production --auto-submit
   ```

2. Wait for Apple processing, then select the build in App Store Connect and distribute it to internal TestFlight testers.
3. When the metadata and screenshots are complete, attach that same build to version 1.0 and select **Submit for Review**.

## Do not change for v1 without revisiting privacy

- Do not add cloud transcription, camera, location, Face ID, remote notifications, accounts, analytics, cloud sync, or in-app AI. Voice input may remain only while it requires on-device recognition.
- When one of those features becomes a real feature, add its purpose string/config plugin only then and update the privacy policy and App Privacy answers before shipping it.
