import type { DatabaseSync } from 'node:sqlite';
import { emailCheckedAt, toAccount, type UserRow } from './accounts.ts';
import { consentAt } from './chat.ts';
import { getOverview } from './people.ts';

/** Everything kept about one person, for their own download. Never the password's scrambled value. */
export function exportData(db: DatabaseSync, user: UserRow) {
  const messages = db
    .prepare(`
      SELECT sender_id, recipient_id, body, created_at FROM messages
      WHERE (sender_id = ? OR recipient_id = ?)
        AND seq > COALESCE((
          SELECT seq FROM chat_clears
          WHERE user_id = ? AND other_id = CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END
        ), 0)
      ORDER BY seq`)
    .all(user.id, user.id, user.id, user.id);
  const overview = getOverview(db, user.id);
  const name = (people: typeof overview.connected) => people.map(({ id, profile }) => ({ id, username: profile.username }));

  return {
    account: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      agreedAt: user.consent_at,
      emailCheckedAt: emailCheckedAt(db, user.id),
      chatAgreedAt: consentAt(db, user.id),
    },
    ...toAccount(user),
    connections: name(overview.connected),
    requestsReceived: name(overview.incoming),
    requestsSent: name(overview.outgoing),
    blocked: overview.blocked,
    reportsMade: db.prepare('SELECT id, reported_name, reason, details, created_at, status FROM reports WHERE reporter_id = ?').all(user.id),
    messages,
  };
}
