import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseChange, type Change } from '../lib/account/changes.ts';
import * as accounts from '../lib/server/accounts.ts';
import { shownMark } from '../lib/consent/text.ts';
import { hashPassword } from '../lib/server/password.ts';
import * as verification from '../lib/server/verification.ts';
import { openDatabase } from '../lib/server/db.ts';

const NOW = Date.UTC(2026, 10, 22, 4);
const GOOD = { email: ' Test@Example.com ', password: 'correct horse battery', again: 'correct horse battery', year: 2000, month: 5, day: 17, consent: true, shown: { locale: 'en', mark: shownMark('signup', 'en') } as const };
const change = (value: object) => ({ id: crypto.randomUUID(), ...value }) as Change;

async function makeUser(db: ReturnType<typeof openDatabase>, input: accounts.SignUp) {
  const checked = accounts.checkSignUp(input, NOW);
  assert.ok(checked.ok);
  return accounts.createUser(db, checked.email, await hashPassword(input.password), NOW, NOW);
}

async function withUser() {
  const db = openDatabase(':memory:');
  const id = await makeUser(db, GOOD);
  assert.ok(id);
  return { db, id };
}
const rows = (db: ReturnType<typeof openDatabase>, table: string) => db.prepare(`SELECT * FROM ${table}`).all();

test('sign-up stores a tidy email, a scrambled password and no birth date', async () => {
  const { db } = await withUser();
  const [user] = rows(db, 'users') as unknown as accounts.UserRow[];
  assert.equal(user!.email, 'test@example.com');
  assert.ok(user!.password_hash.startsWith('scrypt:131072:8:1:'));
  const dump = JSON.stringify(user);
  assert.ok(!dump.includes(GOOD.password));
  assert.ok(!/"(year|month|day|birth\w*)"/.test(dump));
});

test('invalid sign-ups and under-18s write nothing', async () => {
  const db = openDatabase(':memory:');
  for (const [patch, error] of [
    [{ email: 'not-an-email' }, 'email'], [{ email: 'a@b.com\r\nrcpt to:c@d.com' }, 'email'], [{ password: 'short' }, 'password'], [{ again: 'different password' }, 'match'], [{ month: 13 }, 'birth'],
    [{ year: 2010 }, 'minor'], [{ year: 2010, consent: false }, 'minor'], [{ consent: false }, 'consent'],
  ] as const) assert.deepEqual(await verification.beginSignUp(db, { ...GOOD, ...patch }, NOW), { ok: false, error });
  for (const table of ['users', 'email_codes', 'email_sends']) assert.equal(rows(db, table).length, 0, table);
});

test('one account for each email, whatever the capitals', async () => {
  const { db } = await withUser();
  assert.equal(await makeUser(db, { ...GOOD, email: 'TEST@example.COM' }), null);
});

test('log-in needs the right password and limits guessing', async () => {
  const { db, id } = await withUser();
  assert.deepEqual(await accounts.logIn(db, 'TEST@example.com', GOOD.password, NOW), { ok: true, userId: id });
  assert.deepEqual(await accounts.logIn(db, 'nobody@example.com', GOOD.password, NOW), { ok: false, error: 'wrong' });
  for (let i = 0; i < 5; i++) assert.deepEqual(await accounts.logIn(db, GOOD.email, 'wrong password', NOW + i), { ok: false, error: 'wrong' });
  assert.deepEqual(await accounts.logIn(db, GOOD.email, GOOD.password, NOW + 9), { ok: false, error: 'tooMany' });
  assert.equal((await accounts.logIn(db, GOOD.email, GOOD.password, NOW + 16 * 60 * 1000)).ok, true);
});

test('sessions expire, can end, and are stored only as fingerprints', async () => {
  const { db, id } = await withUser();
  const token = accounts.createSession(db, id, NOW);
  assert.equal(accounts.userForSession(db, token, NOW)?.id, id);
  assert.ok(!JSON.stringify(rows(db, 'sessions')).includes(token));
  assert.equal(accounts.userForSession(db, token, NOW + 31 * 86_400_000), undefined);
  accounts.endSession(db, token);
  assert.equal(accounts.userForSession(db, token, NOW), undefined);
});

test('changes are saved, and only to that account', async () => {
  const { db, id } = await withUser();
  const other = await makeUser(db, { ...GOOD, email: 'other@example.com' });
  assert.ok(other);
  accounts.saveChanges(db, id, [change({ kind: 'profile', patch: { username: 'өглөө', genres: ['jazz'] } })], NOW);
  const read = (userId: string) => accounts.toAccount(db.prepare('SELECT profile, social FROM users WHERE id = ?').get(userId) as unknown as accounts.UserRow);
  assert.equal(read(id).profile.username, 'өглөө');
  assert.equal(read(other).profile.username, '');
});

