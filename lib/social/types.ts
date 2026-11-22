import type { GenreId } from '../music/genres.ts';
import type { Profile } from '../profile/types.ts';

export type AgeGroup = 'unknown' | 'adult' | 'minor';

// No birthday here: only the result of the check is kept.
export type Eligibility = { age: AgeGroup; student: boolean | null };

export const REQUEST_RULES = ['sharedMusic', 'everyone', 'nobody'] as const;
export type RequestRule = (typeof REQUEST_RULES)[number];

export type Privacy = {
  discoverable: boolean;
  requests: RequestRule;
  showArtists: boolean;
  showTracks: boolean;
};

// Privacy by default: nobody appears in Discover until they choose to.
export const DEFAULT_PRIVACY: Privacy = {
  discoverable: false,
  requests: 'sharedMusic',
  showArtists: true,
  showTracks: true,
};

/** Another person, as the rules need to know them. */
export type Person = {
  id: string;
  age: AgeGroup;
  profile: Profile;
  privacy: Privacy;
};

export const RELATIONS = ['incoming', 'outgoing', 'connected', 'declined'] as const;
export type Relation = (typeof RELATIONS)[number];

export const REPORT_REASONS = ['underage', 'privateInfo', 'harassment', 'sexual', 'danger', 'impersonation', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

// The shape a moderator queue will receive. The username is copied because it can change later.
export type Report = {
  id: string;
  personId: string;
  username: string;
  reason: ReportReason;
  details: string;
  createdAt: number;
  status: 'received';
};

export type Social = {
  eligibility: Eligibility;
  privacy: Privacy;
  communities: GenreId[];
  relations: Record<string, Relation>;
  blocked: string[];
  reports: Report[];
  /** When requests were sent, for the daily limit. Cancelling does not give one back. */
  requestLog: number[];
};

export const EMPTY_SOCIAL: Social = {
  eligibility: { age: 'unknown', student: null },
  privacy: DEFAULT_PRIVACY,
  communities: [],
  relations: {},
  blocked: [],
  reports: [],
  requestLog: [],
};

export const SOCIAL_LIMITS = { requestsPerDay: 10, reportDetails: 500 } as const;
export const DAY = 24 * 60 * 60 * 1000;
