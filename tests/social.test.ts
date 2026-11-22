import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PEOPLE } from '../lib/demo/people.ts';
import { GENRE_IDS } from '../lib/music/genres.ts';
import { EMPTY_PROFILE, type Profile } from '../lib/profile/types.ts';
import { checkBio, checkUsername } from '../lib/profile/validation.ts';
import { getVisibleProfile } from '../lib/profile/visibility.ts';
import * as act from '../lib/social/actions.ts';
import { getAgeGroup, isEligible } from '../lib/social/eligibility.ts';
import { parseSocial } from '../lib/social/parse.ts';
import * as policy from '../lib/social/policy.ts';
import { compareMusic } from '../lib/social/shared.ts';
import { DAY, DEFAULT_PRIVACY, EMPTY_SOCIAL, type Person, type Social } from '../lib/social/types.ts';

const NOW = Date.UTC(2026, 10, 22, 4);
const me: Profile = { ...EMPTY_PROFILE, username: 'tester', genres: ['rock', 'jazz'], artists: [{ id: 'the-hu', name: 'The HU' }] };
const adult: Social = { ...EMPTY_SOCIAL, eligibility: { age: 'adult', student: true } };
const open: Social = { ...adult, privacy: { ...DEFAULT_PRIVACY, discoverable: true } };
const person = (change: Partial<Person> = {}): Person => ({
  id: 'p1',
  age: 'adult',
  privacy: { ...DEFAULT_PRIVACY, discoverable: true },
  profile: {
    ...EMPTY_PROFILE, username: 'other', bio: 'private', genres: ['rock'],
    artists: [{ id: 'the-hu', name: 'The HU' }], tracks: [{ title: 'Song', artist: 'Band' }],
  },
  ...change,
});

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

test('eligibility needs both adult and student', () => {
  assert.equal(isEligible({ age: 'adult', student: true }), true);
  for (const bad of [{ age: 'minor', student: true }, { age: 'unknown', student: true }, { age: 'adult', student: false }, { age: 'adult', student: null }] as const) {
    assert.equal(isEligible(bad), false);
  }
});

test('adults and minors can never reach each other, whatever the state says', () => {
  const minor = person({ age: 'minor' });
  const unknown = person({ age: 'unknown' });
  for (const other of [minor, unknown]) {
    for (const relation of ['incoming', 'outgoing', 'connected'] as const) {
      const state: Social = { ...open, relations: { p1: relation } };
      assert.equal(policy.canViewPerson(state, other), false);
      assert.equal(policy.seePerson(state, other), null);
      assert.equal(act.acceptRequest(state, other), state);
      assert.equal(act.demoAcceptMyRequest(state, other), state);
    }
    assert.equal(policy.isInDiscover(open, other), false);
    assert.equal(act.sendRequest(open, me, other, NOW), open);
    assert.equal(policy.canReceiveFrom(open, me, other), false);
  }
  const iAmMinor: Social = { ...open, eligibility: { age: 'minor', student: true } };
  assert.equal(policy.isInDiscover(iAmMinor, person()), false);
  assert.equal(act.sendRequest(iAmMinor, me, person(), NOW), iAmMinor);
});

test('hidden people are not in Discover and cannot be requested', () => {
  const hidden = person({ privacy: DEFAULT_PRIVACY });
  assert.equal(policy.isInDiscover(adult, hidden), false);
  assert.equal(policy.seePerson(adult, hidden), null);
  assert.equal(policy.requestProblem(adult, me, hidden, NOW), 'unavailable');
  assert.equal(policy.seePerson({ ...adult, relations: { p1: 'declined' } }, hidden), null);
  assert.ok(policy.seePerson({ ...adult, relations: { p1: 'connected' } }, hidden));
});

test('request rules are enforced', () => {
  const rule = (requests: 'sharedMusic' | 'everyone' | 'nobody') => person({ privacy: { ...DEFAULT_PRIVACY, discoverable: true, requests } });
  const stranger = { ...me, genres: ['classical' as const] };
  assert.equal(policy.requestProblem(adult, me, rule('sharedMusic'), NOW), null);
  assert.equal(policy.requestProblem(adult, stranger, rule('sharedMusic'), NOW), 'needsSharedGenre');
  assert.equal(policy.requestProblem(adult, stranger, rule('everyone'), NOW), null);
  assert.equal(policy.requestProblem(adult, me, rule('nobody'), NOW), 'notAccepting');
});

test('ten requests a day, and cancelling does not refund one', () => {
  let state = adult;
  for (let i = 0; i < 10; i++) state = act.cancelRequest(act.sendRequest(state, me, person({ id: `p${i}` }), NOW + i), `p${i}`);
  assert.equal(policy.requestProblem(state, me, person({ id: 'late' }), NOW + 20), 'dailyLimit');
  assert.equal(policy.requestProblem(state, me, person({ id: 'late' }), NOW + DAY + 20), null);
});

