import type { Artist } from '../music/artists.ts';
import type { GenreId } from '../music/genres.ts';
import type { MusicLink } from '../music/providers.ts';

// Music and friends only. Dating was removed on 2026-11-24 at the owner's request; older saved choices read as friends.
export const SEEKING = ['friends'] as const;
export type Seeking = (typeof SEEKING)[number];

export const MOMENTS = ['commute', 'lateNight', 'gettingReady', 'workout', 'working', 'cooking', 'walking', 'driving'] as const;
export type Moment = (typeof MOMENTS)[number];

// Kinds of night out, never places: nothing here can say where someone is.
export const OUTINGS = ['concerts', 'festivals', 'smallGigs', 'karaoke', 'dancing', 'recordShops', 'listeningIn', 'jamming'] as const;
export type Outing = (typeof OUTINGS)[number];

export const PROMPTS = ['neverSkip', 'firstConcert', 'perfectNight', 'secretFavourite', 'introduceMe'] as const;
export type PromptId = (typeof PROMPTS)[number];
export type Answer = { id: PromptId; text: string };

export type Track = { title: string; artist: string };

// Deliberately absent: real name, birthday, school, phone, email, any location, gender and sexual orientation.
// The last two are sensitive data in Mongolian law. Read docs/DATA.md before adding them.
export type Profile = {
  username: string;
  bio: string;
  /** Always ['friends'] since dating was removed. Kept so older saved profiles still read correctly. */
  seeking: Seeking[];
  photo: string | null;
  /** In the order picked. */
  genres: GenreId[];
  artists: Artist[];
  tracks: Track[];
  /** The one favourite song at the top of the profile. Always one of `tracks`. */
  anthem: Track | null;
  answers: Answer[];
  moments: Moment[];
  outings: Outing[];
  links: MusicLink[];
};

export const EMPTY_PROFILE: Profile = {
  username: '', bio: '', seeking: ['friends'], photo: null, genres: [], artists: [], tracks: [],
  anthem: null, answers: [], moments: [], outings: [], links: [],
};

export const LIMITS = {
  genres: 5,
  artists: 10,
  tracks: 5,
  answers: 3,
  answer: 120,
  moments: 3,
  outings: 3,
  name: 80,
  usernameMin: 3,
  usernameMax: 24,
  bio: 160,
  photoBytes: 10 * 1024 * 1024,
  photoDataLength: 200_000,
} as const;
