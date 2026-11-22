import type { GenreId } from '../music/genres.ts';
import type { Profile } from '../profile/types.ts';
import type { RequestProblem } from '../social/policy.ts';
import type { Relation, ReportReason } from '../social/types.ts';

/** A person as one particular viewer may see them. `profile.photo` is an address, never the picture itself. */
export type Seen = { id: string; profile: Profile; relation: Relation; problem: RequestProblem | null };

export type MyReport = { id: string; username: string; reason: ReportReason; at: number; status: 'received' | 'closed' };

export type Overview = {
  connected: Seen[];
  incoming: Seen[];
  outgoing: Seen[];
  blocked: { id: string; username: string }[];
  reports: MyReport[];
};

export type DiscoverPage = { people: Seen[]; total: number; counts: Partial<Record<GenreId, number>> };

export type PeopleError = RequestProblem | 'notReady' | 'invalid' | 'reportLimit';
export type PeopleProblem = PeopleError | 'offline' | 'signedOut';

export type PeopleInput =
  | { kind: 'send' | 'cancel' | 'accept' | 'decline' | 'remove' | 'block' | 'unblock'; personId: string }
  | { kind: 'report'; personId: string; id: string; reason: ReportReason; details: string; block: boolean; evidence: boolean };
