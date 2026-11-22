import type { Artist } from '../music/artists.ts';
import type { GenreId } from '../music/genres.ts';
import type { MusicLink } from '../music/providers.ts';

export type Track = { title: string; artist: string };

// Deliberately absent: real name, birthday, school, phone, email and any location.
export type Profile = {
  username: string;
  bio: string;
  photo: string | null;
  /** In the order picked. The first one is the largest part of the cover. */
  genres: GenreId[];
  artists: Artist[];
  tracks: Track[];
  links: MusicLink[];
};

export const EMPTY_PROFILE: Profile = {
  username: '', bio: '', photo: null, genres: [], artists: [], tracks: [], links: [],
};

export const LIMITS = {
  genres: 5,
  artists: 10,
  tracks: 5,
  links: 3,
  name: 80,
  usernameMin: 3,
  usernameMax: 24,
  bio: 160,
  photoBytes: 10 * 1024 * 1024,
  photoDataLength: 200_000,
} as const;
