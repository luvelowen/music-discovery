import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { applyChange, type Account, type Change } from '../account/changes.ts';
import { parseProfile } from '../profile/parse.ts';
import { EMPTY_PROFILE } from '../profile/types.ts';
import { getAgeGroup } from '../social/eligibility.ts';
import { parseSocial } from '../social/parse.ts';
import { EMPTY_SOCIAL } from '../social/types.ts';
import { checkPassword } from './password.ts';

export const PASSWORD = { min: 10, max: 128 } as const;
export const SESSION_DAYS = 30;
const ATTEMPTS = { max: 5, within: 15 * 60 * 1000 } as const;
const DAY = 24 * 60 * 60 * 1000;

export type AuthError =
  | 'email' | 'password' | 'match' | 'birth' | 'consent' | 'minor' | 'wrong' | 'tooMany'
  | 'code' | 'expired' | 'tries' | 'sendFailed' | 'suspended' | 'closed';
type Result = { ok: true; userId: string } | { ok: false; error: AuthError };

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  adult: number;
  consent_at: number;
  created_at: number;
  updated_at: number;
  profile: string;
  social: string;
};

const digest = (text: string) => createHash('sha256').update(text).digest('hex');
export const tidyEmail = (email: string) => email.normalize('NFC').trim().toLowerCase();
export const findByEmail = (db: DatabaseSync, email: string) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

export function toAccount(row: Pick<UserRow, 'profile' | 'social'>): Account {
  return { profile: parseProfile(row.profile), social: parseSocial(row.social) };
}

export type SignUp = { email: string; password: string; again: string; year: number; month: number; day: number; consent: boolean };

// Plain ASCII only, which is all this app's mailer can deliver to. It also rules out line breaks.
export function isEmail(email: string) {
  return email.length <= 254 && /^[a-z\d._%+'-]{1,64}@([a-z\d]([a-z\d-]*[a-z\d])?\.)+[a-z]{2,}$/.test(email);
}

export function checkNewPassword(password: string, again: string): AuthError | null {
  const length = [...password].length;
  if (length < PASSWORD.min || length > PASSWORD.max) return 'password';
  return password.normalize('NFC') === again.normalize('NFC') ? null : 'match';
}

export function checkSignUp(input: SignUp, now: number): { ok: true; email: string } | { ok: false; error: AuthError } {
  const email = tidyEmail(input.email);
  if (!isEmail(email)) return { ok: false, error: 'email' };
  const problem = checkNewPassword(input.password, input.again);
  if (problem) return { ok: false, error: problem };

  const age = getAgeGroup(input.year, input.month, input.day, new Date(now));
  if (!age) return { ok: false, error: 'birth' };
  // Checked before anything is written, so nothing about someone under 18 is saved.
  if (age === 'minor') return { ok: false, error: 'minor' };
  return input.consent ? { ok: true, email } : { ok: false, error: 'consent' };
}

/** Call only after the email code was right. Returns null if the email was taken meanwhile. */
export function createUser(db: DatabaseSync, email: string, hash: string, consentAt: number, now: number) {
  const id = randomUUID();
  const social = JSON.stringify(EMPTY_SOCIAL);
  const added = db
    .prepare('INSERT INTO users VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING')
    .run(id, email, hash, consentAt, now, now, JSON.stringify(EMPTY_PROFILE), social);
  return added.changes ? id : null;
}

export function accountOf(db: DatabaseSync, userId: string) {
  return toAccount(db.prepare('SELECT profile, social FROM users WHERE id = ?').get(userId) as Pick<UserRow, 'profile' | 'social'>);
}

export function markEmailChecked(db: DatabaseSync, userId: string, now: number) {
  db.prepare('INSERT INTO email_checks VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET checked_at = excluded.checked_at').run(userId, now);
}

export function emailCheckedAt(db: DatabaseSync, userId: string) {
  const row = db.prepare('SELECT checked_at FROM email_checks WHERE user_id = ?').get(userId) as { checked_at: number } | undefined;
  return row?.checked_at ?? null;
}

/** A new password signs out every browser and lifts the log-in lock. */
export function setPassword(db: DatabaseSync, userId: string, email: string, hash: string, now: number) {
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hash, now, userId);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM login_attempts WHERE email_hash = ?').run(digest(email));
}

export async function logIn(db: DatabaseSync, rawEmail: string, password: string, now = Date.now()): Promise<Result> {
  const email = tidyEmail(rawEmail);
  if (!email || email.length > 254 || !password || password.length > PASSWORD.max * 2) return { ok: false, error: 'wrong' };

  const key = digest(email);
  db.prepare('DELETE FROM login_attempts WHERE at < ?').run(now - ATTEMPTS.within);
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM login_attempts WHERE email_hash = ?').get(key) as { count: number };
  if (count >= ATTEMPTS.max) return { ok: false, error: 'tooMany' };
  // Counted before the slow check, so many guesses at the same moment can't slip through.
  db.prepare('INSERT INTO login_attempts VALUES (?, ?)').run(key, now);

  const user = findByEmail(db, email);
  if (!(await checkPassword(password, user?.password_hash)) || !user) return { ok: false, error: 'wrong' };
  db.prepare('DELETE FROM login_attempts WHERE email_hash = ?').run(key);
  // Only someone with the right password is told.
  if (db.prepare('SELECT 1 FROM suspensions WHERE user_id = ?').get(user.id)) return { ok: false, error: 'suspended' };
  return { ok: true, userId: user.id };
}

