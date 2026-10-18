// Shared helpers for the thought detail screen (design/mocks/r8/detail).
import type { Attachment, Thought } from '../../storage';

const tokens = require('../../theme/tokens');

export const T = tokens as {
  primitive: Record<string, string>;
  tag: Record<string, string>;
  tagOn: Record<string, string>;
  color: Record<string, string>;
  space: Record<string, number>;
  size: Record<string, number>;
  radius: Record<string, number>;
};

/** '#RRGGBB' + alpha -> 'rgba(...)', so translucent fills still come from tokens. */
export function alpha(hex: string, a: number) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
}

// Stand-in labels the app writes when a thought has no real text. They count as no text.
const STANDIN = /^(photo|\d+ photos|video|\d+ videos|audio recording|voice note|attachment|\d+ attachments)$/i;

export function realText(text: string | null | undefined) {
  const t = (text ?? '').trim();
  return t && !STANDIN.test(t) ? t : '';
}

export function hasRichText(html: string | null | undefined) {
  if (!html) return false;
  const plain = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return realText(plain) !== '';
}

export function mmss(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function formatTime(ms: number) {
  const d = new Date(ms);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

function monthDay(d: Date, now: Date) {
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base}, ${d.getFullYear()}`;
}

/** "Today" / "Yesterday" / "Oct 11" (adds the year when it isn't this year). */
export function relativeDay(ms: number, now = new Date()) {
  const d = new Date(ms);
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return monthDay(d, now);
}

/** "Today · Oct 18 · 9:12 AM" or "Saturday · Oct 11 · 2:05 PM". */
export function fullDate(ms: number, now = new Date()) {
  const d = new Date(ms);
  const day = startOfDay(now) === startOfDay(d) ? 'Today' : DAYS[d.getDay()];
  return `${day} · ${monthDay(d, now)} · ${formatTime(ms)}`;
}

/** The thought's attachments; falls back to its single legacy attachment fields. */
export function resolveAttachments(thought: Thought, attachments: Attachment[]): Attachment[] {
  if (attachments.length) return attachments;
  if (thought.attachmentKind && thought.attachmentUri)
    return [{ id: -1, kind: thought.attachmentKind, uri: thought.attachmentUri, durationMillis: thought.attachmentDurationMillis }];
  return [];
}

const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? 's' : ''}`;

/** "1 photo · 1 recording" */
export function attachmentSummary(list: Attachment[]) {
  const n = (k: Attachment['kind']) => list.filter((a) => a.kind === k).length;
  const parts: string[] = [];
  if (n('image')) parts.push(plural(n('image'), 'photo'));
  if (n('video')) parts.push(plural(n('video'), 'video'));
  if (n('audio')) parts.push(plural(n('audio'), 'recording'));
  return parts.join(' · ');
}

// Static waveform shape from the mock (no real waveform data is stored).
export const BARS = [22, 40, 62, 38, 80, 100, 62, 30, 54, 80, 44, 26, 66, 92, 58, 34, 72, 50, 24, 40, 76, 96, 60, 36, 52, 28, 68, 46, 20, 32, 58, 74, 48, 30, 64, 86, 52, 28, 44, 70];

export const SHADOW_SOFT = {
  shadowColor: T.primitive.ink,
  shadowOpacity: 0.08,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
};

export const SHADOW_GLASS = {
  shadowColor: T.primitive.ink,
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
};