test('bio appears only after the request is accepted', () => {
  const sent = act.sendRequest(adult, me, person(), NOW);
  assert.equal(policy.seePerson(sent, person())!.bio, '');
  assert.equal(policy.seePerson(act.demoAcceptMyRequest(sent, person()), person())!.bio, 'private');
});

test('incoming requests follow my own privacy settings', () => {
  assert.equal(policy.canReceiveFrom(adult, me, person()), false, 'hidden by default');
  assert.equal(policy.canReceiveFrom(open, me, person()), true);
  assert.equal(policy.canReceiveFrom({ ...open, privacy: { ...open.privacy, requests: 'nobody' } }, me, person()), false);
  assert.equal(policy.canReceiveFrom(open, { ...me, genres: ['classical'] }, person()), false);
});

test('a declined person cannot ask again', () => {
  const declined = act.declineRequest(act.demoReceiveRequest(open, me, person()), 'p1');
  assert.equal(declined.relations.p1, 'declined');
  assert.equal(policy.canReceiveFrom(declined, me, person()), false);
  assert.equal(act.acceptRequest(declined, person()), declined);
});

test('blocking ends everything, and unblocking does not restore it', () => {
  for (const relation of ['incoming', 'outgoing', 'connected'] as const) {
    const blocked = act.block({ ...open, relations: { p1: relation } }, 'p1');
    assert.equal(blocked.relations.p1, undefined);
    assert.equal(policy.seePerson(blocked, person()), null);
    assert.equal(policy.isInDiscover(blocked, person()), false);
    assert.equal(policy.canReceiveFrom(blocked, me, person()), false);
    assert.equal(act.sendRequest(blocked, me, person(), NOW), blocked);
    assert.equal(act.unblock(blocked, 'p1').relations.p1, undefined);
  }
});

test('reports keep a copy of the username and survive a block', () => {
  const state = act.block(act.report(open, person(), 'underage', ' details ', NOW), 'p1');
  assert.deepEqual([state.reports[0]!.username, state.reports[0]!.reason, state.reports[0]!.details], ['other', 'underage', 'details']);
});

test('artist and song switches hide them from strangers only', () => {
  const privacy = { ...DEFAULT_PRIVACY, showArtists: false, showTracks: false };
  const profile = person().profile;
  assert.deepEqual(getVisibleProfile(profile, 'stranger', privacy).artists, []);
  assert.deepEqual(getVisibleProfile(profile, 'stranger', privacy).tracks, []);
  assert.deepEqual(getVisibleProfile(profile, 'connection', privacy), profile);
});

test('hidden artists do not leak through songs', () => {
  const seen = getVisibleProfile(person().profile, 'stranger', { ...DEFAULT_PRIVACY, showArtists: false });
  assert.deepEqual(seen.tracks, [{ title: 'Song', artist: '' }]);
});

test('shared music cannot leak hidden artists', () => {
  const secret = person({ privacy: { ...DEFAULT_PRIVACY, discoverable: true, showArtists: false } });
  assert.deepEqual(compareMusic(me, policy.seePerson(adult, secret)!).artists, []);
});

test('damaged social data falls back to the safe defaults', () => {
  for (const raw of [null, '', '{bad', '[]', 'null']) assert.deepEqual(parseSocial(raw), EMPTY_SOCIAL);
  const state = parseSocial(JSON.stringify({
    eligibility: { age: 'grown-up', student: 'yes' }, privacy: { discoverable: 'yes', requests: 'all' },
    relations: { a: 'connected', b: 'best friend', c: 'connected' }, blocked: ['c'], communities: ['jazz', 'fake'],
    reports: [{ id: 'x', personId: 'a', username: 'a', reason: 'spam', createdAt: 1e20 }],
  }));
  assert.deepEqual(state.eligibility, EMPTY_SOCIAL.eligibility);
  assert.deepEqual(state.privacy, DEFAULT_PRIVACY);
  assert.deepEqual(state.relations, { a: 'connected' });
  assert.deepEqual(state.communities, ['jazz']);
  assert.deepEqual(state.reports, []);
});

test('sample people are valid, adult and cover every genre', () => {
  for (const list of Object.values(PEOPLE)) {
    for (const { profile, age } of list) {
      assert.equal(checkUsername(profile.username), null, profile.username);
      assert.equal(checkBio(profile.bio), null, profile.bio);
      assert.equal(age, 'adult');
      assert.deepEqual([profile.photo, profile.links], [null, []]);
    }
    for (const id of GENRE_IDS) assert.ok(list.some(({ profile }) => profile.genres.includes(id)), id);
  }
});
