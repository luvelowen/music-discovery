import { PEOPLE } from '../demo/people.ts';
import { isGenreId, type GenreId } from '../music/genres.ts';
import { parseProfile } from '../profile/parse.ts';
import type { Profile } from '../profile/types.ts';
import * as act from '../social/actions.ts';
import { parseSocial } from '../social/parse.ts';
import { REPORT_REASONS, SOCIAL_LIMITS, type Privacy, type ReportReason, type Social } from '../social/types.ts';

/*
 * Everything that can change in an account is one of these changes. The screen applies it at once,
 * and the server applies the same rules again before saving, so it never takes the screen's word for it.
 */
export type Account = { profile: Profile; social: Social };

const PERSON_KINDS = ['send', 'cancel', 'accept', 'decline', 'remove', 'block', 'unblock', 'demoAccept', 'demoReceive'] as const;

export type ChangeInput =
  | { kind: 'profile'; patch: Partial<Profile> }
  | { kind: 'privacy'; patch: Partial<Privacy> }
  | { kind: 'community'; genre: GenreId; on: boolean }
  | { kind: 'report'; personId: string; reason: ReportReason; details: string; block: boolean }
  | { kind: (typeof PERSON_KINDS)[number]; personId: string };

/** The id makes a retry harmless: sending the same change twice saves it once. */
export type Change = ChangeInput & { id: string };

const MAX_REPORTS = 100;
const isId = (value: unknown): value is string => typeof value === 'string' && /^[\w-]{1,80}$/.test(value);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Returns null for anything that isn't a change we know. */
export function parseChange(value: unknown): Change | null {
  if (!isObject(value) || !isId(value.id)) return null;
  const { id, kind, patch, personId, genre, on, reason, details, block } = value;

  if (kind === 'profile' && isObject(patch)) return { id, kind, patch: patch as Partial<Profile> };
  if (kind === 'privacy' && isObject(patch)) return { id, kind, patch: patch as Partial<Privacy> };
  if (kind === 'community' && isGenreId(genre) && typeof on === 'boolean') return { id, kind, genre, on };
  if (!isId(personId)) return null;
  if (kind === 'report') {
    const known = REPORT_REASONS.find((item) => item === reason);
    if (!known || typeof details !== 'string' || typeof block !== 'boolean') return null;
    return { id, kind, personId, reason: known, details: details.slice(0, SOCIAL_LIMITS.reportDetails), block };
  }
  const known = PERSON_KINDS.find((item) => item === kind);
  return known ? { id, kind: known, personId } : null;
}

function changeSocial({ profile, social }: Account, change: Change, now: number): Social {
  if (change.kind === 'profile') return social;
  if (change.kind === 'privacy') {
    // parseSocial keeps only known settings with valid values.
    return { ...social, privacy: parseSocial(JSON.stringify({ privacy: { ...social.privacy, ...change.patch } })).privacy };
  }
  if (change.kind === 'community') {
    return social.communities.includes(change.genre) === change.on ? social : act.toggleCommunity(social, change.genre);
  }
  if (change.kind === 'unblock') return act.unblock(social, change.personId);

  const person = PEOPLE.en.find((item) => item.id === change.personId);
  if (!person) return social;

  switch (change.kind) {
    case 'send': return act.sendRequest(social, profile, person, now);
    case 'cancel': return act.cancelRequest(social, person.id);
    case 'accept': return act.acceptRequest(social, person);
    case 'decline': return act.declineRequest(social, person.id);
    case 'remove': return act.removeConnection(social, person.id);
    case 'block': return act.block(social, person.id);
    case 'demoAccept': return act.demoAcceptMyRequest(social, person);
    case 'demoReceive': return act.demoReceiveRequest(social, profile, person);
    case 'report': {
      if (social.reports.some((item) => item.id === change.id)) return social;
      const next = act.report(social, person, change.reason, change.details, now);
      const [newest, ...older] = next.reports;
      const saved = { ...next, reports: [{ ...newest!, id: change.id }, ...older].slice(0, MAX_REPORTS) };
      return change.block ? act.block(saved, person.id) : saved;
    }
  }
}

export function applyChange(account: Account, change: Change, now: number): Account {
  const profile = change.kind === 'profile'
    ? parseProfile(JSON.stringify({ ...account.profile, ...change.patch }))
    : account.profile;
  return { profile, social: changeSocial(account, change, now) };
}
