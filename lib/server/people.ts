import type { DatabaseSync } from 'node:sqlite';
import type { GenreId } from '../music/genres.ts';
import { artistName } from '../music/artists.ts';
import type { DiscoverPage, MyReport, Overview, PeopleError, PeopleInput, Seen } from '../people/types.ts';
import { SEEKING, type Seeking } from '../profile/types.ts';
import { parseProfile } from '../profile/parse.ts';
import { compareMusic } from '../social/shared.ts';
import { canView, isInDiscover, requestProblem, seeMember } from '../social/policy.ts';
import { DAY, REPORT_REASONS, SOCIAL_LIMITS, type Relation } from '../social/types.ts';
import { inTransaction } from './db.ts';
import { getDiscoverable, getMember, isBlocked, relationBetween, type LoadedMember } from './members.ts';
import { evidenceFor } from './chat.ts';

/*
 * Everything between two people. Every function starts from who is signed in, and checks again.
 * A profile leaves this file only after seeMember has removed what the viewer may not have.
 */
const PAGE = { start: 30, max: 300 } as const;
const isId = (value: unknown): value is string => typeof value === 'string' && /^[\w-]{1,80}$/.test(value);

function sentToday(db: DatabaseSync, me: string, now: number) {
  const row = db.prepare('SELECT COUNT(*) AS count FROM request_log WHERE user_id = ? AND at > ?').get(me, now - DAY) as { count: number };
  return row.count;
}

function toSeen(me: LoadedMember, them: LoadedMember, relation: Relation, sent: number): Seen | null {
  const profile = seeMember(me, them, relation);
  if (!profile) return null;
  return {
    id: them.id,
    relation,
    problem: relation === 'none' ? requestProblem(me, them, relation, sent) : null,
    profile: { ...profile, photo: relation === 'connected' && them.hasPhoto ? `/api/photo/${them.id}?v=${them.version}` : null },
  };
}

export function getPerson(db: DatabaseSync, meId: string, themId: string, now = Date.now()): Seen | null {
  const me = getMember(db, meId);
  const them = getMember(db, themId);
  // Blocked, hidden, suspended and nonexistent all get the same answer.
  if (!me || !them || isBlocked(db, meId, themId)) return null;
  return toSeen(me, them, relationBetween(db, meId, themId), sentToday(db, meId, now));
}

export function getOverview(db: DatabaseSync, meId: string, now = Date.now()): Overview {
  const overview: Overview = { connected: [], incoming: [], outgoing: [], blocked: [], reports: [] };

  const blocked = db
    .prepare('SELECT blocks.blocked_id, blocks.username FROM blocks WHERE blocker_id = ? ORDER BY created_at DESC')
    .all(meId) as { blocked_id: string; username: string }[];
  overview.blocked = blocked.map((row) => ({ id: row.blocked_id, username: row.username }));
  overview.reports = (
    db.prepare('SELECT id, reported_name AS username, reason, created_at AS at, status FROM reports WHERE reporter_id = ? ORDER BY created_at DESC').all(meId) as MyReport[]
  ).map((row) => ({ ...row }));

  const me = getMember(db, meId);
  if (!me) return overview;
  const sent = sentToday(db, meId, now);
  const others = db
    .prepare(`SELECT other, MAX(at) AS at FROM (
        SELECT to_id AS other, updated_at AS at FROM requests WHERE from_id = ?
        UNION ALL
        SELECT from_id AS other, updated_at AS at FROM requests WHERE to_id = ?
      ) GROUP BY other ORDER BY at DESC`)
    .all(meId, meId) as { other: string }[];

  for (const { other } of others) {
    const relation = relationBetween(db, meId, other);
    if (relation === 'none' || isBlocked(db, meId, other)) continue;
    const them = getMember(db, other);
    const seen = them && toSeen(me, them, relation, sent);
    if (seen) overview[relation].push(seen);
  }
  return overview;
}

export type DiscoverQuery = { genre?: GenreId | null; seeking?: string | null; search?: string | null; limit?: number };

export function discover(db: DatabaseSync, meId: string, query: DiscoverQuery = {}, now = Date.now()): DiscoverPage {
  const me = getMember(db, meId);
  if (!me) return { people: [], total: 0, counts: {} };

  const sent = sentToday(db, meId, now);
  const wanted: Seeking | undefined = SEEKING.find((item) => item === query.seeking);
  const search = query.search?.normalize('NFC').trim().slice(0, 80).toLocaleLowerCase();
  const counts: Partial<Record<GenreId, number>> = {};
  const found: { seen: Seen; rank: number }[] = [];

  for (const them of getDiscoverable(db, meId)) {
    if (!isInDiscover(me, them)) continue;
    const seen = toSeen(me, them, relationBetween(db, meId, them.id), sent);
    if (!seen) continue;
    const { profile } = seen;
    if (wanted && !profile.seeking.includes(wanted)) continue;
    // Search only what this viewer can see, so it can't be used to probe hidden artists.
    if (search) {
      const words = [profile.username, ...profile.artists.flatMap((artist) => [artist.name, artistName(artist, 'mn')])];
      if (!words.some((word) => word.toLocaleLowerCase().includes(search))) continue;
    }
    for (const genre of profile.genres) counts[genre] = (counts[genre] ?? 0) + 1;
    if (query.genre && !profile.genres.includes(query.genre)) continue;
    found.push({ seen, rank: compareMusic(me.profile, profile).rank });
  }

  found.sort((a, b) => b.rank - a.rank || a.seen.profile.username.localeCompare(b.seen.profile.username));
  const limit = Math.min(Math.max(query.limit || PAGE.start, 1), PAGE.max);
  return { people: found.slice(0, limit).map((item) => item.seen), total: found.length, counts };
}

