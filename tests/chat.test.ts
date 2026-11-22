import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanMessage } from '../lib/chat/clean.ts';
import type { ChatInput } from '../lib/chat/types.ts';
import * as accounts from '../lib/server/accounts.ts';
import * as chat from '../lib/server/chat.ts';
import { openDatabase } from '../lib/server/db.ts';
import { hashPassword } from '../lib/server/password.ts';

const NOW = Date.UTC(2026, 10, 22, 4);
const THEM = 'sample-03';
const HASH = await hashPassword('correct horse battery');
type DB = ReturnType<typeof openDatabase>;

function person(db: DB, email = 'test@example.com', { connected = true, consent = true } = {}) {
  const id = accounts.createUser(db, email, HASH, NOW, NOW)!;
  if (connected) {
    accounts.saveChanges(db, id, [
      { id: crypto.randomUUID(), kind: 'profile', patch: { username: 'tester', genres: ['rock', 'jazz'] } },
      { id: crypto.randomUUID(), kind: 'send', personId: THEM },
      { id: crypto.randomUUID(), kind: 'demoAccept', personId: THEM },
    ], NOW);
  }
  if (consent) chat.turnOn(db, id, NOW);
  return id;
}
function setup(options?: { connected?: boolean; consent?: boolean }) {
  const db = openDatabase(':memory:');
  return { db, me: person(db, undefined, options) };
}
const send = (db: DB, me: string, text = 'hello', personId = THEM, now = NOW, id: string = crypto.randomUUID()) =>
  chat.applyChat(db, me, { kind: 'send', personId, id, text }, 'test reply', now);
const act = (db: DB, me: string, input: ChatInput) => chat.applyChat(db, me, input, 'test reply', NOW);
const total = (db: DB) => (db.prepare('SELECT COUNT(*) AS count FROM messages').get() as { count: number }).count;
function read(db: DB, me: string, before?: number) {
  const result = chat.readThread(db, me, THEM, before);
  assert.ok(result.ok);
  return result;
}

test('chat needs its own consent, for reading and for sending', () => {
  const { db, me } = setup({ consent: false });
  assert.deepEqual(send(db, me), { ok: false, error: 'consent' });
  assert.deepEqual(chat.readThread(db, me, THEM), { ok: false, error: 'consent' });
  assert.deepEqual(chat.listChats(db, me), { consentAt: null, chats: [] });
  assert.equal(total(db), 0);
});

test('only connected people can be messaged', () => {
  const db = openDatabase(':memory:');
  const stranger = person(db, 'stranger@example.com', { connected: false });
  for (const id of [THEM, 'sample-12', 'nobody', stranger]) assert.deepEqual(send(db, stranger, 'hi', id), { ok: false, error: 'notConnected' });
  const waiting = person(db, 'waiting@example.com', { connected: false });
  accounts.saveChanges(db, waiting, [
    { id: 'a', kind: 'profile', patch: { username: 'waiting', genres: ['rock'] } },
    { id: 'b', kind: 'send', personId: THEM },
  ], NOW);
  assert.deepEqual(send(db, waiting), { ok: false, error: 'notConnected' }, 'a request is not a connection');
  assert.equal(total(db), 0);
});

test('one real account cannot message or imitate another', () => {
  const { db, me } = setup();
  const other = person(db, 'other@example.com');
  assert.deepEqual(send(db, me, 'hi', other), { ok: false, error: 'notConnected' });
  assert.deepEqual(act(db, me, { kind: 'testReply', personId: other, id: 'x' }), { ok: false, error: 'notConnected' });
});

test('removing or blocking closes reading and writing at once', () => {
  for (const kind of ['remove', 'block'] as const) {
    const { db, me } = setup();
    assert.ok(send(db, me).ok);
    accounts.saveChanges(db, me, [{ id: 'z', kind, personId: THEM }], NOW);
    assert.deepEqual(send(db, me), { ok: false, error: 'notConnected' }, kind);
    assert.deepEqual(chat.readThread(db, me, THEM), { ok: false, error: 'notConnected' }, kind);
    assert.deepEqual(chat.listChats(db, me).chats, [], kind);
  }
});