test('the server ignores forged fields and repeats the safety rules', async () => {
  const { db, id } = await withUser();
  accounts.saveChanges(db, id, [change({ kind: 'profile', patch: { username: 'fine_name', bio: 'fine bio' } })], NOW);
  const { account } = accounts.saveChanges(db, id, [
    change({ kind: 'profile', patch: { genres: ['jazz', 'fake'], photo: 'https://tracker.example/x.png', admin: true, seeking: ['friends'], username: 'call99112233', bio: 'ig @someone' } }),
    change({ kind: 'privacy', patch: { discoverable: 'yes', admin: true } }),
  ], NOW)!;
  assert.deepEqual(account.profile.genres, ['jazz']);
  assert.equal(account.profile.photo, null);
  assert.equal(account.profile.username, 'fine_name');
  assert.equal(account.profile.bio, 'fine bio');
  assert.ok(!('admin' in account.profile) && !('admin' in account.social.privacy));
  assert.equal(account.social.privacy.discoverable, false);
});

test('unknown changes are refused, including anything between two people', () => {
  for (const bad of [null, [], {}, { id: 'x', kind: 'eligibility', patch: {} }, { id: 'x', kind: 'accept', personId: 'p' }, { id: 'a b', kind: 'privacy', patch: {} }]) {
    assert.equal(parseChange(bad), null);
  }
});

test('a username belongs to one person, look-alikes included', async () => {
  const { db, id } = await withUser();
  const other = (await makeUser(db, { ...GOOD, email: 'other@example.com' }))!;
  accounts.saveChanges(db, id, [change({ kind: 'profile', patch: { username: 'copa' } })], NOW);
  for (const username of ['copa', 'COPA', String.fromCodePoint(0x0441, 0x043e, 0x0440, 0x0430)]) {
    const saved = accounts.saveChanges(db, other, [change({ kind: 'profile', patch: { username, bio: 'still saved' } })], NOW)!;
    assert.equal(saved.taken, true, username);
    assert.equal(saved.account.profile.username, '');
    assert.equal(saved.account.profile.bio, 'still saved');
  }
});

test('saving keeps what older versions stored, rather than erasing it', async () => {
  const { db, id } = await withUser();
  db.prepare('UPDATE users SET social = ? WHERE id = ?').run('{"privacy":{},"relations":{"sample-03":"connected"}}', id);
  accounts.saveChanges(db, id, [change({ kind: 'privacy', patch: { discoverable: true } })], NOW);
  const saved = JSON.parse((db.prepare('SELECT social FROM users WHERE id = ?').get(id) as { social: string }).social);
  assert.deepEqual(saved.relations, { 'sample-03': 'connected' });
  assert.equal(saved.privacy.discoverable, true);
});

test('deleting an account needs the password and leaves no rows', async () => {
  const { db, id } = await withUser();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as accounts.UserRow;
  accounts.createSession(db, id, NOW);
  assert.equal(await accounts.deleteAccount(db, user, 'not the password', NOW), 'wrong');
  assert.equal(await accounts.deleteAccount(db, user, GOOD.password, NOW), null);
  for (const table of ['users', 'sessions', 'login_attempts']) assert.equal(rows(db, table).length, 0, table);
});

async function startSignUp(db = openDatabase(':memory:')) {
  const started = await verification.beginSignUp(db, GOOD, NOW);
  assert.ok(started.ok);
  return { db, token: started.token, mail: started.mail! };
}
const wrongCode = (code: string) => (code === '000000' ? '111111' : '000000');

test('no account exists until the emailed code is right', async () => {
  const { db, token, mail } = await startSignUp();
  assert.match(mail.code, /^\d{6}$/);
  assert.equal(rows(db, 'users').length, 0);
  assert.ok(!JSON.stringify(rows(db, 'email_codes')).includes(token));
  assert.deepEqual(verification.finishSignUp(db, token, wrongCode(mail.code), NOW), { ok: false, error: 'code' });
  const done = verification.finishSignUp(db, token, mail.code, NOW);
  assert.ok(done.ok);
  assert.equal(accounts.emailCheckedAt(db, done.userId), NOW);
  assert.equal(verification.finishSignUp(db, token, mail.code, NOW).ok, false, 'a code works once');
});

