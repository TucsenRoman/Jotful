import * as SQLite from 'expo-sqlite';
import type { ThoughtKind } from './segmentation';

export type Thought = {
  id: number;
  text: string;
  kind: ThoughtKind;
  createdAt: number;
  resolvedAt: number | null;
  pinnedAt: number | null;
  attachmentCount: number;
  attachmentKind: AttachmentKind | null;
  attachmentUri: string | null;
  attachmentDurationMillis: number | null;
};

export type AttachmentKind = 'image' | 'video' | 'audio';

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
}

type StoredThought = Omit<Thought, 'kind'> & { kind: ThoughtKind | 'task'; collection?: string | null };

export function listThoughts(search = ''): Thought[] {
  const filter = `%${search}%`;
  return db.getAllSync<StoredThought>(
    'SELECT id, text, kind, collection, createdAt, resolvedAt, pinnedAt, (SELECT COUNT(*) FROM attachments WHERE thoughtId = thoughts.id) AS attachmentCount, (SELECT kind FROM attachments WHERE thoughtId = thoughts.id ORDER BY id DESC LIMIT 1) AS attachmentKind, (SELECT uri FROM attachments WHERE thoughtId = thoughts.id ORDER BY id DESC LIMIT 1) AS attachmentUri, (SELECT durationMillis FROM attachments WHERE thoughtId = thoughts.id ORDER BY id DESC LIMIT 1) AS attachmentDurationMillis FROM thoughts WHERE text LIKE ? ORDER BY CASE WHEN resolvedAt IS NULL THEN 0 ELSE 1 END, pinnedAt DESC, createdAt DESC',
    filter
  ).map(({ kind, ...thought }) => ({ ...thought, kind: kind === 'task' ? 'thought' : kind }));
}

export function listRecentThoughts(limit = 5): Thought[] {
  return db.getAllSync<StoredThought>(
    'SELECT id, text, kind, collection, createdAt, resolvedAt, pinnedAt, (SELECT COUNT(*) FROM attachments WHERE thoughtId = thoughts.id) AS attachmentCount, (SELECT kind FROM attachments WHERE thoughtId = thoughts.id ORDER BY id DESC LIMIT 1) AS attachmentKind, (SELECT uri FROM attachments WHERE thoughtId = thoughts.id ORDER BY id DESC LIMIT 1) AS attachmentUri, (SELECT durationMillis FROM attachments WHERE thoughtId = thoughts.id ORDER BY id DESC LIMIT 1) AS attachmentDurationMillis FROM thoughts ORDER BY createdAt DESC LIMIT ?',
    limit
  ).map(({ kind, ...thought }) => ({ ...thought, kind: kind === 'task' ? 'thought' : kind }));
}

export function createThought(text: string, kind: ThoughtKind) {
  db.runSync('INSERT INTO thoughts (text, kind, createdAt) VALUES (?, ?, ?)', text, kind, Date.now());
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

export function deleteThought(id: number) {
  db.runSync('DELETE FROM thoughts WHERE id = ?', id);
}

export function toggleResolved(id: number, resolvedAt: number | null) {
  db.runSync('UPDATE thoughts SET resolvedAt = ? WHERE id = ?', resolvedAt, id);
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
