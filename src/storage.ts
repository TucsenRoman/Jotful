import * as SQLite from 'expo-sqlite';
import type { ThoughtKind } from './segmentation';

export type Thought = {
  id: number;
  text: string;
  kind: ThoughtKind;
  collection: string | null;
  createdAt: number;
};

const db = SQLite.openDatabaseSync('unsorted.db');

export function initializeDatabase() {
  db.execSync(`CREATE TABLE IF NOT EXISTS thoughts (
    id INTEGER PRIMARY KEY NOT NULL,
    text TEXT NOT NULL,
    kind TEXT NOT NULL,
    collection TEXT,
    createdAt INTEGER NOT NULL
  );`);
}

export function listThoughts(search = ''): Thought[] {
  const filter = `%${search}%`;
  return db.getAllSync<Thought>(
    'SELECT id, text, kind, collection, createdAt FROM thoughts WHERE text LIKE ? ORDER BY createdAt DESC',
    filter
  );
}

export function createThought(text: string, kind: ThoughtKind) {
  db.runSync('INSERT INTO thoughts (text, kind, createdAt) VALUES (?, ?, ?)', text, kind, Date.now());
}

export function moveThought(id: number, collection: string, kind?: ThoughtKind) {
  if (kind) db.runSync('UPDATE thoughts SET collection = ?, kind = ? WHERE id = ?', collection, kind, id);
  else db.runSync('UPDATE thoughts SET collection = ? WHERE id = ?', collection, id);
}

export function deleteThought(id: number) {
  db.runSync('DELETE FROM thoughts WHERE id = ?', id);
}
