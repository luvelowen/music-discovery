import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import * as accounts from './accounts.ts';
import { hashPassword } from './password.ts';

/*
 * Six-digit codes for three jobs: finishing sign-up, resetting a password, checking an existing email.
 * A code works only with the cookie of the browser that asked, for 15 minutes and five tries.
 * An account is created only after the code is right, so nobody can register someone else's email.
 */
export type Purpose = 'signup' | 'reset' | 'check';
export type CodeMail = { to: string; kind: Purpose | 'exists'; code: string };
type Started = { ok: true; token: string; mail: CodeMail | null } | { ok: false; error: accounts.AuthError };
type Finished = { ok: true; userId: string } | { ok: false; error: accounts.AuthError };

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
export const CODE = { minutes: 15, tries: 5 } as const;
const SENDS = { burst: 3, burstWithin: 15 * MINUTE, daily: 10, everyoneHourly: 40 } as const;

type CodeRow = {
  id_hash: string;
  purpose: Purpose;
  email: string;
  user_id: string | null;
  password_hash: string | null;
  consent_at: number | null;
  code_hash: string | null;
  tries: number;
  created_at: number;
  expires_at: number;
};

const digest = (text: string) => createHash('sha256').update(text).digest('hex');
// The token is only in the person's cookie, so the database alone can't be used to work out a code.
const newCode = () => String(randomInt(1_000_000)).padStart(6, '0');
const codeDigest = (token: string, code: string) => digest(`${token}:${code}`);

function allowSend(db: DatabaseSync, email: string, now: number) {
  db.prepare('DELETE FROM email_sends WHERE at < ?').run(now - DAY);
  const count = (sql: string, ...args: (string | number)[]) => (db.prepare(sql).get(...args) as { count: number }).count;
  const key = digest(email);
  if (count('SELECT COUNT(*) AS count FROM email_sends WHERE email_hash = ? AND at > ?', key, now - SENDS.burstWithin) >= SENDS.burst) return false;
  if (count('SELECT COUNT(*) AS count FROM email_sends WHERE email_hash = ?', key) >= SENDS.daily) return false;
  if (count('SELECT COUNT(*) AS count FROM email_sends WHERE at > ?', now - 60 * MINUTE) >= SENDS.everyoneHourly) return false;
  db.prepare('INSERT INTO email_sends VALUES (?, ?)').run(key, now);
  return true;
}

function open(db: DatabaseSync, row: Omit<CodeRow, 'id_hash' | 'code_hash' | 'tries' | 'created_at' | 'expires_at'>, real: boolean, now: number) {
  const token = randomBytes(32).toString('base64url');
  const code = newCode();
  db.prepare('DELETE FROM email_codes WHERE created_at < ?').run(now - DAY);
  // With no real code the screen looks the same, and no guess can ever be right.
  db.prepare('INSERT INTO email_codes VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)').run(
    digest(token), row.purpose, row.email, row.user_id, row.password_hash, row.consent_at,
    real ? codeDigest(token, code) : null, now, now + CODE.minutes * MINUTE,
  );
  return { token, code };
}

export function findCode(db: DatabaseSync, token: string, now = Date.now()) {
  return db.prepare('SELECT * FROM email_codes WHERE id_hash = ? AND created_at > ?').get(digest(token), now - DAY) as CodeRow | undefined;
}

export function forgetCode(db: DatabaseSync, token: string) {
  db.prepare('DELETE FROM email_codes WHERE id_hash = ?').run(digest(token));
}

export async function beginSignUp(db: DatabaseSync, input: accounts.SignUp, now = Date.now()): Promise<Started> {
  const checked = accounts.checkSignUp(input, now);
  if (!checked.ok) return checked;
  const { email } = checked;
  if (!allowSend(db, email, now)) return { ok: false, error: 'tooMany' };

  const password_hash = await hashPassword(input.password);
  // An email that already has an account looks exactly the same here. Only its owner's inbox is told.
  const exists = Boolean(accounts.findByEmail(db, email));
  const { token, code } = open(
    db,
    { purpose: 'signup', email, user_id: null, password_hash: exists ? null : password_hash, consent_at: now },
    !exists,
    now,
  );
  return { ok: true, token, mail: { to: email, kind: exists ? 'exists' : 'signup', code: exists ? '' : code } };
}

