import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PeopleInput } from '../lib/people/types.ts';
import { EMPTY_PROFILE, type Profile } from '../lib/profile/types.ts';
import { getVisibleProfile } from '../lib/profile/visibility.ts';
import { parseProfile } from '../lib/profile/parse.ts';
import * as accounts from '../lib/server/accounts.ts';
import { exportData } from '../lib/server/export.ts';
import * as moderation from '../lib/server/moderation.ts';
import { applyPeople, discover, getOverview, getPerson, parsePeopleInput } from '../lib/server/people.ts';
import { photoFor, stripJpeg } from '../lib/server/photo.ts';
import { getAgeGroup } from '../lib/social/eligibility.ts';
import { parseSocial } from '../lib/social/parse.ts';
import { DAY, DEFAULT_PRIVACY, EMPTY_SOCIAL } from '../lib/social/types.ts';
import { connect, NOW, PASS, world } from './world.ts';

type DB = ReturnType<typeof world>['db'];
type Simple = Exclude<PeopleInput['kind'], 'report'>;
const go = (db: DB, me: string, kind: Simple, personId: string, now = NOW) => applyPeople(db, me, { kind, personId }, now);
const report = (db: DB, me: string, personId: string, change: object = {}) =>
  applyPeople(db, me, { kind: 'report', personId, id: crypto.randomUUID(), reason: 'spam', details: ' details ', block: false, evidence: false, ...change }, NOW);
const names = (db: DB, me: string, query: object = {}) => discover(db, me, query, NOW).people.map((person) => person.profile.username);
const relation = (db: DB, me: string, them: string) => getPerson(db, me, them, NOW)?.relation ?? null;

test('age: the 18th birthday counts, the day before does not', () => {
  const now = new Date(NOW);
  assert.equal(getAgeGroup(2008, 11, 22, now), 'adult');
  assert.equal(getAgeGroup(2008, 11, 23, now), 'minor');
});

test('age: uses the date in Ulaanbaatar', () => {
  assert.equal(getAgeGroup(2008, 11, 23, new Date('2026-11-22T15:59:00Z')), 'minor');
  assert.equal(getAgeGroup(2008, 11, 23, new Date('2026-11-22T16:01:00Z')), 'adult');
});

test('age: a 29 February birthday turns 18 on 1 March', () => {
  assert.equal(getAgeGroup(2008, 2, 29, new Date('2026-02-28T04:00:00Z')), 'minor');
  assert.equal(getAgeGroup(2008, 2, 29, new Date('2026-03-01T04:00:00Z')), 'adult');
});

test('age: impossible dates are rejected', () => {
  for (const [y, m, d] of [[2005, 2, 30], [2005, 13, 1], [2005, 0, 1], [2030, 1, 1], [1800, 1, 1], [5, 1, 1], [2005.5, 1, 1], [NaN, 1, 1]]) {
    assert.equal(getAgeGroup(y!, m!, d!, new Date(NOW)), null, `${y}-${m}-${d}`);
  }
});

test('the database cannot hold an account that is not an adult', () => {
  const { db, person } = world();
  const id = person('myself');
  assert.throws(() => db.prepare('UPDATE users SET adult = 0 WHERE id = ?').run(id));
});

test('only confirmed, finished, visible people appear, and never me', () => {
  const { db, person } = world();
  const me = person('myself');
  person('shown');
  person('hidden', { privacy: { discoverable: false } });
  person('unconfirmed', { checked: false });
  person('unfinished', { profile: { genres: [] } });
  assert.deepEqual(names(db, me), ['shown']);
});

test('someone unconfirmed sees nobody and can do nothing', () => {
  const { db, person } = world();
  const me = person('myself', { checked: false });
  const them = person('them');
  assert.deepEqual(names(db, me), []);
  assert.equal(getPerson(db, me, them), null);
  assert.deepEqual(go(db, me, 'send', them), { ok: false, error: 'notReady' });
});

test('dating is shown only to people who chose it, and intentions must overlap', () => {
  const { db, person } = world();
  const friends = person('friends');
  const both = person('both', { profile: { seeking: ['friends', 'dating'] } });
  const dater = person('dater', { profile: { seeking: ['dating'] } });
  assert.deepEqual(names(db, friends), ['both']);
  assert.deepEqual(getPerson(db, friends, both)!.profile.seeking, ['friends']);
  assert.equal(getPerson(db, friends, dater), null);
  assert.deepEqual(go(db, friends, 'send', dater), { ok: false, error: 'unavailable' });
  assert.deepEqual(getPerson(db, dater, both)!.profile.seeking, ['friends', 'dating']);
  assert.deepEqual(names(db, friends, { seeking: 'dating' }), [], 'the filter cannot reveal who dates');
});

