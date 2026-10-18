import type { Thought } from '../../storage';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Labels the app stores when a thought has no real text of its own.
export function isStandInText(text: string) {
  return /^(Photo|Video|Audio recording|\d+ photos)$/.test(text.trim());
}

export function hasRealText(t: Thought) {
  return t.text.trim().length > 0 && !isStandInText(t.text);
}

export function titleOf(t: Thought) {
  if (!hasRealText(t)) {
    if (t.attachmentKind === 'audio') return 'Voice note';
    if (t.attachmentKind === 'video') return 'Video';
    if (t.attachmentKind === 'image') return t.attachmentCount > 1 ? `${t.attachmentCount} photos` : 'Photo';
    return t.text.trim() || 'Thought';
  }
  return t.text.trim().split('\n')[0].replace(/^#\s+/, '').trim();
}

export function bodyOf(t: Thought) {
  if (!hasRealText(t)) return '';
  return t.text.trim().split('\n').slice(1).join('\n').trim();
}

// Rich text minus its first block (that block is already the card's title).
export function richBodyOf(t: Thought) {
  if (!t.richText || !hasRealText(t)) return null;
  const rest = t.richText.replace(/^\s*<(p|h[1-6]|blockquote)\b[^>]*>[\s\S]*?<\/\1>/i, '').trim();
  const plain = rest.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  return plain ? rest : null;
}

function clock(d: Date) {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function dayStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function dayLabel(ms: number, now = new Date()) {
  const d = new Date(ms);
  const days = Math.round((dayStart(now) - dayStart(d)) / 86400000);
  if (days === 0) return `Today ${clock(d)}`;
  if (days === 1) return `Yesterday ${clock(d)}`;
  return shortDate(ms, now);
}

// "Sep 21", plus ", 2025" outside the current year (scrubber bubble, meta line).
export function shortDate(ms: number, now = new Date()) {
  const d = new Date(ms);
  return `${MON[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== now.getFullYear() ? `, ${d.getFullYear()}` : ''}`;
}

export function monthKey(ms: number) {
  const d = new Date(ms);
  return d.getFullYear() * 12 + d.getMonth();
}

function duration(ms: number | null) {
  const s = Math.max(0, Math.round((ms ?? 0) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function audioDuration(t: Thought) {
  return duration(t.attachmentDurationMillis);
}

export function metaLabel(t: Thought) {
  const parts: string[] = [];
  if (t.pinnedAt) parts.push('Pinned');
  parts.push(dayLabel(t.createdAt));
  if (t.attachmentKind === 'audio') parts.push(`Voice ${duration(t.attachmentDurationMillis)}`);
  else if (t.attachmentKind === 'image') parts.push(t.attachmentCount > 1 ? `${t.attachmentCount} photos` : 'Photo');
  else if (t.attachmentKind === 'video') parts.push('Video');
  if (t.resolvedAt) parts.push('Resolved');
  return parts.join(' · ');
}

export function moreLabel(index: number, count: number) {
  const left = count - 1 - index;
  return left > 0 ? `${left} more` : 'Last one';
}
