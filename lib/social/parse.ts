import { isGenreId } from '../music/genres.ts';
import {
  DEFAULT_PRIVACY, EMPTY_SOCIAL, RELATIONS, REPORT_REASONS, REQUEST_RULES, SOCIAL_LIMITS,
  type Relation, type Report, type Social,
} from './types.ts';

const asRecord = (value: unknown) =>
  (typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asBoolean = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
const isId = (value: unknown): value is string => typeof value === 'string' && /^[\w-]{1,64}$/.test(value);

export function parseSocial(raw: string | null): Social {
  if (!raw) return EMPTY_SOCIAL;
  let data: Record<string, unknown>;
  try {
    data = asRecord(JSON.parse(raw));
  } catch {
    return EMPTY_SOCIAL;
  }

  const eligibility = asRecord(data.eligibility);
  const privacy = asRecord(data.privacy);
  const blocked = [...new Set(asList(data.blocked).filter(isId))];

  const relations: Record<string, Relation> = {};
  for (const [id, value] of Object.entries(asRecord(data.relations))) {
    const relation = RELATIONS.find((item) => item === value);
    if (relation && isId(id) && !blocked.includes(id)) relations[id] = relation;
  }

  const reports = asList(data.reports).flatMap((item): Report[] => {
    const { id, personId, username, reason, details, createdAt } = asRecord(item);
    const known = REPORT_REASONS.find((option) => option === reason);
    if (!known || typeof id !== 'string' || !isId(personId) || typeof username !== 'string') return [];
    if (typeof createdAt !== 'number' || Number.isNaN(new Date(createdAt).getTime())) return [];
    const text = typeof details === 'string' ? details.slice(0, SOCIAL_LIMITS.reportDetails) : '';
    return [{ id, personId, username, reason: known, details: text, createdAt, status: 'received' }];
  });

  return {
    eligibility: {
      age: eligibility.age === 'adult' || eligibility.age === 'minor' ? eligibility.age : 'unknown',
    },
    privacy: {
      discoverable: asBoolean(privacy.discoverable, DEFAULT_PRIVACY.discoverable),
      requests: REQUEST_RULES.find((rule) => rule === privacy.requests) ?? DEFAULT_PRIVACY.requests,
      showArtists: asBoolean(privacy.showArtists, DEFAULT_PRIVACY.showArtists),
      showTracks: asBoolean(privacy.showTracks, DEFAULT_PRIVACY.showTracks),
    },
    communities: [...new Set(asList(data.communities).filter(isGenreId))],
    relations,
    blocked,
    reports,
    requestLog: asList(data.requestLog).filter((time): time is number => typeof time === 'number' && Number.isFinite(time)),
  };
}