test('a request and an acceptance connect both people', () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  assert.ok(go(db, a, 'send', b).ok);
  assert.equal(relation(db, a, b), 'outgoing');
  assert.equal(relation(db, b, a), 'incoming');
  assert.deepEqual(getOverview(db, b).incoming.map((seen) => seen.id), [a]);
  assert.ok(go(db, b, 'accept', a).ok);
  assert.equal(relation(db, a, b), 'connected');
  assert.equal(relation(db, b, a), 'connected');
});

test('nobody can accept their own request or one that was never sent', () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  assert.equal(go(db, a, 'accept', b).ok, false);
  go(db, a, 'send', b);
  assert.equal(go(db, a, 'accept', b).ok, false);
  assert.equal(go(db, a, 'send', a).ok, false);
  assert.equal(relation(db, b, a), 'incoming');
});

test('someone hidden can ask, and is seen only by the person they asked', () => {
  const { db, person } = world();
  const quiet = person('quiet', { privacy: { discoverable: false } });
  const [asked, other] = [person('asked'), person('other')];
  go(db, quiet, 'send', asked);
  assert.equal(relation(db, asked, quiet), 'incoming');
  assert.equal(getPerson(db, other, quiet), null);
});

test('declining is silent and cannot be got around', () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  go(db, a, 'send', b);
  go(db, b, 'decline', a);
  assert.equal(relation(db, a, b), 'outgoing', 'the sender still sees "sent"');
  assert.equal(relation(db, b, a), 'none');
  go(db, a, 'cancel', b);
  assert.equal(relation(db, a, b), 'none');
  assert.ok(go(db, a, 'send', b).ok);
  assert.equal(relation(db, a, b), 'outgoing');
  assert.equal(getOverview(db, b).incoming.length, 0, 'asking again never reaches them');
});

test('the person who declined can change their mind', () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  go(db, a, 'send', b);
  go(db, b, 'decline', a);
  assert.ok(go(db, b, 'send', a).ok);
  assert.ok(go(db, a, 'accept', b).ok);
  assert.equal(relation(db, b, a), 'connected');
});

test('request rules are enforced', () => {
  const { db, person } = world();
  const me = person('myself', { profile: { genres: ['classical'] } });
  const picky = person('picky');
  const open = person('open', { privacy: { requests: 'everyone' } });
  const closed = person('closed', { privacy: { requests: 'nobody' }, profile: { genres: ['classical'] } });
  assert.deepEqual(go(db, me, 'send', picky), { ok: false, error: 'needsSharedGenre' });
  assert.ok(go(db, me, 'send', open).ok);
  assert.deepEqual(go(db, me, 'send', closed), { ok: false, error: 'notAccepting' });
});

test('ten requests a day, and cancelling does not refund one', () => {
  const { db, person } = world();
  const me = person('myself');
  for (let i = 0; i < 10; i++) {
    const them = person(`them${i}`);
    go(db, me, 'send', them, NOW + i);
    go(db, me, 'cancel', them, NOW + i);
  }
  const late = person('late');
  assert.deepEqual(go(db, me, 'send', late, NOW + 20), { ok: false, error: 'dailyLimit' });
  assert.ok(go(db, me, 'send', late, NOW + DAY + 20).ok);
});

