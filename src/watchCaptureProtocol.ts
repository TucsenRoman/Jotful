export const WATCH_CAPTURE_TYPE = 'jotful.capture.v1';

export type WatchCapture = {
  type: typeof WATCH_CAPTURE_TYPE;
  id: string;
  text: string;
  createdAt: number;
  source: 'watch';
};

// The phone must store a received capture by `id` before acknowledging it.
// This makes queued WatchConnectivity retries safe and prevents duplicates.
export function isWatchCapture(value: unknown): value is WatchCapture {
  if (!value || typeof value !== 'object') return false;
  const capture = value as Record<string, unknown>;
  return capture.type === WATCH_CAPTURE_TYPE
    && typeof capture.id === 'string'
    && typeof capture.text === 'string'
    && typeof capture.createdAt === 'number'
    && capture.source === 'watch';
}
