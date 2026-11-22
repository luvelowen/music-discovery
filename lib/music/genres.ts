/*
 * The first 20 music genres in Spotify's "Browse all", in Spotify's order (checked 2026-11-22).
 * Moods, regions, holidays and podcasts are skipped. Spotify publishes no ranking by streams.
 */
export const GENRE_IDS = [
  'pop', 'hipHop', 'rnb', 'rock', 'latin', 'electronic', 'kPop', 'indie', 'country', 'metal',
  'jazz', 'classical', 'folk', 'soul', 'punk', 'ambient', 'blues', 'jPop', 'alternative', 'caribbean',
] as const;

// No longer offered, but still valid, so nobody who picked one loses it.
export const RETIRED_GENRE_IDS = ['mongolianPop', 'lofi'] as const;

export type GenreId = (typeof GENRE_IDS)[number] | (typeof RETIRED_GENRE_IDS)[number];

const KNOWN: readonly GenreId[] = [...GENRE_IDS, ...RETIRED_GENRE_IDS];

export function isGenreId(value: unknown): value is GenreId {
  return KNOWN.some((id) => id === value);
}
