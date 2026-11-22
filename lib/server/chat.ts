import type { DatabaseSync } from 'node:sqlite';
import { cleanMessage } from '../chat/clean.ts';
import { CHAT_LIMITS, type ChatError, type ChatInput, type ChatList, type Message, type Thread } from '../chat/types.ts';
import { inTransaction } from './db.ts';
import { getMember, isBlocked, relationBetween } from './members.ts';

/*
 * Every chat rule is checked here, on every read and every write:
 * consent, a connection both people agreed to, and no block.
 * The sender always comes from the session, never from the request.
 * Never log a message: private correspondence is sensitive data in Mongolian law.
 */
type Failed = { ok: false; error: ChatError };
type Row = { seq: number; sender_id: string; body: string; created_at: number };

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const PAIR = '((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))';
const pair = (me: string, them: string) => [me, them, them, me] as const;
const fail = (error: ChatError): Failed => ({ ok: false, error });
const show = (me: string, row: Row): Message => ({ seq: row.seq, mine: row.sender_id === me, body: row.body, at: row.created_at });
const isId = (value: unknown): value is string => typeof value === 'string' && /^[\w-]{1,80}$/.test(value);

export function consentAt(db: DatabaseSync, userId: string) {
  const row = db.prepare('SELECT agreed_at FROM chat_consents WHERE user_id = ?').get(userId) as { agreed_at: number } | undefined;
  return row?.agreed_at ?? null;
}

function clearedTo(db: DatabaseSync, userId: string, otherId: string) {
  const row = db.prepare('SELECT seq FROM chat_clears WHERE user_id = ? AND other_id = ?').get(userId, otherId) as { seq: number } | undefined;
  return row?.seq ?? 0;
}

function refusal(db: DatabaseSync, me: string, them: string): ChatError | null {
  if (consentAt(db, me) === null) return 'consent';
  const allowed = me !== them && getMember(db, me) && getMember(db, them) && !isBlocked(db, me, them) && relationBetween(db, me, them) === 'connected';
  return allowed ? null : 'notConnected';
}

export function listChats(db: DatabaseSync, me: string): ChatList {
  const agreed = consentAt(db, me);
  if (agreed === null) return { consentAt: null, chats: [] };

  const partners = db
    .prepare("SELECT to_id AS id FROM requests WHERE from_id = ? AND state = 'accepted' UNION SELECT from_id AS id FROM requests WHERE to_id = ? AND state = 'accepted'")
    .all(me, me) as { id: string }[];
  const latest = db.prepare(`SELECT seq, sender_id, body, created_at FROM messages WHERE ${PAIR} AND seq > ? ORDER BY seq DESC LIMIT 1`);
  const unread = db.prepare(`
    SELECT COUNT(*) AS count FROM messages
    WHERE sender_id = ? AND recipient_id = ? AND seq > ?
      AND seq > COALESCE((SELECT seq FROM chat_reads WHERE user_id = ? AND other_id = ?), 0)`);

  const chats = partners
    .filter(({ id }) => refusal(db, me, id) === null)
    .map(({ id }) => {
      const after = clearedTo(db, me, id);
      const row = latest.get(...pair(me, id), after) as Row | undefined;
      const { count } = unread.get(id, me, after, me, id) as { count: number };
      return { personId: id, last: row ? show(me, row) : null, unread: count };
    })
    .sort((a, b) => (b.last?.seq ?? 0) - (a.last?.seq ?? 0));
  return { consentAt: agreed, chats };
}

export function readThread(db: DatabaseSync, me: string, them: string, before = Number.MAX_SAFE_INTEGER): ({ ok: true } & Thread) | Failed {
  const error = refusal(db, me, them);
  if (error) return fail(error);
  const after = clearedTo(db, me, them);
  const rows = db
    .prepare(`SELECT seq, sender_id, body, created_at FROM messages WHERE ${PAIR} AND seq > ? AND seq < ? ORDER BY seq DESC LIMIT ?`)
    .all(...pair(me, them), after, before, CHAT_LIMITS.page + 1) as Row[];
  const { first } = db.prepare(`SELECT MIN(seq) AS first FROM messages WHERE ${PAIR} AND seq > ?`).get(...pair(me, them), after) as { first: number | null };
  const messages = rows.slice(0, CHAT_LIMITS.page).reverse().map((row) => show(me, row));
  return { ok: true, messages, first, more: rows.length > CHAT_LIMITS.page, theyOn: consentAt(db, them) !== null };
}

/** The recent messages a reporter can see, for the moderator. Used only when they chose to attach them. */
export function evidenceFor(db: DatabaseSync, me: string, them: string) {
  const rows = db
    .prepare(`SELECT seq, sender_id, body, created_at FROM messages WHERE ${PAIR} AND seq > ? ORDER BY seq DESC LIMIT ?`)
    .all(...pair(me, them), clearedTo(db, me, them), CHAT_LIMITS.evidence) as Row[];
  return rows.reverse().map((row) => ({ from: row.sender_id === me ? 'reporter' : 'reported', text: row.body, at: row.created_at }));
}

