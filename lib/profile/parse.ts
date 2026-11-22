import { toArtist } from '../music/artists.ts';
import { isGenreId } from '../music/genres.ts';
import { PROVIDERS } from '../music/providers.ts';
import { hasContactInfo } from '../safety/contact-info.ts';
import { EMPTY_PROFILE, LIMITS, SEEKING, type Profile, type Seeking } from './types.ts';
import { cleanText } from './validation.ts';

const asRecord = (value: unknown) =>
  (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asText = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '');

/** Saved data can be edited or damaged, so every field is checked again when it is loaded. */
export function parseProfile(raw: string | null): Profile {
  if (!raw) return EMPTY_PROFILE;
  let data: Record<string, unknown>;
  try {
    data = asRecord(JSON.parse(raw));
  } catch {
    return EMPTY_PROFILE;
  }

  const artists = asList(data.artists)
    .map((item) => cleanText(asText(asRecord(item).name, LIMITS.name)))
    .filter((name) => name && !hasContactInfo(name))
    .map(toArtist);

  const tracks = asList(data.tracks)
    .map((item) => ({
      title: cleanText(asText(asRecord(item).title, LIMITS.name)),
      artist: cleanText(asText(asRecord(item).artist, LIMITS.name)),
    }))
    .filter(({ title, artist }) => title && artist && !hasContactInfo(title) && !hasContactInfo(artist));

  const links = asList(data.links).flatMap((item) => {
    const result = PROVIDERS.spotify.parse(asText(asRecord(item).url, 500));
    return result.ok ? [result.link] : [];
  });

  // Profiles saved before dating existed start as friends only. Dating is never switched on for someone.
  const chosen = SEEKING.filter((item) => asList(data.seeking).includes(item));
  const seeking: Seeking[] = chosen.length ? chosen : ['friends'];
  const photo = asText(data.photo, LIMITS.photoDataLength);

  return {
    username: asText(data.username, LIMITS.usernameMax),
    bio: asText(data.bio, LIMITS.bio),
    seeking,
    photo: /^data:image\/jpeg;base64,[A-Za-z\d+/]+=*$/.test(photo) ? photo : null,
    genres: [...new Set(asList(data.genres).filter(isGenreId))].slice(0, LIMITS.genres),
    artists: [...new Map(artists.map((item) => [item.id, item])).values()].slice(0, LIMITS.artists),
    tracks: [...new Map(tracks.map((item) => [`${item.title}\n${item.artist}`, item])).values()].slice(0, LIMITS.tracks),
    links: [...new Map(links.map((item) => [item.url, item])).values()].slice(0, LIMITS.links),
  };
}