test('two accounts with the same connection never see each other’s messages', () => {
  const { db, me } = setup();
  const other = person(db, 'other@example.com');
  send(db, me, 'mine only');
  act(db, me, { kind: 'testReply', personId: THEM, id: 'same' });
  assert.equal(read(db, other).messages.length, 0);
  assert.equal(chat.listChats(db, other).chats[0]!.unread, 0);
  act(db, other, { kind: 'delete', personId: THEM });
  assert.equal(read(db, me).messages.length, 2, 'deleting theirs leaves mine');
});

test('messages are tidied, and disguises removed', () => {
  const hidden = String.fromCodePoint(0x202e);
  assert.deepEqual(cleanMessage(`  pay${hidden}me\r\n\r\n\r\n\r\nok  `), { text: 'payme\n\nok' });
  assert.deepEqual(cleanMessage('Сайн уу? Өнөөдөр Үүлэн 🎧'), { text: 'Сайн уу? Өнөөдөр Үүлэн 🎧' });
  for (const empty of ['', '   ', '\n\n', String.fromCodePoint(0x200b)]) assert.deepEqual(cleanMessage(empty), { error: 'empty' });
  assert.ok('text' in cleanMessage('🎧'.repeat(1000)));
  assert.deepEqual(cleanMessage('a'.repeat(1001)), { error: 'tooLong' });
});

test('a retried message is saved once', () => {
  const { db, me } = setup();
  assert.ok(send(db, me, 'hello', THEM, NOW, 'same-id').ok);
  assert.ok(send(db, me, 'hello', THEM, NOW + 1, 'same-id').ok);
  assert.equal(total(db), 1);
});

test('sending is limited by the minute and by the day', () => {
  const { db, me } = setup();
  for (let i = 0; i < 20; i++) assert.ok(send(db, me).ok);
  assert.deepEqual(send(db, me), { ok: false, error: 'tooMany' });
  for (let minute = 1; minute < 25; minute++) for (let i = 0; i < 20; i++) assert.ok(send(db, me, 'x', THEM, NOW + minute * 61_000).ok);
  assert.deepEqual(send(db, me, 'x', THEM, NOW + 25 * 61_000), { ok: false, error: 'tooMany' });
});

test('unread counts follow what was read, and cannot be pushed past the newest', () => {
  const { db, me } = setup();
  act(db, me, { kind: 'testReply', personId: THEM, id: 'r1' });
  assert.equal(chat.listChats(db, me).chats[0]!.unread, 1);
  act(db, me, { kind: 'read', personId: THEM, seq: 999_999 });
  assert.equal(chat.listChats(db, me).chats[0]!.unread, 0);
  act(db, me, { kind: 'testReply', personId: THEM, id: 'r2' });
  assert.equal(chat.listChats(db, me).chats[0]!.unread, 1);
});

test('long chats load fifty at a time, in order', () => {
  const { db, me } = setup();
  for (let i = 0; i < 70; i++) send(db, me, `m${i}`, THEM, NOW + i * 4000);
  const newest = read(db, me);
  assert.deepEqual([newest.messages.length, newest.messages[0]!.body, newest.messages[49]!.body, newest.more], [50, 'm20', 'm69', true]);
  const older = read(db, me, newest.messages[0]!.seq);
  assert.deepEqual([older.messages.length, older.messages[0]!.body, older.more], [20, 'm0', false]);
});

test('turning chat off withdraws consent and erases only that person’s messages', () => {
  const { db, me } = setup();
  const other = person(db, 'other@example.com');
  send(db, me);
  send(db, other);
  act(db, me, { kind: 'testReply', personId: THEM, id: 'r' });
  act(db, me, { kind: 'off' });
  assert.equal(chat.consentAt(db, me), null);
  assert.equal(total(db), 1);
});

test('deleting an account erases its messages', async () => {
  const { db, me } = setup();
  send(db, me);
  act(db, me, { kind: 'testReply', personId: THEM, id: 'r' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(me) as unknown as accounts.UserRow;
  assert.equal(await accounts.deleteAccount(db, user, 'correct horse battery', NOW), null);
  for (const table of ['messages', 'chat_reads', 'chat_consents']) assert.equal((db.prepare(`SELECT * FROM ${table}`).all()).length, 0, table);
});

test('malformed chat requests are refused', () => {
  for (const bad of [null, 5, {}, { kind: 'send', personId: THEM, id: 'x' }, { kind: 'read', personId: THEM, seq: 1.5 }, { kind: 'delete', personId: 'a b' }, { kind: 'grant' }]) {
    assert.equal(chat.parseChatInput(bad), null);
  }
});
