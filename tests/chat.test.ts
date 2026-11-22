import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanMessage } from '../lib/chat/clean.ts';
import type { ChatInput } from '../lib/chat/types.ts';
import * as accounts from '../lib/server/accounts.ts';
import * as chat from '../lib/server/chat.ts';
import { applyPeople } from '../lib/server/people.ts';
import * as moderation from '../lib/server/moderation.ts';
import { connect, NOW, PASS, world } from './world.ts';

type DB = ReturnType<typeof world>['db'];
const send = (db: DB, from: string, to: string, text = 'hello', now = NOW, id: string = crypto.randomUUID()) =>
  chat.applyChat(db, from, { kind: 'send', personId: to, id, text }, now);
const act = (db: DB, me: string, input: ChatInput) => chat.applyChat(db, me, input, NOW);
const total = (db: DB) => (db.prepare('SELECT COUNT(*) AS count FROM messages').get() as { count: number }).count;
function read(db: DB, me: string, them: string, before?: number) {
  const result = chat.readThread(db, me, them, before);
  assert.ok(result.ok);
  return result;
}
function pair() {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  connect(db, a, b);
  chat.turnOn(db, a, NOW);
  chat.turnOn(db, b, NOW);
  return { db, a, b, person };
}

test('chat needs consent from the sender and from the person receiving', () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  connect(db, a, b);
  assert.deepEqual(send(db, a, b), { ok: false, error: 'consent' });
  assert.deepEqual(chat.readThread(db, a, b), { ok: false, error: 'consent' });
  chat.turnOn(db, a, NOW);
  assert.deepEqual(send(db, a, b), { ok: false, error: 'theyOff' });
  assert.equal(read(db, a, b).theyOn, false);
  assert.equal(total(db), 0);
});

test('only connected people can be messaged', () => {
  const { db, a, person } = pair();
  const [stranger, waiting] = [person('stranger'), person('waiting')];
  chat.turnOn(db, stranger, NOW);
  chat.turnOn(db, waiting, NOW);
  applyPeople(db, a, { kind: 'send', personId: waiting }, NOW);
  for (const them of [stranger, waiting, 'nobody', 'sample-03', a]) assert.deepEqual(send(db, a, them), { ok: false, error: 'notConnected' }, them);
});

test('a message reaches the other person, and nobody else', () => {
  const { db, a, b, person } = pair();
  const c = person('c_person');
  connect(db, c, a);
  chat.turnOn(db, c, NOW);
  assert.ok(send(db, a, b, 'for b only').ok);
  assert.deepEqual(read(db, b, a).messages.map((m) => [m.mine, m.body]), [[false, 'for b only']]);
  assert.equal(read(db, c, a).messages.length, 0);
  assert.deepEqual(chat.readThread(db, c, b), { ok: false, error: 'notConnected' });
  assert.equal(chat.listChats(db, b).chats[0]!.unread, 1);
});

test('removing, blocking or suspending closes it for both at once', () => {
  for (const how of ['remove', 'block', 'suspend'] as const) {
    const { db, a, b } = pair();
    send(db, a, b);
    if (how === 'suspend') moderation.suspend(db, b, 'spam', NOW);
    else applyPeople(db, b, { kind: how, personId: a }, NOW);
    assert.deepEqual(send(db, a, b), { ok: false, error: 'notConnected' }, how);
    assert.deepEqual(chat.readThread(db, a, b), { ok: false, error: 'notConnected' }, how);
    assert.deepEqual(chat.listChats(db, a).chats, [], how);
  }
});

test('messages are tidied, and disguises removed', () => {
  const hidden = String.fromCodePoint(0x202e);
  assert.deepEqual(cleanMessage(`  pay${hidden}me\r\n\r\n\r\n\r\nok  `), { text: 'payme\n\nok' });
  assert.deepEqual(cleanMessage('Сайн уу? Өнөөдөр Үүлэн 🎧'), { text: 'Сайн уу? Өнөөдөр Үүлэн 🎧' });
  for (const empty of ['', '   ', '\n\n', String.fromCodePoint(0x200b)]) assert.deepEqual(cleanMessage(empty), { error: 'empty' });
  assert.deepEqual(cleanMessage('a'.repeat(1001)), { error: 'tooLong' });
});

