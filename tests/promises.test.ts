// What the privacy notice and the moderator's instructions promise.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { shownMark } from '../lib/consent/text.ts';
import * as accounts from '../lib/server/accounts.ts';
import * as chat from '../lib/server/chat.ts';
import { cleanUp } from '../lib/server/cleanup.ts';
import { consentHistory } from '../lib/server/consent.ts';
import { openDatabase } from '../lib/server/db.ts';
import { exportData } from '../lib/server/export.ts';
import * as moderation from '../lib/server/moderation.ts';
import { applyPeople, discover, getOverview, getPerson } from '../lib/server/people.ts';
import * as verification from '../lib/server/verification.ts';
import { DAY } from '../lib/social/types.ts';
import { connect, NOW, PASS, world } from './world.ts';

type DB = ReturnType<typeof world>['db'];
const userOf = (db: DB, id: string) => db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as accounts.UserRow;
const rename = (db: DB, id: string, username: string) => accounts.saveChanges(db, id, [{ id: 'n', kind: 'profile', patch: { username } }], NOW);
const seek = (db: DB, id: string, seeking: string[]) => accounts.saveChanges(db, id, [{ id: 's', kind: 'profile', patch: { seeking: seeking as never } }], NOW);
const report = (db: DB, me: string, personId: string, change: object = {}) =>
  applyPeople(db, me, { kind: 'report', personId, id: crypto.randomUUID(), reason: 'underage', details: '', block: false, evidence: true, ...change }, NOW);
const write = (db: DB, from: string, to: string, text: string) => chat.applyChat(db, from, { kind: 'send', personId: to, id: crypto.randomUUID(), text }, NOW);

function talking() {
  const { db, person } = world();
  const [a, b] = [person('reporter_name'), person('other_name')];
  connect(db, a, b);
  chat.turnOn(db, a, NOW);
  chat.turnOn(db, b, NOW);
  write(db, b, a, 'words from the other person');
  return { db, a, b, person };
}

