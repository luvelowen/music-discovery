export const GENRE_IDS = [
  'mongolianPop', 'hipHop', 'kPop', 'pop', 'indie', 'rock',
  'rnb',
  'electronic', 'lofi', 'jazz', 'classical', 'metal', 'jPop',
] as const;

export type GenreId = (typeof GENRE_IDS)[number];

export function isGenreId(value: unknown): value is GenreId {
  return GENRE_IDS.some((id) => id === value);
}
