import { toArtist } from '../music/artists.ts';
import { isGenreId } from '../music/genres.ts';
import { parseSavedLink, PROVIDERS, type MusicLink } from '../music/providers.ts';
import { hasContactInfo } from '../safety/contact-info.ts';
import { EMPTY_PROFILE, LIMITS, MOMENTS, OUTINGS, PROMPTS, SEEKING, type Answer, type Profile, type Seeking } from './types.ts';
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

  const allTracks = asList(data.tracks)
    .map((item) => ({
      title: cleanText(asText(asRecord(item).title, LIMITS.name)),
      artist: cleanText(asText(asRecord(item).artist, LIMITS.name)),
    }))
    .filter(({ title, artist }) => title && artist && !hasContactInfo(title) && !hasContactInfo(artist));
  const tracks = [...new Map(allTracks.map((item) => [`${item.title}\n${item.artist}`, item])).values()].slice(0, LIMITS.tracks);
  const favourite = asRecord(data.anthem);
  const anthem = tracks.find((item) => item.title === favourite.title && item.artist === favourite.artist) ?? null;

  const answers: Answer[] = [];
  for (const item of asList(data.answers)) {
    const id = PROMPTS.find((prompt) => prompt === asRecord(item).id);
    const text = cleanText(asText(asRecord(item).text, LIMITS.answer));
    if (id && text && !hasContactInfo(text) && answers.length < LIMITS.answers && !answers.some((answer) => answer.id === id)) answers.push({ id, text });
  }

  const links: MusicLink[] = [];
  for (const item of asList(data.links)) {
    const result = parseSavedLink(asText(asRecord(item).url, 500));
    if (!result.ok || links.some((link) => link.url === result.link.url)) continue;
    if (links.filter((link) => link.provider === result.link.provider).length < PROVIDERS[result.link.provider].max) links.push(result.link);
  }

  // Music and friends only. A saved "dating" choice (before 2026-11-24) is dropped here and gone at the next save.
  const chosen = SEEKING.filter((item) => asList(data.seeking).includes(item));
  const seeking: Seeking[] = chosen.length ? chosen : ['friends'];
  const photo = asText(data.photo, LIMITS.photoDataLength);

  return {
    username: asText(data.username, LIMITS.usernameMax),
    bio: asText(data.bio, LIMITS.bio).replace(/\p{Bidi_Control}/gu, ''),
    seeking,
    photo: /^data:image\/jpeg;base64,[A-Za-z\d+/]+=*$/.test(photo) ? photo : null,
    genres: [...new Set(asList(data.genres).filter(isGenreId))].slice(0, LIMITS.genres),
    artists: [...new Map(artists.map((item) => [item.id, item])).values()].slice(0, LIMITS.artists),
    tracks,
    anthem,
    answers,
    moments: MOMENTS.filter((item) => asList(data.moments).includes(item)).slice(0, LIMITS.moments),
    outings: OUTINGS.filter((item) => asList(data.outings).includes(item)).slice(0, LIMITS.outings),
    links,
  };
}
