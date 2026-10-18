import { Directory, File, Paths } from "expo-file-system";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

/**
 * Copy a finished recorder file into durable app storage. Recorder URIs live in
 * iOS's cache and can disappear after a reload, and the next recording reuses it.
 */
export async function keepRecording(
  uri: string,
  folder: "recordings" | "discarded",
) {
  const source = new File(uri);
  const base = folder === "recordings" ? Paths.document : Paths.cache;
  const directory = new Directory(base, folder);
  directory.create({ idempotent: true, intermediates: true });
  const extension = source.extension || ".m4a";
  const destination = new File(
    directory,
    `recording-${Date.now()}${extension}`,
  );
  await source.copy(destination);
  return destination;
}

export function deleteQuietly(uri: string | null | undefined) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A leftover cache file is harmless; iOS clears the cache itself.
  }
}

/**
 * Live dictation runs through the app's `onToggleVoice`, which shows an alert
 * when on-device dictation is off. Check first so a hold never pops an alert;
 * the recording still works without a transcript.
 */
export function dictationAvailable() {
  try {
    return (
      ExpoSpeechRecognitionModule.isRecognitionAvailable() &&
      ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()
    );
  } catch {
    return false;
  }
}

/** The words dictation added on top of the draft that was there before. */
export function transcriptSince(draft: string, before: string) {
  const base = before.trim();
  const now = draft.trim();
  if (!base) return now;
  return now.startsWith(base) ? now.slice(base.length).trim() : now;
}

export function formatClock(millis: number) {
  const seconds = Math.max(0, Math.floor(millis / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
