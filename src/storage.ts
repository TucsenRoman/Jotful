import * as SQLite from 'expo-sqlite';
import type { ThoughtKind } from './segmentation';

export type Thought = {
  id: number;
  text: string;
  kind: ThoughtKind;
  collection: string | null;
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

export function listThoughts(search = '', workspace = 'All thoughts'): Thought[] {
  const filter = `%${search}%`;
  const workspaceFilter = workspace === 'All thoughts' ? '' : ' AND collection = ?';
  return db.getAllSync<Thought>(
    `SELECT id, text, kind, collection, createdAt, resolvedAt FROM thoughts WHERE text LIKE ?${workspaceFilter} ORDER BY CASE WHEN resolvedAt IS NULL THEN 0 ELSE 1 END, createdAt DESC`,
    ...(workspace === 'All thoughts' ? [filter] : [filter, workspace])
  );
}

export function createThought(text: string, kind: ThoughtKind, collection: string | null = null) {
  db.runSync('INSERT INTO thoughts (text, kind, collection, createdAt) VALUES (?, ?, ?, ?)', text, kind, collection, Date.now());
}

export function moveThought(id: number, collection: string, kind?: ThoughtKind) {
  if (kind) db.runSync('UPDATE thoughts SET collection = ?, kind = ? WHERE id = ?', collection, kind, id);
  else db.runSync('UPDATE thoughts SET collection = ? WHERE id = ?', collection, id);
}

export function deleteThought(id: number) {
  db.runSync('DELETE FROM thoughts WHERE id = ?', id);
}

export function toggleResolved(id: number, resolvedAt: number | null) {
  db.runSync('UPDATE thoughts SET resolvedAt = ? WHERE id = ?', resolvedAt, id);
}
