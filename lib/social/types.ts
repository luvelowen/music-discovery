import type { GenreId } from '../music/genres.ts';

export type AgeGroup = 'adult' | 'minor';

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

export const RELATIONS = ['none', 'incoming', 'outgoing', 'connected'] as const;
export type Relation = (typeof RELATIONS)[number];

export const REPORT_REASONS = ['underage', 'privateInfo', 'harassment', 'sexual', 'danger', 'impersonation', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** The part of an account that only its owner changes. Connections, blocks and reports have their own tables. */
export type Social = { privacy: Privacy; communities: GenreId[] };

export const EMPTY_SOCIAL: Social = { privacy: DEFAULT_PRIVACY, communities: [] };

export const SOCIAL_LIMITS = { requestsPerDay: 10, reportsPerDay: 10, reportDetails: 500 } as const;
export const DAY = 24 * 60 * 60 * 1000;