export function beginReset(db: DatabaseSync, rawEmail: string, now = Date.now()): Started {
  const email = accounts.tidyEmail(rawEmail);
  if (!accounts.isEmail(email)) return { ok: false, error: 'email' };
  const user = accounts.findByEmail(db, email);
  // No account, or too many emails: same answer, no email.
  const real = Boolean(user) && allowSend(db, email, now);
  const { token, code } = open(db, { purpose: 'reset', email, user_id: user?.id ?? null, password_hash: null, consent_at: null }, real, now);
  return { ok: true, token, mail: real ? { to: email, kind: 'reset', code } : null };
}

export function beginCheck(db: DatabaseSync, user: accounts.UserRow, now = Date.now()): Started {
  if (!allowSend(db, user.email, now)) return { ok: false, error: 'tooMany' };
  const { token, code } = open(db, { purpose: 'check', email: user.email, user_id: user.id, password_hash: null, consent_at: null }, true, now);
  return { ok: true, token, mail: { to: user.email, kind: 'check', code } };
}

/** Puts a new code behind the same cookie, so the cookie can't reveal whether an email was really sent. */
export function resend(db: DatabaseSync, token: string, now = Date.now()): Started {
  const row = findCode(db, token, now);
  if (!row) return { ok: false, error: 'expired' };
  const unknown = row.purpose === 'reset' && !row.user_id;
  if (unknown || !allowSend(db, row.email, now)) {
    // A reset always answers the same. Any code already in the inbox keeps working.
    return row.purpose === 'reset' ? { ok: true, token, mail: null } : { ok: false, error: 'tooMany' };
  }
  const exists = row.purpose === 'signup' && !row.password_hash;
  const code = newCode();
  db.prepare('UPDATE email_codes SET code_hash = ?, tries = 0, created_at = ?, expires_at = ? WHERE id_hash = ?')
    .run(exists ? null : codeDigest(token, code), now, now + CODE.minutes * MINUTE, row.id_hash);
  return { ok: true, token, mail: { to: row.email, kind: exists ? 'exists' : row.purpose, code: exists ? '' : code } };
}

function spendCode(db: DatabaseSync, token: string, purpose: Purpose, typed: string, now: number): { row: CodeRow } | { error: accounts.AuthError } {
  const row = findCode(db, token, now);
  if (!row || row.purpose !== purpose || now >= row.expires_at) return { error: 'expired' };
  // Counted in one step before comparing, so simultaneous guesses can't share a try.
  const counted = db.prepare('UPDATE email_codes SET tries = tries + 1 WHERE id_hash = ? AND tries < ?').run(row.id_hash, CODE.tries);
  if (!counted.changes) return { error: 'tries' };
  const code = typed.normalize('NFKC').replace(/\s/g, '');
  const right = timingSafeEqual(Buffer.from(row.code_hash ?? '0'.repeat(64)), Buffer.from(codeDigest(token, code)));
  return right && row.code_hash ? { row } : { error: 'code' };
}

function inTransaction<T>(db: DatabaseSync, work: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function finishSignUp(db: DatabaseSync, token: string, typed: string, now = Date.now()): Finished {
  const used = spendCode(db, token, 'signup', typed, now);
  if ('error' in used) return { ok: false, error: used.error };
  const { row } = used;
  return inTransaction<Finished>(db, () => {
    const userId = accounts.createUser(db, row.email, row.password_hash!, row.consent_at!, now);
    db.prepare("DELETE FROM email_codes WHERE purpose = 'signup' AND email = ?").run(row.email);
    if (!userId) return { ok: false, error: 'code' };
    accounts.markEmailChecked(db, userId, now);
    return { ok: true, userId };
  });
}

export async function finishReset(db: DatabaseSync, token: string, typed: string, password: string, again: string, now = Date.now()): Promise<Finished> {
  const problem = accounts.checkNewPassword(password, again);
  if (problem) return { ok: false, error: problem };
  const hash = await hashPassword(password);
  const used = spendCode(db, token, 'reset', typed, now);
  if ('error' in used) return { ok: false, error: used.error };
  const userId = used.row.user_id!;
  return inTransaction<Finished>(db, () => {
    accounts.setPassword(db, userId, used.row.email, hash, now);
    db.prepare('DELETE FROM email_codes WHERE user_id = ?').run(userId);
    accounts.markEmailChecked(db, userId, now); // The code proved they own the inbox.
    return { ok: true, userId };
  });
}

export function finishCheck(db: DatabaseSync, token: string, typed: string, user: accounts.UserRow, now = Date.now()): Finished {
  if (findCode(db, token, now)?.user_id !== user.id) return { ok: false, error: 'expired' };
  const used = spendCode(db, token, 'check', typed, now);
  if ('error' in used) return { ok: false, error: used.error };
  accounts.markEmailChecked(db, user.id, now);
  forgetCode(db, token);
  return { ok: true, userId: user.id };
}
