import type { Profile } from '../profile/types.ts';
import { getVisibleProfile } from '../profile/visibility.ts';
import { isEligible } from './eligibility.ts';
import { DAY, SOCIAL_LIMITS, type Person, type Social } from './types.ts';

/*
 * Every "is this allowed?" question is answered in this file.
 * Screens and actions both ask here, and the Supabase database rules must match it.
 */

/** The wall that everything else stands behind: both eligible adults, and no block. */
export function canInteract(social: Social, person: Person) {
  return isEligible(social.eligibility) && person.age === 'adult' && !social.blocked.includes(person.id);
}

export function isInDiscover(social: Social, person: Person) {
  return canInteract(social, person) && person.privacy.discoverable;
}

export function canViewPerson(social: Social, person: Person) {
  if (!canInteract(social, person)) return false;
  const relation = social.relations[person.id];
  return person.privacy.discoverable || relation === 'incoming' || relation === 'outgoing' || relation === 'connected';
}

/** What I may see of someone. Always use this instead of person.profile. */
export function seePerson(social: Social, person: Person): Profile | null {
  if (!canViewPerson(social, person)) return null;
  const viewer = social.relations[person.id] === 'connected' ? 'connection' : 'stranger';
  return getVisibleProfile(person.profile, viewer, person.privacy);
}

// Genres only. They are always visible, so this rule can't reveal someone's hidden artists or songs.
export function sharesGenre(a: Profile, b: Profile) {
  return a.genres.some((genre) => b.genres.includes(genre));
}

export type RequestProblem = 'unavailable' | 'notAccepting' | 'needsSharedGenre' | 'dailyLimit';

export function requestProblem(social: Social, me: Profile, person: Person, now: number): RequestProblem | null {
  const relation = social.relations[person.id];
  if (!isInDiscover(social, person) || (relation && relation !== 'declined')) return 'unavailable';
  if (person.privacy.requests === 'nobody') return 'notAccepting';
  if (person.privacy.requests === 'sharedMusic' && !sharesGenre(me, person.profile)) return 'needsSharedGenre';
  if (social.requestLog.filter((time) => now - time < DAY).length >= SOCIAL_LIMITS.requestsPerDay) return 'dailyLimit';
  return null;
}

/** The same rule in the other direction: can this person send me a request? */
export function canReceiveFrom(social: Social, me: Profile, person: Person) {
  if (!canInteract(social, person) || social.relations[person.id] || !social.privacy.discoverable) return false;
  if (social.privacy.requests === 'nobody') return false;
  return social.privacy.requests === 'everyone' || sharesGenre(me, person.profile);
}