test('photo, bio and links reach connections only, and the picture is never inside the list', () => {
  const { db, person } = world();
  const [a, b, c] = [person('a_person'), person('b_person', {
    profile: { bio: 'private bio', photo: 'data:image/jpeg;base64,/9j/4AAQ', links: [{ provider: 'instagram', kind: 'profile', url: 'https://www.instagram.com/secret/' }] },
  }), person('c_person')];
  go(db, a, 'send', b);
  for (const viewer of [a, c]) {
    const text = JSON.stringify([getPerson(db, viewer, b), discover(db, viewer), getOverview(db, viewer)]);
    for (const secret of ['private bio', 'base64', 'secret', '/api/photo']) assert.ok(!text.includes(secret), secret);
  }
  go(db, b, 'accept', a);
  const seen = getPerson(db, a, b)!.profile;
  assert.equal(seen.bio, 'private bio');
  assert.match(seen.photo!, /^\/api\/photo\//);
  assert.equal(seen.links.length, 1);
  assert.ok(!JSON.stringify(getOverview(db, a)).includes('base64'));
});

test('nothing about the account leaks with a profile', () => {
  const { db, person } = world();
  const me = person('myself');
  person('them');
  const text = JSON.stringify(discover(db, me));
  for (const secret of ['@example.com', 'scrypt', 'password', 'discoverable', 'showArtists']) assert.ok(!text.includes(secret), secret);
});

test('hidden artists cannot be found by searching or through songs', () => {
  const { db, person } = world();
  const me = person('myself');
  person('secretive', { privacy: { showArtists: false }, profile: { artists: [{ id: 'the-hu', name: 'The HU' }], tracks: [{ title: 'Song', artist: 'The HU' }], anthem: { title: 'Song', artist: 'The HU' } } });
  assert.deepEqual(names(db, me, { search: 'the hu' }), []);
  assert.deepEqual(names(db, me, { search: 'secret' }), ['secretive']);
  assert.ok(!JSON.stringify(discover(db, me)).includes('The HU'));
});

test('filters, counts and order', () => {
  const { db, person } = world();
  const me = person('myself', { profile: { genres: ['rock', 'jazz'], artists: [{ id: 'the-hu', name: 'The HU' }] } });
  person('far', { profile: { genres: ['classical'] } });
  person('near', { profile: { genres: ['rock', 'jazz'], artists: [{ id: 'the-hu', name: 'The HU' }] } });
  assert.deepEqual(names(db, me), ['near', 'far']);
  assert.deepEqual(names(db, me, { genre: 'classical' }), ['far']);
  assert.equal(discover(db, me).counts.classical, 1);
  assert.equal(discover(db, me, { limit: 1 }).total, 2);
});

test('blocking works both ways at once, and unblocking restores nothing', () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  connect(db, a, b);
  assert.ok(go(db, a, 'block', b).ok);
  for (const [me, them] of [[a, b], [b, a]] as const) {
    assert.equal(getPerson(db, me, them), null);
    assert.deepEqual(names(db, me), []);
    assert.equal(getOverview(db, me).connected.length, 0);
    assert.equal(go(db, me, 'send', them).ok, false);
  }
  assert.deepEqual(getOverview(db, a).blocked, [{ id: b, username: 'b_person' }]);
  assert.deepEqual(getOverview(db, b).blocked, [], 'they are not told');
  go(db, b, 'unblock', a);
  assert.equal(getPerson(db, b, a), null, 'only the blocker can unblock');
  go(db, a, 'unblock', b);
  assert.equal(relation(db, a, b), 'none');
});

test('removing ends it for both', () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  connect(db, a, b);
  go(db, b, 'remove', a);
  assert.equal(relation(db, a, b), 'none');
  assert.equal(relation(db, b, a), 'none');
});

test('reports reach the moderator, once, and the reported person is not told', () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  const id = crypto.randomUUID();
  assert.ok(report(db, a, b, { id, reason: 'underage', block: true }).ok);
  assert.ok(report(db, a, b, { id, reason: 'underage' }).ok);
  const open = moderation.openReports(db);
  assert.equal(open.length, 1);
  assert.deepEqual([open[0]!.reported_id, open[0]!.details, open[0]!.evidence], [b, 'details', null]);
  assert.equal(getPerson(db, a, b), null, 'blocked as asked');
  assert.deepEqual(getOverview(db, b).reports, []);
  assert.equal(report(db, b, a, { id }).ok, false, 'an id cannot be reused by someone else');
});

test('nobody can report or block a person they have no way of seeing', () => {
  const { db, person } = world();
  const [a, hidden] = [person('a_person'), person('hidden', { privacy: { discoverable: false } })];
  assert.equal(report(db, a, hidden).ok, false);
  assert.equal(go(db, a, 'block', hidden).ok, false);
});

test('suspension removes someone everywhere until restored', async () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  connect(db, a, b);
  const token = accounts.createSession(db, b, NOW);
  assert.ok(moderation.suspend(db, b, 'spam', NOW));
  assert.equal(getPerson(db, a, b), null);
  assert.deepEqual(names(db, a), []);
  assert.equal(getOverview(db, a).connected.length, 0);
  assert.equal(accounts.userForSession(db, token, NOW), undefined);
  assert.deepEqual(await accounts.logIn(db, 'person2@example.com', PASS, NOW), { ok: false, error: 'suspended' });
  assert.ok(moderation.restore(db, b));
  assert.equal(relation(db, a, b), 'connected');
});