test('a code has five tries, then even the right one fails', async () => {
  const { db, token, mail } = await startSignUp();
  for (let i = 0; i < 5; i++) assert.deepEqual(verification.finishSignUp(db, token, wrongCode(mail.code), NOW), { ok: false, error: 'code' });
  assert.deepEqual(verification.finishSignUp(db, token, mail.code, NOW), { ok: false, error: 'tries' });
});

test('a code expires and works only with the cookie that asked', async () => {
  const { db, token, mail } = await startSignUp();
  assert.deepEqual(verification.finishSignUp(db, 'another-token', mail.code, NOW), { ok: false, error: 'expired' });
  assert.deepEqual(verification.finishSignUp(db, token, mail.code, NOW + 15 * 60_000), { ok: false, error: 'expired' });
});

test('a new code replaces the old one, and emails are limited', async () => {
  const { db, token, mail } = await startSignUp();
  const second = verification.resend(db, token, NOW + 1);
  assert.ok(second.ok && second.mail);
  assert.equal(second.token, token);
  if (second.mail.code !== mail.code) assert.equal(verification.finishSignUp(db, token, mail.code, NOW + 2).ok, false);
  assert.ok(verification.resend(db, token, NOW + 3).ok);
  assert.deepEqual(verification.resend(db, token, NOW + 4), { ok: false, error: 'tooMany' });
});

test('signing up with a taken email looks the same and cannot take the account', async () => {
  const { db } = await withUser();
  const { token, mail } = await startSignUp(db);
  assert.equal(mail.kind, 'exists');
  assert.equal(mail.code, '');
  assert.deepEqual(verification.finishSignUp(db, token, '000000', NOW), { ok: false, error: 'code' });
  assert.equal(rows(db, 'users').length, 1);
});

test('a reset never reveals whether the email has an account', async () => {
  const { db } = await withUser();
  const known = verification.beginReset(db, GOOD.email, NOW);
  const unknown = verification.beginReset(db, 'nobody@example.com', NOW);
  assert.ok(known.ok && unknown.ok);
  assert.ok(known.mail && !unknown.mail);
  const pass = 'a brand new password';
  assert.deepEqual(await verification.finishReset(db, known.token, wrongCode(known.mail.code), pass, pass, NOW), { ok: false, error: 'code' });
  assert.deepEqual(await verification.finishReset(db, unknown.token, '123456', pass, pass, NOW), { ok: false, error: 'code' });
  const againKnown = verification.resend(db, known.token, NOW + 1);
  const againUnknown = verification.resend(db, unknown.token, NOW + 1);
  assert.ok(againKnown.ok && againUnknown.ok);
  assert.equal(againKnown.token, known.token);
  assert.equal(againUnknown.token, unknown.token);
});

test('a reset changes the password, keeps the profile and signs out every browser', async () => {
  const { db, id } = await withUser();
  accounts.saveChanges(db, id, [change({ kind: 'profile', patch: { username: 'keep_me', genres: ['jazz'] } })], NOW);
  const session = accounts.createSession(db, id, NOW);
  const started = verification.beginReset(db, GOOD.email, NOW);
  assert.ok(started.ok && started.mail);
  const pass = 'a brand new password';
  assert.deepEqual(await verification.finishReset(db, started.token, started.mail.code, pass, 'not the same one', NOW), { ok: false, error: 'match' });
  assert.ok((await verification.finishReset(db, started.token, started.mail.code, pass, pass, NOW)).ok);
  assert.equal(accounts.userForSession(db, session, NOW), undefined);
  assert.equal((await accounts.logIn(db, GOOD.email, GOOD.password, NOW)).ok, false);
  assert.equal((await accounts.logIn(db, GOOD.email, pass, NOW)).ok, true);
  assert.equal(accounts.accountOf(db, id).profile.username, 'keep_me');
});

test('an email check works only for the person who asked', async () => {
  const { db, id } = await withUser();
  const otherId = await makeUser(db, { ...GOOD, email: 'other@example.com' });
  const row = (userId: string) => db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as accounts.UserRow;
  const started = verification.beginCheck(db, row(id), NOW);
  assert.ok(started.ok && started.mail);
  assert.equal(verification.finishCheck(db, started.token, started.mail.code, row(otherId!), NOW).ok, false);
  assert.ok(verification.finishCheck(db, started.token, started.mail.code, row(id), NOW).ok);
  assert.equal(accounts.emailCheckedAt(db, id), NOW);
});