function save(db: DatabaseSync, from: string, to: string, id: string, body: string, now: number): { ok: true } | Failed {
  const repeated = db.prepare('SELECT recipient_id FROM messages WHERE sender_id = ? AND client_id = ?').get(from, id) as { recipient_id: string } | undefined;
  // A retry after a lost reply is saved once.
  if (repeated) return repeated.recipient_id === to ? { ok: true } : fail('invalid');
  // They haven't agreed to us keeping their correspondence, so there is nowhere to deliver it.
  if (consentAt(db, to) === null) return fail('theyOff');

  const sentSince = (time: number) =>
    (db.prepare('SELECT COUNT(*) AS count FROM messages WHERE sender_id = ? AND created_at > ?').get(from, time) as { count: number }).count;
  if (sentSince(now - MINUTE) >= CHAT_LIMITS.perMinute || sentSince(now - DAY) >= CHAT_LIMITS.perDay) return fail('tooMany');

  db.prepare('INSERT INTO messages (client_id, sender_id, recipient_id, body, created_at) VALUES (?, ?, ?, ?, ?)').run(id, from, to, body, now);
  return { ok: true };
}

/** Hides everything so far from `me`. What both people have cleared is erased for good. */
function clear(db: DatabaseSync, me: string, them: string) {
  const { newest } = db.prepare(`SELECT MAX(seq) AS newest FROM messages WHERE ${PAIR}`).get(...pair(me, them)) as { newest: number | null };
  if (newest === null) return;
  db.prepare('INSERT INTO chat_clears VALUES (?, ?, ?) ON CONFLICT(user_id, other_id) DO UPDATE SET seq = MAX(seq, excluded.seq)').run(me, them, newest);
  const bothCleared = Math.min(newest, clearedTo(db, them, me));
  db.prepare(`DELETE FROM messages WHERE ${PAIR} AND seq <= ?`).run(...pair(me, them), bothCleared);
  db.prepare('DELETE FROM chat_reads WHERE user_id = ? AND other_id = ?').run(me, them);
}

export function turnOn(db: DatabaseSync, me: string, now = Date.now()) {
  db.prepare('INSERT INTO chat_consents VALUES (?, ?) ON CONFLICT(user_id) DO NOTHING').run(me, now);
}

/** Withdrawing consent erases what I wrote for both people, and clears my copy of what I received. */
export function turnOff(db: DatabaseSync, me: string) {
  inTransaction(db, () => {
    db.prepare('DELETE FROM messages WHERE sender_id = ?').run(me);
    db.prepare('DELETE FROM messages WHERE recipient_id = ? AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = messages.sender_id)').run(me);
    for (const { id } of db.prepare('SELECT DISTINCT sender_id AS id FROM messages WHERE recipient_id = ?').all(me) as { id: string }[]) clear(db, me, id);
    db.prepare('DELETE FROM chat_reads WHERE user_id = ?').run(me);
    db.prepare('DELETE FROM chat_consents WHERE user_id = ?').run(me);
  });
}

export function parseChatInput(value: unknown): ChatInput | null {
  if (typeof value !== 'object' || value === null) return null;
  const { kind, personId, id, text, seq } = value as Record<string, unknown>;
  if (kind === 'consent' || kind === 'off') return { kind };
  if (!isId(personId)) return null;
  if (kind === 'delete') return { kind, personId };
  if (kind === 'read' && typeof seq === 'number' && Number.isSafeInteger(seq) && seq > 0) return { kind, personId, seq };
  if (kind === 'send' && isId(id) && typeof text === 'string') return { kind, personId, id, text };
  return null;
}

export function applyChat(db: DatabaseSync, me: string, input: ChatInput, now = Date.now()): { ok: true } | Failed {
  if (input.kind === 'consent') {
    turnOn(db, me, now);
    return { ok: true };
  }
  if (input.kind === 'off') {
    turnOff(db, me);
    return { ok: true };
  }

  const them = input.personId;
  const error = refusal(db, me, them);
  if (error) return fail(error);

  switch (input.kind) {
    case 'send': {
      const cleaned = cleanMessage(input.text);
      return 'error' in cleaned ? fail(cleaned.error) : save(db, me, them, input.id, cleaned.text, now);
    }
    case 'read': {
      const { newest } = db.prepare('SELECT MAX(seq) AS newest FROM messages WHERE sender_id = ? AND recipient_id = ?').get(them, me) as { newest: number | null };
      if (newest !== null) {
        db.prepare('INSERT INTO chat_reads VALUES (?, ?, ?) ON CONFLICT(user_id, other_id) DO UPDATE SET seq = MAX(seq, excluded.seq)')
          .run(me, them, Math.min(input.seq, newest));
      }
      return { ok: true };
    }
    case 'delete':
      inTransaction(db, () => clear(db, me, them));
      return { ok: true };
  }
}
