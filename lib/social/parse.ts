import { isGenreId } from '../music/genres.ts';
import { DEFAULT_PRIVACY, EMPTY_SOCIAL, REQUEST_RULES, type Social } from './types.ts';

const asRecord = (value: unknown) =>
  (typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asBoolean = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);

export function parseSocial(raw: string | null): Social {
  if (!raw) return EMPTY_SOCIAL;
  let data: Record<string, unknown>;
  try {
    data = asRecord(JSON.parse(raw));
  } catch {
    return EMPTY_SOCIAL;
  }
  const privacy = asRecord(data.privacy);
  return {
    privacy: {
      discoverable: asBoolean(privacy.discoverable, DEFAULT_PRIVACY.discoverable),
      requests: REQUEST_RULES.find((rule) => rule === privacy.requests) ?? DEFAULT_PRIVACY.requests,
      showArtists: asBoolean(privacy.showArtists, DEFAULT_PRIVACY.showArtists),
      showTracks: asBoolean(privacy.showTracks, DEFAULT_PRIVACY.showTracks),
    },
    communities: [...new Set(asList(data.communities).filter(isGenreId))],
  };
}