export function parsePeopleInput(value: unknown): PeopleInput | null {
  if (typeof value !== 'object' || value === null) return null;
  const { kind, personId, id, reason, details, block, evidence } = value as Record<string, unknown>;
  if (!isId(personId)) return null;
  if (kind === 'report') {
    const known = REPORT_REASONS.find((item) => item === reason);
    if (!known || !isId(id) || typeof details !== 'string' || typeof block !== 'boolean' || typeof evidence !== 'boolean') return null;
    return { kind, personId, id, reason: known, details: details.slice(0, SOCIAL_LIMITS.reportDetails), block, evidence };
  }
  const simple = (['send', 'cancel', 'accept', 'decline', 'remove', 'block', 'unblock'] as const).find((item) => item === kind);
  return simple ? { kind: simple, personId } : null;
}

function blockPerson(db: DatabaseSync, me: string, them: string, username: string, now: number) {
  db.prepare('INSERT INTO blocks VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING').run(me, them, username, now);
  db.prepare('DELETE FROM requests WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)').run(me, them, them, me);
}

export function applyPeople(db: DatabaseSync, meId: string, input: PeopleInput, now = Date.now()): { ok: true } | { ok: false; error: PeopleError } {
  return inTransaction<{ ok: true } | { ok: false; error: PeopleError }>(db, () => {
    const done = { ok: true } as const;
    const fail = (error: PeopleError) => ({ ok: false, error }) as const;
    const themId = input.personId;

    if (themId === meId) return fail('invalid');
    if (input.kind === 'unblock') {
      db.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').run(meId, themId);
      return done;
    }

    if (input.kind === 'report') {
      const repeated = db.prepare('SELECT reporter_id FROM reports WHERE id = ?').get(input.id) as { reporter_id: string | null } | undefined;
      if (repeated) return repeated.reporter_id === meId ? done : fail('invalid');
    }

    const me = getMember(db, meId);
    if (!me) return fail('notReady');
    const them = getMember(db, themId);
    const relation = relationBetween(db, meId, themId);
    const blocked = isBlocked(db, meId, themId);
    const setState = (from: string, to: string, state: string) =>
      db.prepare('INSERT INTO requests VALUES (?, ?, ?, ?) ON CONFLICT(from_id, to_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at').run(from, to, state, now);

    switch (input.kind) {
      case 'send': {
        if (!them || blocked) return fail('unavailable');
        if (relation === 'outgoing') return done;
        const problem = requestProblem(me, them, relation, sentToday(db, meId, now));
        if (problem) return fail(problem);
        const earlier = db.prepare('SELECT state FROM requests WHERE from_id = ? AND to_id = ?').get(meId, themId) as { state: string } | undefined;
        // Someone who was declined sees "sent" again, and the person who declined is never bothered again.
        setState(meId, themId, earlier?.state === 'withdrawn' ? 'declined' : 'pending');
        db.prepare('INSERT INTO request_log VALUES (?, ?)').run(meId, now);
        return done;
      }
      case 'cancel':
        db.prepare("DELETE FROM requests WHERE from_id = ? AND to_id = ? AND state = 'pending'").run(meId, themId);
        db.prepare("UPDATE requests SET state = 'withdrawn' WHERE from_id = ? AND to_id = ? AND state = 'declined'").run(meId, themId);
        return done;
      case 'accept':
        if (relation === 'connected') return done;
        if (!them || blocked || relation !== 'incoming') return fail('unavailable');
        db.prepare('DELETE FROM requests WHERE from_id = ? AND to_id = ?').run(meId, themId);
        setState(themId, meId, 'accepted');
        return done;
      case 'decline':
        if (relation === 'incoming') setState(themId, meId, 'declined');
        return done;
      case 'remove':
        if (relation === 'connected') db.prepare('DELETE FROM requests WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)').run(meId, themId, themId, meId);
        return done;
      case 'block':
        if (blocked) return done;
        if (!them || !canView(me, them, relation)) return fail('unavailable');
        blockPerson(db, meId, themId, them.profile.username, now);
        return done;
      case 'report': {
        // Still possible after they hid, blocked me or removed me, if we had any contact.
        const row = db.prepare('SELECT profile FROM users WHERE id = ?').get(themId) as { profile: string } | undefined;
        const visible = them && !blocked && canView(me, them, relation);
        const contact = () => db.prepare('SELECT 1 FROM messages WHERE sender_id = ? AND recipient_id = ? LIMIT 1').get(themId, meId);
        if (!row || (!visible && !contact())) return fail('unavailable');

        const { count } = db.prepare('SELECT COUNT(*) AS count FROM reports WHERE reporter_id = ? AND created_at > ?').get(meId, now - DAY) as { count: number };
        if (count >= SOCIAL_LIMITS.reportsPerDay) return fail('reportLimit');
        const username = parseProfile(row.profile).username;
        // Messages go to the moderator only when the reporter chose to attach them.
        const attached = input.evidence ? JSON.stringify(evidenceFor(db, meId, themId)) : null;
        db.prepare("INSERT INTO reports VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received')")
          .run(input.id, meId, themId, username, input.reason, input.details.trim(), attached, now);
        if (input.block) blockPerson(db, meId, themId, username, now);
        return done;
      }
    }
  });
}
