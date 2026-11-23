import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { DICTIONARIES } from '../i18n/dictionaries.ts';
import { emailCheckedAt, toAccount, type UserRow } from './accounts.ts';
import { consentAt } from './chat.ts';
import { consentHistory } from './consent.ts';
import { getOverview } from './people.ts';

type Request = { from_id: string; to_id: string; state: 'pending' | 'accepted' | 'declined' | 'withdrawn'; updated_at: number };
type Message = { sender_id: string; recipient_id: string; body: string; created_at: number; hidden: number };

/*
 * What is kept about one person, for their own download. It works for unconfirmed and suspended accounts too.
 * Whatever is left out is listed inside the file and on My data. Keep both lists true.
 */
export function exportData(db: DatabaseSync, user: UserRow) {
  const all = (sql: string, ...values: string[]) => db.prepare(sql).all(...values);
  const emailKey = createHash('sha256').update(user.email).digest('hex');

  // A name only where they may still see it, so a download can't follow someone who has left them.
  const overview = getOverview(db, user.id);
  const names = new Map([...overview.connected, ...overview.incoming, ...overview.outgoing].map((seen) => [seen.id, seen.profile.username]));
  const who = (id: string) => ({ id, username: names.get(id) ?? null });

  const requests = all('SELECT * FROM requests WHERE from_id = ? OR to_id = ? ORDER BY from_id, to_id', user.id, user.id) as Request[];
  const received = requests.filter((row) => row.to_id === user.id && row.state !== 'accepted');
  // To the sender a declined request is a sent one: the same state, and no time to compare.
  const sent = requests.filter((row) => row.from_id === user.id && (row.state === 'pending' || row.state === 'declined'));

  const messages = all(`
    SELECT sender_id, recipient_id, body, created_at,
      seq <= COALESCE((
        SELECT seq FROM chat_clears
        WHERE user_id = ? AND other_id = CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END
      ), 0) AS hidden
    FROM messages WHERE sender_id = ? OR recipient_id = ? ORDER BY seq`, user.id, user.id, user.id, user.id) as Message[];

  return {
    notIncluded: { mn: DICTIONARIES.mn.account.data.omitted, en: DICTIONARIES.en.account.data.omitted },
    account: {
      id: user.id,
      email: user.email,
      adult: user.adult === 1,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      agreedAt: user.consent_at,
      emailCheckedAt: emailCheckedAt(db, user.id),
      chatAgreedAt: consentAt(db, user.id),
      suspension: db.prepare('SELECT reason, at FROM suspensions WHERE user_id = ?').get(user.id) ?? null,
    },
    ...toAccount(user),
    // Exactly as saved, including anything an older version of the app left there.
    savedAsWritten: { profile: JSON.parse(user.profile) as object, social: JSON.parse(user.social) as object },
    consents: consentHistory(db, user.id),
    connections: requests
      .filter((row) => row.state === 'accepted')
      .map((row) => ({ ...who(row.from_id === user.id ? row.to_id : row.from_id), at: row.updated_at })),
    requestsReceived: received.map((row) => ({ ...who(row.from_id), at: row.updated_at, state: row.state === 'pending' ? 'waiting' : 'declined by you' })),
    requestsSent: sent.map((row) => who(row.to_id)),
    requestsSentAt: all('SELECT at FROM request_log WHERE user_id = ? ORDER BY at', user.id),
    blocked: all('SELECT blocked_id, username, created_at FROM blocks WHERE blocker_id = ?', user.id),
    reportsMade: all('SELECT id, reported_name, reason, details, created_at, status, evidence IS NOT NULL AS messages_attached FROM reports WHERE reporter_id = ?', user.id),
    // My own words even where I cleared them. Other people's, only those I haven't cleared.
    messages: messages
      .filter((row) => row.sender_id === user.id || !row.hidden)
      .map(({ hidden, ...row }) => ({ ...row, clearedByYou: hidden === 1 })),
    clearedMessagesFromOthers: messages.filter((row) => row.sender_id !== user.id && row.hidden).length,
    chatRead: all('SELECT other_id, seq FROM chat_reads WHERE user_id = ?', user.id),
    chatCleared: all('SELECT other_id, seq FROM chat_clears WHERE user_id = ?', user.id),
    logIns: all('SELECT created_at, expires_at FROM sessions WHERE user_id = ? ORDER BY created_at', user.id),
    failedLogIns: all('SELECT at FROM login_attempts WHERE email_hash = ?', emailKey),
    emailsSentAt: all('SELECT at FROM email_sends WHERE email_hash = ?', emailKey),
    emailCodes: all('SELECT purpose, tries, created_at, expires_at FROM email_codes WHERE email = ?', user.email),
  };
}
