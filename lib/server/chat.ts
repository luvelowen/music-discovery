import type { DatabaseSync } from 'node:sqlite';
import { cleanMessage } from '../chat/clean.ts';
import { CHAT_LIMITS, type ChatError, type ChatInput, type ChatList, type Message, type Thread } from '../chat/types.ts';
import { PEOPLE } from '../demo/people.ts';
import type { Social } from '../social/types.ts';
import { canInteract } from '../social/policy.ts';
import { accountOf } from './accounts.ts';

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

function isConnected(social: Social, personId: string) {
  const person = PEOPLE.en.find((item) => item.id === personId);
  return Boolean(person) && social.relations[personId] === 'connected' && canInteract(social, person!);
}

function refusal(db: DatabaseSync, me: string, them: string): ChatError | null {
  if (consentAt(db, me) === null) return 'consent';
  return isConnected(accountOf(db, me).social, them) ? null : 'notConnected';
}

export function listChats(db: DatabaseSync, me: string): ChatList {
  const agreed = consentAt(db, me);
  if (agreed === null) return { consentAt: null, chats: [] };
  const { social } = accountOf(db, me);

  const latest = db.prepare(`SELECT seq, sender_id, body, created_at FROM messages WHERE ${PAIR} ORDER BY seq DESC LIMIT 1`);
  const unread = db.prepare(`
    SELECT COUNT(*) AS count FROM messages
    WHERE sender_id = ? AND recipient_id = ?
      AND seq > COALESCE((SELECT seq FROM chat_reads WHERE user_id = ? AND other_id = ?), 0)`);

  const chats = Object.keys(social.relations)
    .filter((id) => isConnected(social, id))
    .map((personId) => {
      const row = latest.get(...pair(me, personId)) as Row | undefined;
      const { count } = unread.get(personId, me, me, personId) as { count: number };
      return { personId, last: row ? show(me, row) : null, unread: count };
    })
    .sort((a, b) => (b.last?.seq ?? 0) - (a.last?.seq ?? 0));
  return { consentAt: agreed, chats };
}

export function readThread(db: DatabaseSync, me: string, them: string, before = Number.MAX_SAFE_INTEGER): ({ ok: true } & Thread) | Failed {
  const error = refusal(db, me, them);
  if (error) return fail(error);
  const rows = db
    .prepare(`SELECT seq, sender_id, body, created_at FROM messages WHERE ${PAIR} AND seq < ? ORDER BY seq DESC LIMIT ?`)
    .all(...pair(me, them), before, CHAT_LIMITS.page + 1) as Row[];
  const { first } = db.prepare(`SELECT MIN(seq) AS first FROM messages WHERE ${PAIR}`).get(...pair(me, them)) as { first: number | null };
  const messages = rows.slice(0, CHAT_LIMITS.page).reverse().map((row) => show(me, row));
  return { ok: true, messages, first, more: rows.length > CHAT_LIMITS.page };
}

function save(db: DatabaseSync, from: string, to: string, id: string, body: string, now: number): { ok: true } | Failed {
  const repeated = db.prepare('SELECT recipient_id FROM messages WHERE sender_id = ? AND client_id = ?').get(from, id) as { recipient_id: string } | undefined;
  // A retry after a lost reply is saved once.
  if (repeated) return repeated.recipient_id === to ? { ok: true } : fail('invalid');

  const sentSince = (time: number) =>
    (db.prepare('SELECT COUNT(*) AS count FROM messages WHERE sender_id = ? AND created_at > ?').get(from, time) as { count: number }).count;
  if (sentSince(now - MINUTE) >= CHAT_LIMITS.perMinute || sentSince(now - DAY) >= CHAT_LIMITS.perDay) return fail('tooMany');

  db.prepare('INSERT INTO messages (client_id, sender_id, recipient_id, body, created_at) VALUES (?, ?, ?, ?, ?)').run(id, from, to, body, now);
  return { ok: true };
}

export function turnOn(db: DatabaseSync, me: string, now = Date.now()) {
  db.prepare('INSERT INTO chat_consents VALUES (?, ?) ON CONFLICT(user_id) DO NOTHING').run(me, now);
}

/** Withdrawing consent deletes what the consent allowed us to keep. */
export function turnOff(db: DatabaseSync, me: string) {
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('DELETE FROM messages WHERE sender_id = ? OR recipient_id = ?').run(me, me);
    db.prepare('DELETE FROM chat_reads WHERE user_id = ?').run(me);
    db.prepare('DELETE FROM chat_consents WHERE user_id = ?').run(me);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function parseChatInput(value: unknown): ChatInput | null {
  if (typeof value !== 'object' || value === null) return null;
  const { kind, personId, id, text, seq } = value as Record<string, unknown>;
  if (kind === 'consent' || kind === 'off') return { kind };
  if (!isId(personId)) return null;
  if (kind === 'delete') return { kind, personId };
  if (kind === 'read' && typeof seq === 'number' && Number.isSafeInteger(seq) && seq > 0) return { kind, personId, seq };
  if (!isId(id)) return null;
  if (kind === 'testReply') return { kind, personId, id };
  if (kind === 'send' && typeof text === 'string') return { kind, personId, id, text };
  return null;
}

/** `testText` is what a fictional person's test reply says. Its wording comes from the server, not the request. */
export function applyChat(db: DatabaseSync, me: string, input: ChatInput, testText: string, now = Date.now()): { ok: true } | Failed {
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
    case 'testReply': {
      // Fictional people only. This can never put words in a real person's mouth.
      if (!PEOPLE.en.some((person) => person.id === them)) return fail('invalid');
      const id = `${me}-${input.id}`;
      const recent = db
        .prepare('SELECT COUNT(*) AS count FROM messages WHERE sender_id = ? AND recipient_id = ? AND created_at > ?')
        .get(them, me, now - MINUTE) as { count: number };
      if (recent.count >= CHAT_LIMITS.perMinute) return fail('tooMany');
      db.prepare('INSERT INTO messages (client_id, sender_id, recipient_id, body, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING')
        .run(id, them, me, testText, now);
      return { ok: true };
    }
    case 'read': {
      const { newest } = db.prepare('SELECT MAX(seq) AS newest FROM messages WHERE sender_id = ? AND recipient_id = ?').get(them, me) as { newest: number | null };
      if (newest !== null) {
        db.prepare('INSERT INTO chat_reads VALUES (?, ?, ?) ON CONFLICT(user_id, other_id) DO UPDATE SET seq = MAX(seq, excluded.seq)')
          .run(me, them, Math.min(input.seq, newest));
      }
      return { ok: true };
    }
    case 'delete': {
      db.prepare(`DELETE FROM messages WHERE ${PAIR}`).run(...pair(me, them));
      db.prepare('DELETE FROM chat_reads WHERE user_id = ? AND other_id = ?').run(me, them);
      return { ok: true };
    }
  }
}
