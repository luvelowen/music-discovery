import type { DatabaseSync } from 'node:sqlite';
import { inTransaction } from './db.ts';

/** For the person who runs the app, through `npm run moderate`. No web page can reach these. */
export type ReportRow = {
  id: string;
  reporter_id: string | null;
  reported_id: string;
  reported_name: string;
  reason: string;
  details: string;
  evidence: string | null;
  created_at: number;
  status: 'received' | 'closed';
};

const URGENT = "CASE reason WHEN 'danger' THEN 0 WHEN 'underage' THEN 1 ELSE 2 END";

export function openReports(db: DatabaseSync) {
  return db.prepare(`SELECT * FROM reports WHERE status = 'received' ORDER BY ${URGENT}, created_at`).all() as ReportRow[];
}

export function findReport(db: DatabaseSync, start: string) {
  if (start.length < 6 || !/^[\w-]+$/.test(start)) return null;
  const rows = db.prepare('SELECT * FROM reports WHERE substr(id, 1, ?) = ?').all(start.length, start) as ReportRow[];
  return rows.length === 1 ? rows[0]! : null;
}

export function closeReport(db: DatabaseSync, id: string) {
  // Attached messages are kept only as long as the report needs them.
  db.prepare("UPDATE reports SET status = 'closed', evidence = NULL WHERE id = ?").run(id);
}

export function suspend(db: DatabaseSync, userId: string, reason: string, now = Date.now()) {
  return inTransaction(db, () => {
    if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(userId)) return false;
    db.prepare('INSERT INTO suspensions VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING').run(userId, reason, now);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    return true;
  });
}

export function restore(db: DatabaseSync, userId: string) {
  return db.prepare('DELETE FROM suspensions WHERE user_id = ?').run(userId).changes > 0;
}

export function suspended(db: DatabaseSync) {
  return db.prepare('SELECT user_id, reason, at FROM suspensions ORDER BY at DESC').all() as { user_id: string; reason: string; at: number }[];
}
