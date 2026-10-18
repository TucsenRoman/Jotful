import * as SQLite from 'expo-sqlite';
import { Paths } from 'expo-file-system';
import type { ThoughtKind } from './segmentation';

export type Thought = {
  id: number;
  text: string;
  richText: string | null;
  kind: ThoughtKind;
  createdAt: number;
  draftedAt: number | null;
  resolvedAt: number | null;
  pinnedAt: number | null;
  attachmentCount: number;
  attachmentKind: AttachmentKind | null;
  attachmentUri: string | null;
  attachmentDurationMillis: number | null;
  tags: Tag[];
};

export type AttachmentKind = 'image' | 'video' | 'audio';

export type TagColor = 'idea' | 'question' | 'movie' | 'music' | 'book' | 'place' | 'person' | 'todo';
export type Tag = { id: number; name: string; color: TagColor };
export type Attachment = { id: number; kind: AttachmentKind; uri: string; durationMillis: number | null };
export type ThoughtFilter = { tagIds?: number[]; showResolved?: boolean };

const db = SQLite.openDatabaseSync('unsorted.db');

export function initializeDatabase() {
  db.execSync(`CREATE TABLE IF NOT EXISTS thoughts (
    id INTEGER PRIMARY KEY NOT NULL,
    text TEXT NOT NULL,
    kind TEXT NOT NULL,
    collection TEXT,
    createdAt INTEGER NOT NULL,
    resolvedAt INTEGER
  );`);
  try {
    db.execSync('ALTER TABLE thoughts ADD COLUMN resolvedAt INTEGER;');
  } catch {
    // Existing installs already have this column.
  }
  try {
    db.execSync('ALTER TABLE thoughts ADD COLUMN pinnedAt INTEGER;');
  } catch {
    // Existing installs already have this column.
  }
  try {
    db.execSync('ALTER TABLE thoughts ADD COLUMN draftedAt INTEGER;');
  } catch {
    // Existing installs already have this column.
  }
  try {
    db.execSync('ALTER TABLE thoughts ADD COLUMN richText TEXT;');
  } catch {
    // Existing installs already have this column.
  }
  db.execSync(`CREATE TABLE IF NOT EXISTS preferences (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );`);
  db.execSync(`CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY NOT NULL,
    thoughtId INTEGER NOT NULL,
    kind TEXT NOT NULL,
    uri TEXT NOT NULL,
    durationMillis INTEGER,
    createdAt INTEGER NOT NULL
  );`);
  db.execSync(`CREATE TABLE IF NOT EXISTS captureDrafts (
    id INTEGER PRIMARY KEY NOT NULL,
    text TEXT NOT NULL,
    attachments TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );`);
  // One row per Watch capture id, so a retried transfer never saves twice.
  db.execSync(`CREATE TABLE IF NOT EXISTS watchCaptures (
    id TEXT PRIMARY KEY NOT NULL,
    receivedAt INTEGER NOT NULL
  );`);
  // Earlier builds left attachment rows behind when their thought was deleted.
  db.execSync('DELETE FROM attachments WHERE thoughtId NOT IN (SELECT id FROM thoughts);');
  // Tags (reskin, Oct 2026): colour means tag, one colour per tag (BRAND.md).
  db.execSync(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL UNIQUE,
    position INTEGER NOT NULL,
    createdAt INTEGER NOT NULL
  );`);
  db.execSync(`CREATE TABLE IF NOT EXISTS thoughtTags (
    thoughtId INTEGER NOT NULL,
    tagId INTEGER NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (thoughtId, tagId)
  );`);
  db.execSync('DELETE FROM thoughtTags WHERE thoughtId NOT IN (SELECT id FROM thoughts) OR tagId NOT IN (SELECT id FROM tags);');
  seedTags();
}

// The starter tags. `color` is a key into src/theme/tokens.js `tag`.
const DEFAULT_TAGS: Array<[string, TagColor]> = [
  ['Idea', 'idea'], ['Question', 'question'], ['Movie', 'movie'], ['Music', 'music'],
  ['Book', 'book'], ['Place', 'place'], ['Person', 'person'], ['To-do', 'todo'],
];

function seedTags() {
  if (db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM tags')?.n) return;
  const now = Date.now();
  db.withTransactionSync(() => {
    DEFAULT_TAGS.forEach(([name, color], position) => db.runSync('INSERT INTO tags (name, color, position, createdAt) VALUES (?, ?, ?, ?)', name, color, position, now));
    // Existing thoughts keep the meaning they already showed: the old Idea and
    // Question kinds become those tags; plain thoughts stay untagged.
    for (const [kind, name] of [['idea', 'Idea'], ['question', 'Question']] as const) {
      db.runSync('INSERT OR IGNORE INTO thoughtTags (thoughtId, tagId, position) SELECT thoughts.id, tags.id, 0 FROM thoughts, tags WHERE thoughts.kind = ? AND tags.name = ?', kind, name);
    }
  });
}

// Capture components can mount before the app's startup effect fires. Create
// migrations at module load so their synchronous draft checkpoints are safe.
initializeDatabase();

type StoredThought = Omit<Thought, 'kind' | 'tags'> & { kind: ThoughtKind | 'task'; collection?: string | null };

// iOS moves the app's container on every update, so a saved absolute
// Documents path goes stale. Re-anchor it to the current Documents folder.
function resolveStoredUri(uri: string | null) {
  const marker = '/Documents/';
  const index = uri?.indexOf(marker) ?? -1;
  if (!uri || index < 0) return uri;
  return Paths.document.uri.replace(/\/?$/, '/') + uri.slice(index + marker.length);
}

function fromStored({ kind, attachmentUri, ...thought }: StoredThought, tags: Tag[] = []): Thought {
  return { ...thought, kind: kind === 'task' ? 'thought' : kind, attachmentUri: resolveStoredUri(attachmentUri), tags };
}

const THOUGHT_COLUMNS = 'id, text, richText, kind, collection, createdAt, draftedAt, resolvedAt, pinnedAt, (SELECT COUNT(*) FROM attachments WHERE thoughtId = thoughts.id) AS attachmentCount, (SELECT kind FROM attachments WHERE thoughtId = thoughts.id ORDER BY id DESC LIMIT 1) AS attachmentKind, (SELECT uri FROM attachments WHERE thoughtId = thoughts.id ORDER BY id DESC LIMIT 1) AS attachmentUri, (SELECT durationMillis FROM attachments WHERE thoughtId = thoughts.id ORDER BY id DESC LIMIT 1) AS attachmentDurationMillis';

// Attaches each thought's tags (in their order) with one query.
function withTags(rows: StoredThought[]): Thought[] {
  if (rows.length === 0) return [];
  const links = db.getAllSync<Tag & { thoughtId: number }>(
    `SELECT thoughtTags.thoughtId, tags.id, tags.name, tags.color FROM thoughtTags JOIN tags ON tags.id = thoughtTags.tagId WHERE thoughtTags.thoughtId IN (${rows.map(() => '?').join(',')}) ORDER BY thoughtTags.position`,
    ...rows.map((row) => row.id),
  );
  const byThought = new Map<number, Tag[]>();
  links.forEach(({ thoughtId, ...tag }) => byThought.set(thoughtId, [...(byThought.get(thoughtId) ?? []), tag]));
  return rows.map((row) => fromStored(row, byThought.get(row.id)));
}

// Today's list keeps resolved thoughts (showResolved defaults to true). The
// reskin's home passes `{ showResolved: false }` and a tag filter; a thought
// matches when it has any of the chosen tags.
export function listThoughts(search = '', filter: ThoughtFilter = {}): Thought[] {
  const { tagIds = [], showResolved = true } = filter;
  const where = ['text LIKE ?'];
  const params: Array<string | number> = [`%${search}%`];
  if (!showResolved) where.push('resolvedAt IS NULL');
  if (tagIds.length) {
    where.push(`id IN (SELECT thoughtId FROM thoughtTags WHERE tagId IN (${tagIds.map(() => '?').join(',')}))`);
    params.push(...tagIds);
  }
  return withTags(db.getAllSync<StoredThought>(
    `SELECT ${THOUGHT_COLUMNS} FROM thoughts WHERE ${where.join(' AND ')} ORDER BY CASE WHEN resolvedAt IS NULL THEN 0 ELSE 1 END, pinnedAt DESC, createdAt DESC`,
    ...params,
  ));
}

export function listRecentThoughts(limit = 5): Thought[] {
  return withTags(db.getAllSync<StoredThought>(`SELECT ${THOUGHT_COLUMNS} FROM thoughts ORDER BY createdAt DESC LIMIT ?`, limit));
}

export function listAttachments(thoughtId: number): Attachment[] {
  return db.getAllSync<Attachment>('SELECT id, kind, uri, durationMillis FROM attachments WHERE thoughtId = ? ORDER BY id', thoughtId)
    .map((attachment) => ({ ...attachment, uri: resolveStoredUri(attachment.uri) ?? attachment.uri }));
}

export function listTags(): Tag[] {
  return db.getAllSync<Tag>('SELECT id, name, color FROM tags ORDER BY position');
}

// One colour per tag: the colour column is unique, so a taken colour throws.
export function createTag(name: string, color: TagColor): Tag {
  const position = (db.getFirstSync<{ n: number }>('SELECT COALESCE(MAX(position), -1) + 1 AS n FROM tags')?.n) ?? 0;
  const result = db.runSync('INSERT INTO tags (name, color, position, createdAt) VALUES (?, ?, ?, ?)', name.trim(), color, position, Date.now());
  return { id: Number(result.lastInsertRowId), name: name.trim(), color };
}

export function setThoughtTags(thoughtId: number, tagIds: number[]) {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM thoughtTags WHERE thoughtId = ?', thoughtId);
    tagIds.forEach((tagId, position) => db.runSync('INSERT OR IGNORE INTO thoughtTags (thoughtId, tagId, position) VALUES (?, ?, ?)', thoughtId, tagId, position));
  });
}

// The suggested tag for a new thought, from the same rules that set its kind.
function suggestedTagId(kind: ThoughtKind) {
  const name = kind === 'idea' ? 'Idea' : kind === 'question' ? 'Question' : null;
  return name ? db.getFirstSync<{ id: number }>('SELECT id FROM tags WHERE name = ?', name)?.id ?? null : null;
}

export function createThought(text: string, kind: ThoughtKind, richText?: string, tagIds?: number[]) {
  const result = db.runSync('INSERT INTO thoughts (text, richText, kind, createdAt) VALUES (?, ?, ?, ?)', text, richText ?? null, kind, Date.now());
  const id = Number(result.lastInsertRowId);
  const suggested = suggestedTagId(kind);
  const tags = tagIds ?? (suggested ? [suggested] : []);
  if (tags.length) setThoughtTags(id, tags);
  return id;
}

// Stores a Watch capture once per id. Returns false when it was already saved.
export function saveWatchCapture(id: string, thoughts: Array<{ text: string; kind: ThoughtKind }>, createdAt: number) {
  let saved = false;
  db.withTransactionSync(() => {
    if (db.getFirstSync('SELECT id FROM watchCaptures WHERE id = ?', id)) return;
    thoughts.forEach(({ text, kind }) => db.runSync('INSERT INTO thoughts (text, kind, createdAt) VALUES (?, ?, ?)', text, kind, createdAt));
    db.runSync('INSERT INTO watchCaptures (id, receivedAt) VALUES (?, ?)', id, Date.now());
    saved = true;
  });
  return saved;
}

export function updateThought(id: number, text: string, kind: ThoughtKind, richText?: string) {
  db.runSync('UPDATE thoughts SET text = ?, richText = ?, kind = ? WHERE id = ?', text, richText ?? null, kind, id);
}

export function createAttachmentThought(kind: AttachmentKind, uri: string, durationMillis?: number, caption?: string) {
  createAttachmentThoughts([{ kind, uri, durationMillis }], caption);
}

export function createAttachmentThoughts(attachments: Array<{ kind: AttachmentKind; uri: string; durationMillis?: number }>, caption?: string) {
  if (attachments.length === 0) return;
  const first = attachments[0];
  const label = caption || (attachments.length > 1 ? attachments.length + ' photos' : first.kind === 'image' ? 'Photo' : first.kind === 'video' ? 'Video' : 'Audio recording');
  const result = db.runSync('INSERT INTO thoughts (text, kind, createdAt) VALUES (?, ?, ?)', label, 'thought', Date.now());
  attachments.forEach((attachment) => db.runSync('INSERT INTO attachments (thoughtId, kind, uri, durationMillis, createdAt) VALUES (?, ?, ?, ?, ?)', Number(result.lastInsertRowId), attachment.kind, attachment.uri, attachment.durationMillis ?? null, Date.now()));
}

type DraftAttachment = {
  kind: AttachmentKind;
  uri: string;
  durationMillis?: number;
};

// Every in-progress capture is journaled: plain text, selected media, and raw
// audio alike. This is deliberately a single composer draft, matching the UI.
export function saveCaptureDraft(text: string, attachments: DraftAttachment[]) {
  if (!text.trim() && attachments.length === 0) {
    db.execSync('DELETE FROM captureDrafts;');
    return;
  }
  db.runSync(
    'INSERT OR REPLACE INTO captureDrafts (id, text, attachments, createdAt) VALUES (1, ?, ?, ?)',
    text,
    JSON.stringify(attachments),
    Date.now(),
  );
}

export function clearCaptureDraft() {
  db.execSync('DELETE FROM captureDrafts;');
}

export function recoverCaptureDraft() {
  const draft = db.getFirstSync<{
    text: string;
    attachments: string;
    createdAt: number;
  }>('SELECT text, attachments, createdAt FROM captureDrafts WHERE id = 1');
  if (!draft) return false;
  let attachments: DraftAttachment[] = [];
  try {
    attachments = JSON.parse(draft.attachments) as DraftAttachment[];
  } catch {
    // A malformed journal must not prevent the rest of the inbox from loading.
  }
  if (attachments.length || draft.text.trim()) {
    const label = draft.text.trim() || (attachments[0]?.kind === 'audio' ? 'Audio recording' : attachments[0]?.kind === 'video' ? 'Video' : 'Photo');
    const result = db.runSync(
      'INSERT INTO thoughts (text, kind, createdAt, draftedAt) VALUES (?, ?, ?, ?)',
      label,
      'thought',
      draft.createdAt,
      Date.now(),
    );
    attachments.forEach((attachment) => db.runSync(
      'INSERT INTO attachments (thoughtId, kind, uri, durationMillis, createdAt) VALUES (?, ?, ?, ?, ?)',
      Number(result.lastInsertRowId), attachment.kind, attachment.uri, attachment.durationMillis ?? null, draft.createdAt,
    ));
  }
  clearCaptureDraft();
  return true;
}

export function deleteThought(id: number) {
  db.runSync('DELETE FROM attachments WHERE thoughtId = ?', id);
  db.runSync('DELETE FROM thoughtTags WHERE thoughtId = ?', id);
  db.runSync('DELETE FROM thoughts WHERE id = ?', id);
}

export function toggleResolved(id: number, resolvedAt: number | null) {
  db.runSync('UPDATE thoughts SET resolvedAt = ? WHERE id = ?', resolvedAt, id);
}

// Dev app only (Settings > Developer). Sample thoughts carry collection = 'sample'
// so removing them never touches the person's own. Photos and video are remote
// Unsplash URLs (design/README.md credits) so no media ships in the app bundle.
const SAMPLE = 'sample';
const UNSPLASH = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=80&fm=jpg`;
type Sample = { text: string; daysAgo: number; tags: string[]; resolved?: boolean; pinned?: boolean; media?: Array<{ kind: AttachmentKind; uri: string; durationMillis?: number }> };
const SAMPLE_THOUGHTS: Sample[] = [
  { text: 'Birthday gift for Mom: the pottery class she keeps mentioning', daysAgo: 0, tags: ['Idea'], pinned: true },
  { text: 'Why do I always remember the dream right after I stop thinking about it?', daysAgo: 1, tags: ['Question'] },
  { text: 'Past Lives\nSara said watch it on a plane, not at home', daysAgo: 9, tags: ['Movie'] },
  { text: 'Perfect Days\nThe quiet one with the toilet cleaner.', daysAgo: 5, tags: ['Movie'] },
  { text: 'Melody idea in the car — the bit after the chorus', daysAgo: 18, tags: ['Music'] },
  { text: 'Song from the café\nAsk what was playing around 3pm', daysAgo: 22, tags: ['Music'] },
  { text: 'That bakery sign on 5th — steal the lettering', daysAgo: 40, tags: ['Place'], media: [{ kind: 'image', uri: UNSPLASH('photo-1541663038764-58fefe6f66b8') }, { kind: 'image', uri: UNSPLASH('photo-1554428350-f46d65e299bb') }] },
  { text: 'The Overstory\nFinish before the trip.', daysAgo: 27, tags: ['Book'] },
  { text: 'Shelf for the hallway\nMeasure the gap by the door first', daysAgo: 14, tags: ['Idea'] },
  { text: 'Ask Dev about the camera he used for the wedding', daysAgo: 49, tags: ['Person', 'Idea'], media: [{ kind: 'image', uri: UNSPLASH('photo-1510127034890-ba27508e9f1c') }] },
  { text: '# Weekend\n• farmers market\n• fix bike tire\n• finish the book', daysAgo: 2, tags: ['To-do'], media: [{ kind: 'image', uri: UNSPLASH('photo-1485637701894-09ad422f6de6') }] },
  { text: 'Call the dentist back', daysAgo: 76, tags: [], resolved: true },
  { text: 'Return the library books', daysAgo: 33, tags: ['To-do'], resolved: true },
  { text: 'Pottery wheel night is Thursday. Ask if the beginner set is included.', daysAgo: 4, tags: ['Place'], media: [{ kind: 'image', uri: UNSPLASH('photo-1590605095243-072811dbe64c') }] },
  { text: 'Cinema near the station has the 35mm print this week', daysAgo: 11, tags: ['Movie', 'Place'], media: [{ kind: 'image', uri: UNSPLASH('photo-1517604931442-7e0c8ed2963c') }] },
  { text: 'What makes a croissant stay crisp the next day?', daysAgo: 61, tags: ['Question'] },
  { text: 'Before the trip: passport photos, charger, the good notebook', daysAgo: 7, tags: ['To-do'] },
];

export function addSampleThoughts() {
  const tagId = new Map(listTags().map((tag) => [tag.name, tag.id]));
  const day = 86400000;
  db.withTransactionSync(() => {
    SAMPLE_THOUGHTS.forEach((sample, index) => {
      const createdAt = Date.now() - sample.daysAgo * day - index * 37 * 60000;
      const kind = sample.tags.includes('Question') ? 'question' : sample.tags.includes('Idea') ? 'idea' : 'thought';
      const result = db.runSync('INSERT INTO thoughts (text, kind, collection, createdAt, resolvedAt, pinnedAt) VALUES (?, ?, ?, ?, ?, ?)', sample.text, kind, SAMPLE, createdAt, sample.resolved ? createdAt + day : null, sample.pinned ? createdAt : null);
      const id = Number(result.lastInsertRowId);
      sample.tags.forEach((name, position) => { const tag = tagId.get(name); if (tag) db.runSync('INSERT OR IGNORE INTO thoughtTags (thoughtId, tagId, position) VALUES (?, ?, ?)', id, tag, position); });
      sample.media?.forEach((media) => db.runSync('INSERT INTO attachments (thoughtId, kind, uri, durationMillis, createdAt) VALUES (?, ?, ?, ?, ?)', id, media.kind, media.uri, media.durationMillis ?? null, createdAt));
    });
  });
}

export function removeSampleThoughts() {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM attachments WHERE thoughtId IN (SELECT id FROM thoughts WHERE collection = ?)', SAMPLE);
    db.runSync('DELETE FROM thoughtTags WHERE thoughtId IN (SELECT id FROM thoughts WHERE collection = ?)', SAMPLE);
    db.runSync('DELETE FROM thoughts WHERE collection = ?', SAMPLE);
  });
}

export function setThoughtCreatedAt(id: number, createdAt: number) {
  db.runSync('UPDATE thoughts SET createdAt = ? WHERE id = ?', createdAt, id);
}

export function togglePinned(id: number, pinnedAt: number | null) {
  db.runSync('UPDATE thoughts SET pinnedAt = ? WHERE id = ?', pinnedAt, id);
}

export function getPreference(key: string, fallback: string) {
  return db.getFirstSync<{ value: string }>('SELECT value FROM preferences WHERE key = ?', key)?.value ?? fallback;
}

export function setPreference(key: string, value: string) {
  db.runSync('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)', key, value);
}
