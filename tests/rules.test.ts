import assert from 'node:assert/strict';
import { test } from 'node:test';
import { en } from '../lib/i18n/en.ts';
import { mn } from '../lib/i18n/mn.ts';
import { suggestArtists, toArtist } from '../lib/music/artists.ts';
import { parseSpotifyUrl } from '../lib/music/spotify.ts';
import { parseProfile } from '../lib/profile/parse.ts';
import { EMPTY_PROFILE, type Profile } from '../lib/profile/types.ts';
import { checkUsername, cleanText, isComplete } from '../lib/profile/validation.ts';
import { getVisibleProfile } from '../lib/profile/visibility.ts';
import { hasContactInfo } from '../lib/safety/contact-info.ts';

const PLAYLIST = '37i9dQZF1DXcBWIGoYBM5M';

test('Spotify: accepts profiles and playlists and removes tracking', () => {
  for (const input of [
    `https://open.spotify.com/playlist/${PLAYLIST}?si=abc`,
    `open.spotify.com/playlist/${PLAYLIST}`,
    `https://open.spotify.com/intl-de/playlist/${PLAYLIST}/`,
  ]) {
    const result = parseSpotifyUrl(input);
    assert.ok(result.ok, input);
    assert.equal(result.link.url, `https://open.spotify.com/playlist/${PLAYLIST}`);
  }
  const user = parseSpotifyUrl('https://open.spotify.com/user/some.user_1?si=xyz');
  assert.ok(user.ok);
  assert.equal(user.link.url, 'https://open.spotify.com/user/some.user_1');
});

test('Spotify: rejects look-alike, unsafe and malformed links', () => {
  for (const input of [
    '', 'hello world', 'javascript:alert(1)', 'data:text/html,hi',
    `http://open.spotify.com/playlist/${PLAYLIST}`,
    `https://open.spotify.com.evil.com/playlist/${PLAYLIST}`,
    `https://evil.com@open.spotify.com/playlist/${PLAYLIST}`,
    `https://open.spotify.com@evil.com/playlist/${PLAYLIST}`,
    `https://open.spotify.com:8080/playlist/${PLAYLIST}`,
    'https://open.spotify.com/playlist/short',
    'https://open.spotify.com/user/name/extra',
  ]) assert.equal(parseSpotifyUrl(input).ok, false, input);

  assert.deepEqual(parseSpotifyUrl('https://spotify.link/abc'), { ok: false, error: 'shortLink' });
  assert.deepEqual(parseSpotifyUrl(`https://open.spotify.com/track/${PLAYLIST}`), { ok: false, error: 'wrongKind' });
});

test('contact details are caught', () => {
  for (const text of ['99112233', 'утас 9911-2233', '+976 99 11 22 33', '９９１１２２３３', 'a@mail.com', 'ig @bold_ub', 't.me/bold', 'bold.mn', 'https://x.y'])
    assert.ok(hasContactInfo(text), text);
});

test('ordinary music text is not mistaken for contact details', () => {
  for (const text of ['blink-182', 'will.i.am', '2008-2012 pop', 'The 1975', '867-5309', 'Panic! At The Disco', 'Mr. Brightside', 'Уртын дуунд дуртай'])
    assert.ok(!hasContactInfo(text), text);
});

test('usernames work in Mongolian and reject unsafe ones', () => {
  for (const name of ['өглөө', 'Үүлэн_01', 'bass.kid']) assert.equal(checkUsername(name), null, name);
  assert.equal(checkUsername('ab'), 'usernameLength');
  assert.equal(checkUsername('two words'), 'usernameCharacters');
  assert.equal(checkUsername('bold99112233'), 'contactInfo');
  assert.equal(cleanText('  a \u202E b\n c '), 'a b c');
});

test('strangers never receive photo, bio or links', () => {
  const profile: Profile = {
    ...EMPTY_PROFILE, username: 'өглөө', bio: 'private bio', photo: 'data:image/jpeg;base64,AAAA', genres: ['jazz'],
    links: [{ provider: 'spotify', kind: 'profile', url: 'https://open.spotify.com/user/a' }],
  };
  const seen = getVisibleProfile({ ...profile, futureField: 'secret' } as Profile, 'stranger');
  assert.equal(seen.bio, '');
  assert.equal(seen.photo, null);
  assert.deepEqual(seen.links, []);
  assert.ok(!('futureField' in seen));
  assert.deepEqual(getVisibleProfile(profile, 'connection'), profile);
});

test('damaged or edited saved data cannot get in', () => {
  for (const raw of [null, '', '{oops', 'null', '[]', '42']) assert.deepEqual(parseProfile(raw), EMPTY_PROFILE);
  const parsed = parseProfile(JSON.stringify({
    genres: ['jazz', 'jazz', 'fake', 'rock', 'pop', 'metal', 'lofi', 'indie'],
    artists: [{ name: 'Хурд' }, { name: 'hurd' }, { name: '99112233' }],
    links: [{ url: 'javascript:alert(1)' }],
    photo: 'https://tracker.example/pixel.png',
  }));
  assert.deepEqual(parsed.genres, ['jazz', 'rock', 'pop', 'metal', 'lofi']);
  assert.deepEqual(parsed.artists, [{ id: 'khurd', name: 'Hurd' }]);
  assert.deepEqual(parsed.links, []);
  assert.equal(parsed.photo, null);
});

test('removed genres disappear from saved profiles, and dating is never switched on for anyone', () => {
  const old = parseProfile(JSON.stringify({ genres: ['morinKhuur', 'longSong', 'throatSinging', 'ethnoFusion', 'composedSongs', 'jazz'] }));
  assert.deepEqual(old.genres, ['jazz']);
  assert.deepEqual(old.seeking, ['friends']);
  assert.deepEqual(parseProfile('{"seeking":["hookups"]}').seeking, ['friends']);
  assert.deepEqual(parseProfile('{"seeking":["dating"]}').seeking, ['dating']);
});

test('a profile needs a genre and a valid username', () => {
  assert.equal(isComplete(EMPTY_PROFILE), false);
  assert.equal(isComplete({ ...EMPTY_PROFILE, genres: ['jazz'] }), false);
  assert.equal(isComplete({ ...EMPTY_PROFILE, genres: ['jazz'], username: 'өглөө' }), true);
});

test('artists match in both alphabets', () => {
  assert.equal(toArtist('хурд').id, toArtist('HURD').id);
  assert.equal(suggestArtists('харан', [], [])[0]?.id, 'kharanga');
});

test('every text exists in both languages', () => {
  const walk = (a: unknown, b: unknown, path: string): void => {
    assert.equal(typeof b, typeof a, path);
    if (typeof a === 'string') assert.ok((b as string).trim(), path);
    if (typeof a === 'object' && a !== null) {
      assert.deepEqual(Object.keys(b as object), Object.keys(a), path);
      for (const [key, value] of Object.entries(a)) walk(value, (b as Record<string, unknown>)[key], `${path}.${key}`);
    }
  };
  walk(en, mn, 'dictionary');
});
