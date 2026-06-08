import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.DB_PATH ?? './data/leaderboard.db';

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    trophies INTEGER NOT NULL,
    mode TEXT NOT NULL,
    formation TEXT,
    seed INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    ip_hash TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_scores_mode_score ON scores(mode, score DESC, created_at ASC);
  CREATE INDEX IF NOT EXISTS idx_scores_created ON scores(created_at);
`);

// Add squad column if it doesn't exist yet (safe migration)
try {
  db.exec(`ALTER TABLE scores ADD COLUMN squad TEXT`);
} catch {
  // Column already exists
}

export type ScoreRow = {
  id: number;
  run_id: string;
  name: string;
  score: number;
  trophies: number;
  mode: string;
  formation: string | null;
  seed: number;
  squad: string | null;
  created_at: number;
};

export const insertScore = db.prepare(`
  INSERT INTO scores (run_id, name, score, trophies, mode, formation, seed, squad, created_at, ip_hash)
  VALUES (@run_id, @name, @score, @trophies, @mode, @formation, @seed, @squad, @created_at, @ip_hash)
`);

export const topScores = db.prepare(`
  SELECT id, run_id, name, score, trophies, mode, formation, seed, squad, created_at
  FROM scores
  WHERE mode = @mode
  ORDER BY score DESC, created_at ASC
  LIMIT @limit
`);

export const findByRunId = db.prepare(`SELECT id FROM scores WHERE run_id = ?`);
