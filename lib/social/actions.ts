import type { GenreId } from '../music/genres.ts';
import type { Profile } from '../profile/types.ts';
import { canInteract, canReceiveFrom, requestProblem } from './policy.ts';
import { DAY, SOCIAL_LIMITS, type Person, type Relation, type ReportReason, type Social } from './types.ts';

/*
 * Every change to social data. Each takes the old state and returns the new one,
 * or returns the old one untouched when the change is not allowed.
 */

function setRelation(social: Social, id: string, relation: Relation | null): Social {
  const relations = { ...social.relations };
  if (relation) relations[id] = relation;
  else delete relations[id];
  return { ...social, relations };
}

export function sendRequest(social: Social, me: Profile, person: Person, now: number): Social {
  if (requestProblem(social, me, person, now)) return social;
  const next = setRelation(social, person.id, 'outgoing');
  return { ...next, requestLog: [...social.requestLog.filter((time) => now - time < DAY), now] };
}

export function cancelRequest(social: Social, id: string): Social {
  return social.relations[id] === 'outgoing' ? setRelation(social, id, null) : social;
}

export function acceptRequest(social: Social, person: Person): Social {
  if (social.relations[person.id] !== 'incoming' || !canInteract(social, person)) return social;
  return setRelation(social, person.id, 'connected');
}

/** Declining is silent. That person cannot send another request. */
export function declineRequest(social: Social, id: string): Social {
  return social.relations[id] === 'incoming' ? setRelation(social, id, 'declined') : social;
}

export function removeConnection(social: Social, id: string): Social {
  return social.relations[id] === 'connected' ? setRelation(social, id, null) : social;
}

/** Blocking also ends any connection or request between the two people. */
export function block(social: Social, id: string): Social {
  if (social.blocked.includes(id)) return social;
  return { ...setRelation(social, id, null), blocked: [...social.blocked, id] };
}

/** Unblocking does not bring the connection back. */
export function unblock(social: Social, id: string): Social {
  return { ...social, blocked: social.blocked.filter((item) => item !== id) };
}

export function report(social: Social, person: Person, reason: ReportReason, details: string, now: number): Social {
  const entry = {
    id: `${person.id}-${now}`,
    personId: person.id,
    username: person.profile.username,
    reason,
    details: details.trim().slice(0, SOCIAL_LIMITS.reportDetails),
    createdAt: now,
    status: 'received' as const,
  };
  return { ...social, reports: [entry, ...social.reports] };
}

export function toggleCommunity(social: Social, id: GenreId): Social {
  const communities = social.communities.includes(id)
    ? social.communities.filter((item) => item !== id)
    : [...social.communities, id];
  return { ...social, communities };
}

// The next two stand in for the other person. They are deleted when real accounts arrive.

export function demoAcceptMyRequest(social: Social, person: Person): Social {
  if (social.relations[person.id] !== 'outgoing' || !canInteract(social, person)) return social;
  return setRelation(social, person.id, 'connected');
}

export function demoReceiveRequest(social: Social, me: Profile, person: Person): Social {
  return canReceiveFrom(social, me, person) ? setRelation(social, person.id, 'incoming') : social;
}
