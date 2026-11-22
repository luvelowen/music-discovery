import { isGenreId, type GenreId } from '../music/genres.ts';
import { parseProfile } from '../profile/parse.ts';
import type { Profile } from '../profile/types.ts';
import { checkBio, checkUsername } from '../profile/validation.ts';
import { parseSocial } from '../social/parse.ts';
import type { Privacy, Social } from '../social/types.ts';

/*
 * What people change about their own account. The screen applies it at once, and the server applies
 * the same rules again before saving. Anything between two people is in lib/server/people.ts instead.
 */
export type Account = { profile: Profile; social: Social };

export type ChangeInput =
  | { kind: 'profile'; patch: Partial<Profile> }
  | { kind: 'privacy'; patch: Partial<Privacy> }
  | { kind: 'community'; genre: GenreId; on: boolean };

/** The id makes each change traceable while it waits to be saved. */
export type Change = ChangeInput & { id: string };

const isId = (value: unknown): value is string => typeof value === 'string' && /^[\w-]{1,80}$/.test(value);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Returns null for anything that isn't a change we know. */
export function parseChange(value: unknown): Change | null {
  if (!isObject(value) || !isId(value.id)) return null;
  const { id, kind, patch, genre, on } = value;
  if (kind === 'profile' && isObject(patch)) return { id, kind, patch: patch as Partial<Profile> };
  if (kind === 'privacy' && isObject(patch)) return { id, kind, patch: patch as Partial<Privacy> };
  if (kind === 'community' && isGenreId(genre) && typeof on === 'boolean') return { id, kind, genre, on };
  return null;
}

export function applyChange(account: Account, change: Change): Account {
  const { profile, social } = account;
  switch (change.kind) {
    case 'profile': {
      const next = parseProfile(JSON.stringify({ ...profile, ...change.patch }));
      // Other people read these, so an unsafe one is never saved, whatever the screen sent.
      if (next.username !== profile.username && next.username && checkUsername(next.username)) next.username = profile.username;
      if (next.bio !== profile.bio && checkBio(next.bio)) next.bio = profile.bio;
      return { profile: next, social };
    }
    case 'privacy': {
      const { privacy } = parseSocial(JSON.stringify({ privacy: { ...social.privacy, ...change.patch } }));
      return { profile, social: { ...social, privacy } };
    }
    case 'community': {
      if (social.communities.includes(change.genre) === change.on) return account;
      const communities = change.on ? [...social.communities, change.genre] : social.communities.filter((id) => id !== change.genre);
      return { profile, social: { ...social, communities } };
    }
  }
}
