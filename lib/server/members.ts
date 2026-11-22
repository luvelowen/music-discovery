import type { DatabaseSync } from 'node:sqlite';
import { parseProfile } from '../profile/parse.ts';
import { isComplete } from '../profile/validation.ts';
import { parseSocial } from '../social/parse.ts';
import type { Member } from '../social/policy.ts';
import type { Relation } from '../social/types.ts';

/*
 * A member is someone other people may meet: an adult with a confirmed email and a finished profile,
 * who isn't suspended. Photos are left out here, because they are big and almost never needed.
 */
export type LoadedMember = Member & { hasPhoto: boolean; version: number };

type Row = { id: string; updated_at: number; profile: string; photo_type: string | null; social: string };

const SELECT = `
  SELECT users.id, users.updated_at, users.social,
         json_remove(users.profile, '$.photo') AS profile,
         json_type(users.profile, '$.photo') AS photo_type
  FROM users JOIN email_checks ON email_checks.user_id = users.id
  WHERE users.adult = 1 AND NOT EXISTS (SELECT 1 FROM suspensions WHERE suspensions.user_id = users.id)`;

function toMember(row: Row): LoadedMember | null {
  const profile = parseProfile(row.profile);
  if (!isComplete(profile)) return null;
  return { id: row.id, profile, privacy: parseSocial(row.social).privacy, hasPhoto: row.photo_type === 'text', version: row.updated_at };
}

export function getMember(db: DatabaseSync, id: string) {
  const row = db.prepare(`${SELECT} AND users.id = ?`).get(id) as Row | undefined;
  return row ? toMember(row) : null;
}

/** The people who chose to be in Discover, without anyone blocked in either direction. */
export function getDiscoverable(db: DatabaseSync, me: string) {
  const rows = db.prepare(`${SELECT}
    AND users.id <> ?
    AND json_extract(users.social, '$.privacy.discoverable') = 1
    AND NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocks.blocker_id = ? AND blocks.blocked_id = users.id) OR (blocks.blocker_id = users.id AND blocks.blocked_id = ?)
    )`).all(me, me, me) as Row[];
  return rows.flatMap((row) => toMember(row) ?? []);
}

export function isBlocked(db: DatabaseSync, a: string, b: string) {
  return Boolean(db.prepare('SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)').get(a, b, b, a));
}

/**
 * Where two people stand, seen from `me`. A declined request still reads as sent to the person
 * who sent it, so declining is silent.
 */
export function relationBetween(db: DatabaseSync, me: string, them: string): Relation {
  const rows = db
    .prepare('SELECT from_id, state FROM requests WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)')
    .all(me, them, them, me) as { from_id: string; state: string }[];
  if (rows.some((row) => row.state === 'accepted')) return 'connected';
  if (rows.some((row) => row.from_id === them && row.state === 'pending')) return 'incoming';
  if (rows.some((row) => row.from_id === me && (row.state === 'pending' || row.state === 'declined'))) return 'outgoing';
  return 'none';
}
