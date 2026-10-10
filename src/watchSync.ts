import { Platform, TurboModuleRegistry } from 'react-native';
import { classifyThought, splitThoughts } from './segmentation';
import { saveWatchCapture } from './storage';
import { isWatchCapture, WATCH_ACK_TYPE } from './watchCaptureProtocol';

type Facade = typeof import('@appsent-co/react-native-watchos/watch-connectivity').WatchConnectivity;

// Phone-only builds may ship without the WatchConnectivity module. The facade
// throws on import when it is missing, so load it only after checking.
function loadWatchConnectivity(): Facade | null {
  if (Platform.OS !== 'ios' || !TurboModuleRegistry.get('WatchConnectivity')) return null;
  try {
    return require('@appsent-co/react-native-watchos/watch-connectivity').WatchConnectivity as Facade;
  } catch {
    return null;
  }
}

// Saves each Watch capture once, then confirms it back to the Watch. The
// confirmation is sent even for a repeat, so a Watch that missed the first one
// stops waiting.
export function startWatchSync(onSaved: () => void) {
  const watch = loadWatchConnectivity();
  if (!watch) return () => {};

  function receive(payload: unknown) {
    if (!isWatchCapture(payload)) return;
    const thoughts = splitThoughts(payload.text).map((text) => ({ text, kind: classifyThought(text) }));
    if (thoughts.length && saveWatchCapture(payload.id, thoughts, payload.createdAt)) onSaved();
    void watch!.transferUserInfo({ type: WATCH_ACK_TYPE, id: payload.id }).catch(() => undefined);
  }

  // Listen before activating: queued transfers arrive as soon as the session
  // activates, and events sent with no listener are dropped.
  const subscription = watch.on('userInfo', receive);
  void watch.activate().catch(() => undefined);
  return () => subscription.remove();
}