test('deleting an account removes the person and keeps the report about them', async () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person')];
  connect(db, a, b);
  report(db, a, b);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(b) as unknown as accounts.UserRow;
  assert.equal(await accounts.deleteAccount(db, user, PASS, NOW), null);
  assert.equal(getOverview(db, a).connected.length, 0);
  assert.equal(moderation.openReports(db).length, 1);
});

test('photos are served to the owner and connections only', () => {
  const { db, person } = world();
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xda, 0, 2, 1, 2, 0xff, 0xd9]).toString('base64');
  const [a, b, c] = [person('a_person', { profile: { photo: `data:image/jpeg;base64,${jpeg}` } }), person('b_person'), person('c_person')];
  connect(db, a, b);
  assert.ok(photoFor(db, a, a));
  assert.ok(photoFor(db, b, a));
  assert.equal(photoFor(db, c, a), null);
  go(db, b, 'block', a);
  assert.equal(photoFor(db, b, a), null);
});

test('photo details and smuggled data are stripped', () => {
  const gps = [...Buffer.from('GPS-SECRET')];
  const bytes = [0xff, 0xd8, 0xff, 0xe1, 0, gps.length + 2, ...gps, 0xff, 0xfe, 0, 3, 7, 0xff, 0xda, 0, 2, 9, 9, 0xff, 0xd9, ...Buffer.from('HIDDEN')];
  assert.deepEqual([...stripJpeg(Uint8Array.from(bytes))!], [0xff, 0xd8, 0xff, 0xda, 0, 2, 9, 9, 0xff, 0xd9]);
  assert.equal(stripJpeg(Uint8Array.from(Buffer.from('<html>not a picture'))), null);
});

test('a downloaded copy holds only that person’s data and no password', () => {
  const { db, person } = world();
  const [a, b] = [person('a_person'), person('b_person', { profile: { bio: 'their private bio' } })];
  connect(db, a, b);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(a) as unknown as accounts.UserRow;
  const text = JSON.stringify(exportData(db, user));
  assert.ok(text.includes('person1@example.com') && text.includes('b_person'));
  for (const secret of ['person2@example.com', 'their private bio', 'scrypt']) assert.ok(!text.includes(secret), secret);
});

test('profile extras are checked when loaded', () => {
  const parsed = parseProfile(JSON.stringify({
    tracks: [{ title: 'Song', artist: 'Band' }],
    anthem: { title: 'Not mine', artist: 'Band' },
    answers: [{ id: 'neverSkip', text: 'Song' }, { id: 'neverSkip', text: 'again' }, { id: 'fake', text: 'x' }, { id: 'firstConcert', text: 'call 99112233' }],
    moments: ['commute', 'cooking', 'walking', 'driving', 'fake'],
    outings: ['karaoke', 'my house address'],
  }));
  assert.equal(parsed.anthem, null);
  assert.deepEqual(parsed.answers, [{ id: 'neverSkip', text: 'Song' }]);
  assert.equal(parsed.moments.length, 3);
  assert.deepEqual(parsed.outings, ['karaoke']);
});

test('artist and song switches also cover the anthem, for strangers only', () => {
  const profile: Profile = { ...EMPTY_PROFILE, tracks: [{ title: 'Song', artist: 'Band' }], anthem: { title: 'Song', artist: 'Band' } };
  assert.equal(getVisibleProfile(profile, 'stranger', { ...DEFAULT_PRIVACY, showTracks: false }).anthem, null);
  assert.deepEqual(getVisibleProfile(profile, 'stranger', { ...DEFAULT_PRIVACY, showArtists: false }).anthem, { title: 'Song', artist: '' });
  assert.deepEqual(getVisibleProfile(profile, 'connection', { ...DEFAULT_PRIVACY, showTracks: false }), profile);
});

test('damaged social data falls back to the safe defaults', () => {
  for (const raw of [null, '', '{bad', '[]', 'null']) assert.deepEqual(parseSocial(raw), EMPTY_SOCIAL);
  assert.deepEqual(parseSocial('{"privacy":{"discoverable":"yes","requests":"all"}}').privacy, DEFAULT_PRIVACY);
});

test('malformed people requests are refused', () => {
  for (const bad of [null, 4, {}, { kind: 'send' }, { kind: 'admin', personId: 'x' }, { kind: 'report', personId: 'x', id: 'r', reason: 'made-up', details: '', block: false, evidence: false }]) {
    assert.equal(parsePeopleInput(bad), null);
  }
});