export function createSession(db: DatabaseSync, userId: string, now = Date.now()) {
  const token = randomBytes(32).toString('base64url');
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
  // Only a fingerprint is stored. The token itself lives in the person's cookie.
  db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').run(digest(token), userId, now, now + SESSION_DAYS * DAY);
  return token;
}

export function endSession(db: DatabaseSync, token: string) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token));
}

export function userForSession(db: DatabaseSync, token: string, now = Date.now()) {
  return db
    .prepare('SELECT users.* FROM users JOIN sessions ON sessions.user_id = users.id WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND NOT EXISTS (SELECT 1 FROM suspensions WHERE suspensions.user_id = users.id)')
    .get(digest(token), now) as UserRow | undefined;
}

// Width, capitals and alphabet look-alikes of the same name count as the same name.
const LOOK_ALIKE: Record<string, string> = { а: 'a', е: 'e', о: 'o', ө: 'o', р: 'p', с: 'c', у: 'y', ү: 'y', х: 'x', і: 'i', ѕ: 's', ј: 'j' };
const nameKey = (name: string) => [...name.normalize('NFKC').toLowerCase()].map((letter) => LOOK_ALIKE[letter] ?? letter).join('');

function nameTaken(db: DatabaseSync, userId: string, username: string) {
  const key = nameKey(username);
  const others = db.prepare("SELECT json_extract(profile, '$.username') AS name FROM users WHERE id <> ?").all(userId) as { name: string | null }[];
  return others.some((other) => other.name && nameKey(other.name) === key);
}

/** `taken` means everything was saved except a username somebody else already has. */
export function saveChanges(db: DatabaseSync, userId: string, changes: Change[], now = Date.now()): { account: Account; taken: boolean } | null {
  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT profile, social FROM users WHERE id = ?').get(userId) as Pick<UserRow, 'profile' | 'social'> | undefined;
    if (!row) {
      db.exec('ROLLBACK');
      return null;
    }
    const before = toAccount(row);
    let account = changes.reduce(applyChange, before);
    const { username } = account.profile;
    const taken = Boolean(username) && username !== before.profile.username && nameTaken(db, userId, username);
    if (taken) account = { ...account, profile: { ...account.profile, username: before.profile.username } };
    const profile = JSON.stringify(account.profile);
    // Keeps what older versions saved here, such as test connections, rather than erasing it unasked.
    const social = JSON.stringify({ ...(JSON.parse(row.social) as object), ...account.social });
    if (profile !== row.profile || social !== row.social) {
      db.prepare('UPDATE users SET profile = ?, social = ?, updated_at = ? WHERE id = ?').run(profile, social, now, userId);
    }
    db.exec('COMMIT');
    return { account, taken };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export async function deleteAccount(db: DatabaseSync, user: UserRow, password: string, now = Date.now()): Promise<AuthError | null> {
  // The same limit as logging in, so an open session can't be used to guess the password.
  const result = await logIn(db, user.email, password, now);
  if (!result.ok) return result.error;
  if (result.userId !== user.id) return 'wrong';
  db.prepare('DELETE FROM messages WHERE sender_id = ? OR recipient_id = ?').run(user.id, user.id);
  // Reports stay for safety, without a link back to the person who made them.
  db.prepare('UPDATE reports SET reporter_id = NULL WHERE reporter_id = ?').run(user.id);
  for (const table of ['chat_reads', 'chat_clears']) db.prepare(`DELETE FROM ${table} WHERE other_id = ?`).run(user.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id); // Sessions, email check and chat consent go with it.
  db.prepare('DELETE FROM email_codes WHERE email = ?').run(user.email);
  db.prepare('DELETE FROM email_sends WHERE email_hash = ?').run(digest(user.email));
  return null;
}

const countRows = (db: DatabaseSync, sql: string, ...args: string[]) => (db.prepare(sql).get(...args) as { count: number }).count;

/** Everything the database holds about one person, for their My data page. */
export function storedData(db: DatabaseSync, user: UserRow) {
  const sessions = db
    .prepare('SELECT created_at, expires_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC')
    .all(user.id) as { created_at: number; expires_at: number }[];
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM login_attempts WHERE email_hash = ?').get(digest(user.email)) as { count: number };
  const chat = db.prepare('SELECT agreed_at FROM chat_consents WHERE user_id = ?').get(user.id) as { agreed_at: number } | undefined;
  const saved = db.prepare('SELECT COUNT(*) AS count FROM messages WHERE sender_id = ? OR recipient_id = ?').get(user.id, user.id) as { count: number };
  return {
    sessions,
    attempts: count,
    checkedAt: emailCheckedAt(db, user.id),
    chat: { consentAt: chat?.agreed_at ?? null, messages: saved.count },
    social: {
      connections: countRows(db, "SELECT COUNT(*) AS count FROM requests WHERE state = 'accepted' AND (from_id = ? OR to_id = ?)", user.id, user.id),
      requests: countRows(db, "SELECT COUNT(*) AS count FROM requests WHERE (from_id = ? AND state IN ('pending', 'declined')) OR (to_id = ? AND state = 'pending')", user.id, user.id),
      blocked: countRows(db, 'SELECT COUNT(*) AS count FROM blocks WHERE blocker_id = ?', user.id),
      reports: countRows(db, 'SELECT COUNT(*) AS count FROM reports WHERE reporter_id = ?', user.id),
    },
  };
}
