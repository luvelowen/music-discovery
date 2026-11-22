import type { Profile } from '../profile/types.ts';
import { getVisibleProfile } from '../profile/visibility.ts';
import { SOCIAL_LIMITS, type Privacy, type Relation } from './types.ts';

/*
 * Every "is this allowed?" question about two people is answered in this file, and asked only on the server.
 * Before any of it, lib/server/people.ts has removed anyone who is blocked, suspended, unconfirmed or incomplete.
 */
export type Member = { id: string; profile: Profile; privacy: Privacy };

/** People meet only over something they both want. This keeps dating-only people away from friends-only people. */
export function sharesSeeking(me: Profile, them: Profile) {
  return me.seeking.some((item) => them.seeking.includes(item));
}

// Genres only. They are always visible, so this rule can't reveal someone's hidden artists or songs.
export function sharesGenre(me: Profile, them: Profile) {
  return me.genres.some((genre) => them.genres.includes(genre));
}

export function isInDiscover(me: Member, them: Member) {
  return me.id !== them.id && them.privacy.discoverable && sharesSeeking(me.profile, them.profile);
}

export function canView(me: Member, them: Member, relation: Relation) {
  return me.id !== them.id && (relation !== 'none' || isInDiscover(me, them));
}

/** What I may see of someone. Never send a profile to a browser without it. */
export function seeMember(me: Member, them: Member, relation: Relation): Profile | null {
  if (!canView(me, them, relation)) return null;
  const viewer = relation === 'connected' ? 'connection' : 'stranger';
  return getVisibleProfile(them.profile, viewer, them.privacy, me.profile.seeking.includes('dating'));
}

export type RequestProblem = 'unavailable' | 'notAccepting' | 'needsSharedGenre' | 'dailyLimit';

export function requestProblem(me: Member, them: Member, relation: Relation, sentToday: number): RequestProblem | null {
  if (relation !== 'none' || !isInDiscover(me, them)) return 'unavailable';
  if (them.privacy.requests === 'nobody') return 'notAccepting';
  if (them.privacy.requests === 'sharedMusic' && !sharesGenre(me.profile, them.profile)) return 'needsSharedGenre';
  return sentToday >= SOCIAL_LIMITS.requestsPerDay ? 'dailyLimit' : null;
}
