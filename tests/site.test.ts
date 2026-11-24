import assert from 'node:assert/strict';
import test from 'node:test';
import { blend, clean, compare, decode, encode, fromFriends, LIMITS, pack, sanitize, sharedCount } from '../site/card.js';
import { DATA } from '../site/data.js';

const card = {
  name: 'Saraa',
  genres: ['rock', 'indie'],
  artists: [{ id: 'the-hu', name: 'The HU' }, { id: 'custom:altan urag', name: 'Altan Urag' }],
  tracks: [{ title: 'Wolf Totem', artist: 'The HU' }, { title: 'Хөх тэнгэр', artist: '' }],
  anthem: 1,
};

const raw = async (text: string) => {
  const bytes = new TextEncoder().encode(text);
  return `j${Buffer.from(bytes).toString('base64url')}`;
};

test('a card survives the trip through a link, compressed and plain', async () => {
  const link = await encode(card, DATA);
  assert.equal(link[0], 'z');
  assert.deepEqual(await decode(link, DATA), card);
  assert.deepEqual(await decode(await raw(JSON.stringify(pack(card, DATA))), DATA), card);
  assert.ok(link.length < 400, `a full card stays short enough for any chat app (${link.length})`);
});

test('the link only ever holds what the card shows', async () => {
  const packed = pack(card, DATA);
  assert.deepEqual(Object.keys(packed).sort(), ['a', 'g', 'h', 'n', 't', 'v']);
  assert.equal(packed.a[0], DATA.artists.findIndex((artist) => artist.id === 'the-hu'), 'listed artists travel as numbers');
});

test('broken, foreign or tampered links are refused', async () => {
  for (const bad of ['', 'z', 'x123', 'z!!!', 'j' + 'A'.repeat(LIMITS.link), await raw('null'), await raw('[]'), await raw('{"v":2,"n":"x"}'), await raw('{"v":1,"n":"   "}'), await raw('{oops')]) {
    assert.equal(await decode(bad, DATA), null, `refused: ${bad.slice(0, 20)}`);
  }
});

test('a compressed bomb is stopped before it fills memory', async () => {
  const huge = new TextEncoder().encode(JSON.stringify({ v: 1, n: 'x', pad: 'a'.repeat(1_000_000) }));
  const reader = new Blob([huge]).stream().pipeThrough(new CompressionStream('deflate-raw')).getReader();
  const parts: Uint8Array[] = [];
  for (let next = await reader.read(); !next.done; next = await reader.read()) parts.push(next.value);
  const link = `z${Buffer.concat(parts).toString('base64url')}`;
  assert.ok(link.length < LIMITS.link, 'small enough to look harmless');
  assert.equal(await decode(link, DATA), null);
});

test('whatever is inside, the card is capped and tidied', () => {
  const messy = sanitize({
    v: 1,
    n: '  <b>Very‮long\u0000 name</b> that goes on and on  ',
    g: [0, 0, 1, 2, 3, 4, 5, 6, 99, -1, 'rock', 1.5],
    a: [...Array.from({ length: 30 }, (_, index) => `Band ${index}`), 0, 0],
    t: [...Array.from({ length: 9 }, (_, index) => [`Song ${index}`, 'x'.repeat(500)]), 'not a song', [42, 42]],
    h: 7,
    extra: 'dropped',
  }, DATA)!;
  assert.equal([...messy.name].length, LIMITS.name);
  assert.ok(!/[‮\u0000]/.test(messy.name), 'no hidden or control characters');
  assert.equal(messy.name.startsWith('<b>'), true, 'kept as plain text, and the page only ever shows it as text');
  assert.deepEqual(messy.genres, DATA.genres.slice(0, LIMITS.genres));
  assert.equal(messy.artists.length, LIMITS.artists);
  assert.equal(messy.tracks.length, LIMITS.tracks);
  assert.equal(messy.tracks[0]!.artist.length, LIMITS.text);
  assert.equal(messy.anthem, -1, 'an anthem pointing at no song is dropped');
  assert.ok(!('extra' in messy));
});

test('"Хурд" and "hurd" count as the same favourite', () => {
  const typed = sanitize({ v: 1, n: 'a', a: ['Хурд', 'hurd', 'HURD'] }, DATA)!;
  assert.deepEqual(typed.artists, [{ id: 'khurd', name: 'Hurd' }]);
});

test('comparing shows what two people share, never a score', () => {
  const friend = {
    name: 'Bat',
    genres: ['indie', 'jazz'],
    artists: [{ id: 'the-hu', name: 'The HU' }, { id: 'nujabes', name: 'Nujabes' }],
    tracks: [{ title: 'wolf totem', artist: 'the hu' }],
    anthem: -1,
  };
  const result = compare(card, friend);
  assert.deepEqual(result.genres, ['indie']);
  assert.deepEqual(result.artists.map((artist: { id: string }) => artist.id), ['the-hu']);
  assert.equal(result.tracks.length, 1, 'songs match whatever the capital letters');
  assert.deepEqual(result.newArtists.map((artist: { id: string }) => artist.id), ['nujabes']);
  assert.equal(sharedCount(result), 3);
  assert.deepEqual(Object.keys(result).sort(), ['artists', 'genres', 'newArtists', 'tracks']);
});

test('text is cleaned the same way everywhere', () => {
  assert.equal(clean('  a \n\t b  ', 10), 'a b');
  assert.equal(clean(42, 10), '');
  assert.equal(clean('Өөрийн дуу', 4), 'Өөри');
});

test('friends suggest the artists I don\'t have yet, most-loved first', () => {
  const me = { ...card, artists: [{ id: 'the-hu', name: 'The HU' }] };
  const friends = [
    { name: 'A', genres: [], artists: [{ id: 'nujabes', name: 'Nujabes' }, { id: 'the-hu', name: 'The HU' }], tracks: [], anthem: -1 },
    { name: 'B', genres: [], artists: [{ id: 'nujabes', name: 'Nujabes' }, { id: 'bts', name: 'BTS' }], tracks: [], anthem: -1 },
  ];
  const found = fromFriends(me, friends);
  assert.deepEqual(found.map((entry: { artist: { id: string } }) => entry.artist.id), ['nujabes', 'bts']);
  assert.deepEqual(found[0].by, ['A', 'B']);
});

test('a group blend shows what everyone shares, then what most share', () => {
  const person = (name: string, genres: string[], artists: string[]) => ({ name, genres, artists: artists.map((id) => ({ id, name: id })), tracks: [], anthem: -1 });
  const result = blend([person('me', ['rock', 'indie', 'jazz'], ['a', 'b']), person('x', ['rock', 'indie'], ['a']), person('y', ['rock', 'jazz'], ['b', 'a'])])!;
  assert.equal(result.size, 3);
  assert.deepEqual(result.genres, ['rock']);
  assert.deepEqual(result.artists.map((artist: { id: string }) => artist.id), ['a']);
  assert.deepEqual(result.mostGenres.map((entry: { item: string; count: number }) => [entry.item, entry.count]), [['indie', 2], ['jazz', 2]]);
  assert.deepEqual(result.mostArtists.map((entry: { item: { id: string } }) => entry.item.id), ['b']);
  assert.equal(blend([person('alone', [], [])]), null);
});
