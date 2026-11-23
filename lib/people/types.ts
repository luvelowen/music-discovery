import type { GenreId } from '../music/genres.ts';
import type { Profile } from '../profile/types.ts';
import type { RequestProblem } from '../social/policy.ts';
import type { Relation, ReportReason } from '../social/types.ts';

/** A person as one particular viewer may see them. `profile.photo` is an address, never the picture itself. */
export type Seen = { id: string; profile: Profile; relation: Relation; problem: RequestProblem | null };

/** An empty `username` means someone whose name I may no longer see. */
export type MyReport = { id: string; username: string; reason: ReportReason; at: number; status: 'received' | 'closed' };
/** Someone I blocked, or who wrote to me in a chat that has closed. Enough to report them, and no more. */
export type Blocked = { id: string; username: string; chatted: boolean };
export type PastChat = { id: string; at: number; last: string | null; chatted: boolean };

export type Overview = {
  connected: Seen[];
  incoming: Seen[];
  outgoing: Seen[];
  blocked: Blocked[];
  pastChats: PastChat[];
  reports: MyReport[];
};

export type DiscoverPage = { people: Seen[]; total: number; counts: Partial<Record<GenreId, number>> };

export type PeopleError = RequestProblem | 'notReady' | 'invalid' | 'reportLimit';
export type PeopleProblem = PeopleError | 'offline' | 'signedOut';

export type PeopleInput =
  | { kind: 'send' | 'cancel' | 'accept' | 'decline' | 'remove' | 'block' | 'unblock'; personId: string }
  | { kind: 'report'; personId: string; id: string; reason: ReportReason; details: string; block: boolean; evidence: boolean };