test('a retried message is saved once', () => {
  const { db, a, b } = pair();
  assert.ok(send(db, a, b, 'hello', NOW, 'same-id').ok);
  assert.ok(send(db, a, b, 'hello', NOW + 1, 'same-id').ok);
  assert.equal(total(db), 1);
});

test('sending is limited by the minute and by the day', () => {
  const { db, a, b } = pair();
  for (let i = 0; i < 20; i++) assert.ok(send(db, a, b).ok);
  assert.deepEqual(send(db, a, b), { ok: false, error: 'tooMany' });
  for (let minute = 1; minute < 25; minute++) for (let i = 0; i < 20; i++) assert.ok(send(db, a, b, 'x', NOW + minute * 61_000).ok);
  assert.deepEqual(send(db, a, b, 'x', NOW + 25 * 61_000), { ok: false, error: 'tooMany' });
});

test('unread counts follow what was read, and cannot be pushed past the newest', () => {
  const { db, a, b } = pair();
  send(db, a, b);
  act(db, b, { kind: 'read', personId: a, seq: 999_999 });
  assert.equal(chat.listChats(db, b).chats[0]!.unread, 0);
  send(db, a, b);
  assert.equal(chat.listChats(db, b).chats[0]!.unread, 1);
});

test('long chats load fifty at a time, in order', () => {
  const { db, a, b } = pair();
  for (let i = 0; i < 70; i++) send(db, a, b, `m${i}`, NOW + i * 4000);
  const newest = read(db, b, a);
  assert.deepEqual([newest.messages.length, newest.messages[0]!.body, newest.more], [50, 'm20', true]);
  const older = read(db, b, a, newest.messages[0]!.seq);
  assert.deepEqual([older.messages.length, older.messages[0]!.body, older.more], [20, 'm0', false]);
});

test('deleting a chat hides it for me, and erases it once both have', () => {
  const { db, a, b } = pair();
  send(db, a, b);
  act(db, a, { kind: 'delete', personId: b });
  assert.equal(read(db, a, b).messages.length, 0);
  assert.equal(read(db, b, a).messages.length, 1, 'the other person keeps their copy');
  act(db, b, { kind: 'delete', personId: a });
  assert.equal(total(db), 0);
});

test('turning chat off erases what I wrote and clears what I received', () => {
  const { db, a, b } = pair();
  send(db, a, b, 'from a');
  send(db, b, a, 'from b');
  act(db, a, { kind: 'off' });
  assert.equal(chat.consentAt(db, a), null);
  assert.deepEqual(read(db, b, a).messages.map((m) => m.body), ['from b']);
  chat.turnOn(db, a, NOW);
  assert.equal(read(db, a, b).messages.length, 0);
});

test('attached evidence is only what the reporter could see, and goes when the report closes', () => {
  const { db, a, b } = pair();
  send(db, b, a, 'cleared earlier');
  act(db, a, { kind: 'delete', personId: b });
  send(db, b, a, 'the bad message');
  applyPeople(db, a, { kind: 'report', personId: b, id: 'report-1', reason: 'harassment', details: '', block: true, evidence: true }, NOW);
  const { evidence, id } = moderation.openReports(db)[0]!;
  assert.ok(evidence!.includes('the bad message') && !evidence!.includes('cleared earlier'));
  moderation.closeReport(db, id);
  assert.equal(moderation.findReport(db, 'report-1')!.evidence, null);
});

test('deleting an account erases its messages', async () => {
  const { db, a, b } = pair();
  send(db, a, b);
  send(db, b, a);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(a) as unknown as accounts.UserRow;
  assert.equal(await accounts.deleteAccount(db, user, PASS, NOW), null);
  assert.equal(total(db), 0);
});

test('malformed chat requests are refused', () => {
  for (const bad of [null, 5, {}, { kind: 'send', personId: 'p', id: 'x' }, { kind: 'read', personId: 'p', seq: 1.5 }, { kind: 'testReply', personId: 'p', id: 'x' }, { kind: 'grant' }]) {
    assert.equal(chat.parseChatInput(bad), null);
  }
});
