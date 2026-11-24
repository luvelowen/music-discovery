/**
 * A music card, and how it travels inside a link.
 *
 * The card sits after the # in the address. Browsers never send that part to the website,
 * so the server that hosts these files cannot see or keep anyone's card.
 *
 * Everything read from a link is treated as hostile: lengths are capped, unknown fields are dropped,
 * and the page only ever shows it as plain text.
 */

export const LIMITS = { name: 24, genres: 5, artists: 10, tracks: 5, text: 80, link: 4000, unpacked: 16000 };

/** Plain text only: no control or invisible formatting characters, single spaces, capped length. */
export function clean(value, max) {
  if (typeof value !== 'string') return '';
  return [...value.normalize('NFC').replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '').replace(/\s+/g, ' ').trim()].slice(0, max).join('').trim();
}

export const emptyCard = () => ({ name: '', genres: [], artists: [], tracks: [], anthem: -1 });

/** "Хурд" and "hurd" are the same favourite. Unknown names get their own id. */
export function toArtist(text, known) {
  const name = clean(text, LIMITS.text);
  if (!name) return null;
  const key = name.toLocaleLowerCase();
  const found = known.find((artist) => artist.name.toLocaleLowerCase() === key || artist.mn?.toLocaleLowerCase() === key);
  return found ? { id: found.id, name: found.name } : { id: `custom:${key}`, name };
}

const trackKey = (track) => `${track.title}\n${track.artist}`.toLocaleLowerCase();

/** Rebuilds a card from untrusted input. Returns null when it isn't a usable card. */
export function sanitize(raw, data) {
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return null;
  const name = clean(raw.n, LIMITS.name);
  if (!name) return null;

  const list = (value) => (Array.isArray(value) ? value.slice(0, 50) : []);
  const genres = [...new Set(list(raw.g).filter((index) => Number.isInteger(index)).map((index) => data.genres[index]).filter(Boolean))].slice(0, LIMITS.genres);

  const artists = [];
  for (const item of list(raw.a)) {
    const artist = Number.isInteger(item) && data.artists[item]
      ? { id: data.artists[item].id, name: data.artists[item].name }
      : toArtist(item, data.artists);
    if (artist && !artists.some((other) => other.id === artist.id)) artists.push(artist);
    if (artists.length === LIMITS.artists) break;
  }

  const tracks = [];
  for (const item of list(raw.t)) {
    if (!Array.isArray(item)) continue;
    const track = { title: clean(item[0], LIMITS.text), artist: clean(item[1], LIMITS.text) };
    if (track.title && !tracks.some((other) => trackKey(other) === trackKey(track))) tracks.push(track);
    if (tracks.length === LIMITS.tracks) break;
  }
  const anthem = Number.isInteger(raw.h) && raw.h >= 0 && raw.h < tracks.length ? raw.h : -1;

  return { name, genres, artists, tracks, anthem };
}

/** The short form that goes into a link: genres and listed artists as numbers. */
export function pack(card, data) {
  return {
    v: 1,
    n: card.name,
    g: card.genres.map((id) => data.genres.indexOf(id)).filter((index) => index >= 0),
    a: card.artists.map((artist) => {
      const index = data.artists.findIndex((known) => known.id === artist.id);
      return index >= 0 ? index : artist.name;
    }),
    t: card.tracks.map((track) => [track.title, track.artist]),
    ...(card.anthem >= 0 ? { h: card.anthem } : {}),
  };
}

const toBase64Url = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (text) => {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(binary, (letter) => letter.charCodeAt(0));
  } catch {
    return null;
  }
};

/** Squeezes bytes through a browser stream, stopping early if the result grows past `max`. */
async function squeeze(bytes, stream, max = Infinity) {
  const reader = new Blob([bytes]).stream().pipeThrough(stream).getReader();
  const parts = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new Error('too big');
    }
    parts.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const canSqueeze = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

/** Card → the text after #/c/. "z" means compressed, "j" means plain, for older browsers. */
export async function encode(card, data) {
  const bytes = new TextEncoder().encode(JSON.stringify(pack(card, data)));
  if (canSqueeze()) {
    try {
      return `z${toBase64Url(await squeeze(bytes, new CompressionStream('deflate-raw')))}`;
    } catch {
      // Fall through to the plain form.
    }
  }
  return `j${toBase64Url(bytes)}`;
}

/** The text after #/c/ → a safe card, or null for anything broken, too big or tampered with. */
export async function decode(text, data) {
  if (typeof text !== 'string' || text.length < 2 || text.length > LIMITS.link) return null;
  const bytes = fromBase64Url(text.slice(1));
  if (!bytes) return null;
  try {
    let json;
    if (text[0] === 'z') {
      if (!canSqueeze()) return null;
      json = await squeeze(bytes, new DecompressionStream('deflate-raw'), LIMITS.unpacked);
    } else if (text[0] === 'j') {
      if (bytes.length > LIMITS.unpacked) return null;
      json = bytes;
    } else {
      return null;
    }
    return sanitize(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(json)), data);
  } catch {
    return null;
  }
}

/** What two cards share. Like the main app, there is no score: just the music itself. */
export function compare(me, them) {
  const mine = new Set(me.tracks.map(trackKey));
  const knows = (id) => me.artists.some((artist) => artist.id === id);
  return {
    genres: them.genres.filter((id) => me.genres.includes(id)),
    artists: them.artists.filter((artist) => knows(artist.id)),
    tracks: them.tracks.filter((track) => mine.has(trackKey(track))),
    newArtists: them.artists.filter((artist) => !knows(artist.id)),
  };
}

export const sharedCount = (result) => result.genres.length + result.artists.length + result.tracks.length;
