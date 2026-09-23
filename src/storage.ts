import * as SQLite from 'expo-sqlite';
import type { ThoughtKind } from './segmentation';

export type Thought = {
  id: number;
  text: string;
  kind: ThoughtKind;
  createdAt: number;
  resolvedAt: number | null;
};

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
}

type StoredThought = Omit<Thought, 'kind'> & { kind: ThoughtKind | 'task'; collection?: string | null };

export function listThoughts(search = ''): Thought[] {
  const filter = `%${search}%`;
  return db.getAllSync<StoredThought>(
    'SELECT id, text, kind, collection, createdAt, resolvedAt FROM thoughts WHERE text LIKE ? ORDER BY CASE WHEN resolvedAt IS NULL THEN 0 ELSE 1 END, createdAt DESC',
    filter
  ).map(({ kind, ...thought }) => ({ ...thought, kind: kind === 'task' ? 'thought' : kind }));
}

export function listRecentThoughts(limit = 5): Thought[] {
  return db.getAllSync<StoredThought>(
    'SELECT id, text, kind, collection, createdAt, resolvedAt FROM thoughts ORDER BY createdAt DESC LIMIT ?',
    limit
  ).map(({ kind, ...thought }) => ({ ...thought, kind: kind === 'task' ? 'thought' : kind }));
}

export function createThought(text: string, kind: ThoughtKind) {
  db.runSync('INSERT INTO thoughts (text, kind, createdAt) VALUES (?, ?, ?)', text, kind, Date.now());
}

export function deleteThought(id: number) {
  db.runSync('DELETE FROM thoughts WHERE id = ?', id);
}

export function toggleResolved(id: number, resolvedAt: number | null) {
  db.runSync('UPDATE thoughts SET resolvedAt = ? WHERE id = ?', resolvedAt, id);
}