test('moderator command: suspend keeps evidence, and closing it away takes a second word', () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'moderate-'));
  try {
    const file = path.join(folder, 'test.db');
    const db = openDatabase(file);
    const id = accounts.createUser(db, 'someone@example.com', 'scrypt:x', NOW, NOW)!;
    db.prepare("INSERT INTO reports VALUES ('abcdef12-test', NULL, ?, '', 'underage', '', ?, ?, 'received')")
      .run(id, JSON.stringify([{ from: 'reported', text: 'made-up evidence', at: NOW }]), NOW);
    const run = (...args: string[]) => spawnSync(process.execPath, ['scripts/moderate.ts', ...args], { env: { ...process.env, APP_DB_PATH: file }, encoding: 'utf8' });
    const saved = () => moderation.findReport(db, 'abcdef12')!;

    const suspended = run('suspend', 'abcdef12');
    assert.equal(suspended.status, 0);
    assert.match(suspended.stdout, /still open/);
    assert.match(suspended.stdout, /not reporting/);
    assert.ok(moderation.isSuspended(db, id));
    assert.deepEqual([saved().status, Boolean(saved().evidence)], ['received', true]);
    assert.match(run().stdout, /messages attached.*suspended/);

    assert.equal(run('close', 'abcdef12').status, 1);
    assert.ok(saved().evidence, 'a plain close erases nothing');
    assert.equal(run('close', 'abcdef12', 'erase').status, 0);
    assert.deepEqual([saved().status, saved().evidence], ['closed', null]);
    db.close();
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('attached messages outlive withdrawal and deletion until the report closes, as the notice says', async () => {
  const { db, a, b } = talking();
  assert.ok(report(db, a, b).ok);
  chat.turnOff(db, b, NOW);
  assert.equal(await accounts.deleteAccount(db, userOf(db, b), PASS, NOW), null);
  assert.match(moderation.openReports(db)[0]!.evidence!, /words from the other person/);
});

test('someone I blocked can still be reported, even if they never wrote', () => {
  const { db, person } = world();
  const [a, b, c] = [person('a_person'), person('b_person'), person('c_person')];
  applyPeople(db, a, { kind: 'block', personId: b }, NOW);
  assert.ok(report(db, a, b).ok);
  assert.equal(moderation.openReports(db)[0]!.reported_name, 'b_person');
  applyPeople(db, b, { kind: 'block', personId: c }, NOW);
  assert.equal(report(db, c, b).ok, false, 'being blocked is not a way to report, or to detect a block');
});

test('blocked by them after they wrote: still reportable, but their new name stays secret', () => {
  const { db, a, b } = talking();
  applyPeople(db, b, { kind: 'block', personId: a }, NOW);
  rename(db, b, 'new_secret_name');
  const [past] = getOverview(db, a, NOW).pastChats;
  assert.deepEqual([past!.id, past!.last, past!.chatted], [b, 'words from the other person', true]);
  assert.ok(report(db, a, b, { block: true }).ok);
  const seen = JSON.stringify([getOverview(db, a, NOW), getPerson(db, a, b, NOW), exportData(db, userOf(db, a))]);
  assert.ok(!seen.includes('new_secret_name'));
  assert.equal(moderation.nameNow(db, b), 'new_secret_name', 'the moderator can still find them');
});

test('a closed chat looks the same whether they removed, blocked or were suspended', () => {
  const looks = (['remove', 'block', 'suspend'] as const).map((how) => {
    const { db, a, b } = talking();
    if (how === 'suspend') moderation.suspend(db, b, 'spam', NOW);
    else applyPeople(db, b, { kind: how, personId: a }, NOW);
    const { pastChats, connected } = getOverview(db, a, NOW);
    return [pastChats.map(({ id: _, ...rest }) => rest), connected.length];
  });
  assert.deepEqual(looks[1], looks[0]);
  assert.deepEqual(looks[2], looks[0]);
});

test('accounts saved with dating before it was removed read as friends and stay listed', () => {
  const { db, person } = world();
  const me = person('me_friend');
  const ids = [person('adds_dating'), person('only_dating')];
  ids.forEach((id) => connect(db, me, id));
  // Saved data as it looked before 2026-11-24, written straight into the database.
  const old = db.prepare("UPDATE users SET profile = json_set(profile, '$.seeking', json(?)) WHERE id = ?");
  old.run('["friends","dating"]', ids[0]!);
  old.run('["dating"]', ids[1]!);

  for (const id of ids) assert.deepEqual(getPerson(db, me, id, NOW)!.profile.seeking, []);
  assert.equal(discover(db, me, {}, NOW).total, 2, 'nobody drops out of the list');
  for (const id of ids) assert.deepEqual(accounts.accountOf(db, id).profile.seeking, ['friends']);
  // Dating can't be saved again, even by a forged request.
  seek(db, me, ['dating']);
  assert.deepEqual(accounts.accountOf(db, me).profile.seeking, ['friends']);
  for (const item of exportData(db, userOf(db, me)).connections) assert.deepEqual(Object.keys(item), ['id', 'username', 'at']);
});

test('declining is silent: no reordering, and nothing in the download', () => {
  const { db, person } = world();
  const [me, first, second] = [person('me_sender'), person('first_one'), person('second_one')];
  applyPeople(db, me, { kind: 'send', personId: first }, NOW);
  applyPeople(db, me, { kind: 'send', personId: second }, NOW + 1000);
  const before = JSON.stringify([getOverview(db, me, NOW), exportData(db, userOf(db, me))]);
  applyPeople(db, first, { kind: 'decline', personId: me }, NOW + 9000);
  assert.equal(JSON.stringify([getOverview(db, me, NOW), exportData(db, userOf(db, me))]), before);
});

test('the download has what is stored, and says what it leaves out', () => {
  const { db, a, b, person } = talking();
  write(db, a, b, 'my own cleared words');
  chat.applyChat(db, a, { kind: 'delete', personId: b }, NOW);
  const asking = person('asking_person');
  applyPeople(db, asking, { kind: 'send', personId: a }, NOW);
  applyPeople(db, a, { kind: 'decline', personId: asking }, NOW);
  accounts.createSession(db, a, NOW);
  report(db, b, a, { reason: 'spam', id: 'secret-report-id' });

  const file = exportData(db, userOf(db, a));
  const text = JSON.stringify(file);
  assert.deepEqual(file.requestsReceived.map((item) => [item.id, item.state]), [[asking, 'declined by you']]);
  assert.equal(file.logIns.length, 1);
  assert.equal(file.consents.length, 1);
  assert.ok(file.messages.some((message) => message.body === 'my own cleared words' && message.clearedByYou));
  assert.equal(file.clearedMessagesFromOthers, 1);
  assert.ok(file.notIncluded.en.length && file.notIncluded.mn.length === file.notIncluded.en.length);
  for (const secret of ['words from the other person', 'secret-report-id', 'scrypt', 'person2@example.com', 'token_hash']) assert.ok(!text.includes(secret), secret);
});

test('an unconfirmed account still downloads its connections', () => {
  const { db, a, b } = talking();
  db.prepare('DELETE FROM email_checks WHERE user_id = ?').run(a);
  assert.deepEqual(exportData(db, userOf(db, a)).connections.map((item) => item.id), [b]);
});

test('a suspended session opens their download and nothing else', () => {
  const { db, a, b } = talking();
  moderation.suspend(db, a, 'spam', NOW);
  const token = accounts.createSession(db, a, NOW);
  assert.equal(accounts.userForSession(db, token, NOW), undefined);
  const held = accounts.suspendedForSession(db, token, NOW)!;
  assert.equal(held.id, a);
  const file = exportData(db, held);
  assert.deepEqual(file.connections, [{ id: b, username: null, at: NOW }]);
  assert.ok(file.account.suspension);
  assert.equal(write(db, a, b, 'still here').ok, false);
  assert.equal(applyPeople(db, a, { kind: 'block', personId: b }, NOW).ok, false);

  const normal = accounts.createSession(db, b, NOW);
  assert.equal(accounts.suspendedForSession(db, normal, NOW), undefined);
});

test('chat consent saves the words shown, and withdrawal keeps the proof', () => {
  const { db, person } = world();
  const me = person('me_person');
  const agree = (mark: string) => chat.applyChat(db, me, { kind: 'consent', shown: { locale: 'mn', mark } }, NOW);
  assert.deepEqual(agree('old'), { ok: false, error: 'changed' });
  assert.equal(chat.consentAt(db, me), null);
  assert.ok(agree(shownMark('chat', 'mn')).ok);
  chat.applyChat(db, me, { kind: 'off' }, NOW + 1000);
  const history = consentHistory(db, me);
  assert.deepEqual(history.map((event) => [event.action, event.at]), [['agreed', NOW], ['withdrawn', NOW + 1000]]);
  assert.match(JSON.stringify(history[0]!.text), /Чат асаах уу/);
  assert.equal(chat.parseChatInput({ kind: 'consent' }), null);
});

test('an agreement from before this update keeps its time, and invents no wording', () => {
  const { db, person } = world();
  const me = person('older_account');
  db.prepare('INSERT INTO chat_consents VALUES (?, ?)').run(me, NOW);
  chat.turnOff(db, me, NOW + 1000);
  assert.deepEqual(consentHistory(db, me).map((event) => [event.action, event.at, event.text]), [['agreed', NOW, null], ['withdrawn', NOW + 1000, null]]);
});

test('sign-up saves the words in the language shown, and refuses outdated ones', async () => {
  const db = openDatabase(':memory:');
  const form = { email: 'new@example.com', password: PASS, again: PASS, year: 2000, month: 1, day: 1, consent: true };
  assert.deepEqual(await verification.beginSignUp(db, { ...form, shown: { locale: 'en', mark: 'old' } }, NOW), { ok: false, error: 'changed' });
  const started = await verification.beginSignUp(db, { ...form, shown: { locale: 'en', mark: shownMark('signup', 'en') } }, NOW);
  assert.ok(started.ok);
  const done = verification.finishSignUp(db, started.token, started.mail!.code, NOW + 5000);
  assert.ok(done.ok);
  const [event] = consentHistory(db, done.userId);
  assert.deepEqual([event!.kind, event!.locale, event!.at], ['signup', 'en', NOW]);
  assert.match(JSON.stringify(event!.text), /I agree that my email/);
});

test('deleting the account takes its consent history', async () => {
  const { db, a } = talking();
  assert.equal(await accounts.deleteAccount(db, userOf(db, a), PASS, NOW), null);
  assert.equal(consentHistory(db, a).length, 0);
});

test('cleanup removes what expired and touches nothing that has not', async () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  applyPeople(db, a, { kind: 'send', personId: b }, NOW - 2 * DAY);
  accounts.createSession(db, a, NOW - 40 * DAY);
  accounts.createSession(db, b, NOW);
  const start = (email: string, at: number) =>
    verification.beginSignUp(db, { email, password: PASS, again: PASS, year: 2000, month: 1, day: 1, consent: true, shown: { locale: 'mn', mark: shownMark('signup', 'mn') } }, at);
  await start('old@example.com', NOW - 2 * DAY);
  await start('fresh@example.com', NOW);

  cleanUp(db, NOW);
  const count = (table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
  assert.deepEqual(['users', 'requests', 'sessions', 'request_log', 'email_codes', 'code_consents'].map(count), [2, 1, 1, 0, 1, 1]);
});
