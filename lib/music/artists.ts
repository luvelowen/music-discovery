import type { Locale } from '../i18n/config.ts';
import type { GenreId } from './genres.ts';

/**
 * A small starter list for suggestions. An authorised music catalogue can replace it later.
 * People can always type an artist who is not listed.
 */
type SuggestedArtist = { id: string; name: string; mn?: string; genres: readonly GenreId[] };

export const ARTISTS: readonly SuggestedArtist[] = [
  { id: 'the-hu', name: 'The HU', genres: ['metal', 'rock'] },
  { id: 'magnolian', name: 'Magnolian', genres: ['indie', 'folk'] },
  { id: 'the-lemons', name: 'The Lemons', genres: ['rock', 'indie'] },
  { id: 'vandebo', name: 'Vandebo', genres: ['hipHop', 'pop'] },
  { id: 'camerton', name: 'Camerton', mn: 'Камертон', genres: ['pop', 'rnb', 'soul'] },
  { id: 'khurd', name: 'Hurd', mn: 'Хурд', genres: ['rock', 'metal'] },
  { id: 'kharanga', name: 'Kharanga', mn: 'Харанга', genres: ['rock'] },
  { id: 'nisvanis', name: 'Nisvanis', mn: 'Нисванис', genres: ['rock', 'indie'] },
  { id: 'bts', name: 'BTS', genres: ['kPop', 'pop'] },
  { id: 'newjeans', name: 'NewJeans', genres: ['kPop'] },
  { id: 'billie-eilish', name: 'Billie Eilish', genres: ['pop', 'indie'] },
  { id: 'kendrick-lamar', name: 'Kendrick Lamar', genres: ['hipHop'] },
  { id: 'taylor-swift', name: 'Taylor Swift', genres: ['pop'] },
  { id: 'arctic-monkeys', name: 'Arctic Monkeys', genres: ['indie', 'rock', 'alternative'] },
  { id: 'bruno-mars', name: 'Bruno Mars', genres: ['rnb', 'pop'] },
  { id: 'yoasobi', name: 'YOASOBI', genres: ['jPop', 'pop'] },
  { id: 'daft-punk', name: 'Daft Punk', genres: ['electronic'] },
  { id: 'nujabes', name: 'Nujabes', genres: ['jazz', 'hipHop', 'ambient'] },
  { id: 'bad-bunny', name: 'Bad Bunny', genres: ['latin', 'caribbean'] },
  { id: 'bob-marley', name: 'Bob Marley', genres: ['caribbean'] },
  { id: 'johnny-cash', name: 'Johnny Cash', genres: ['country', 'folk'] },
  { id: 'amy-winehouse', name: 'Amy Winehouse', genres: ['soul', 'jazz'] },
  { id: 'bb-king', name: 'B.B. King', genres: ['blues'] },
  { id: 'brian-eno', name: 'Brian Eno', genres: ['ambient'] },
  { id: 'green-day', name: 'Green Day', genres: ['punk', 'rock'] },
  { id: 'ludovico-einaudi', name: 'Ludovico Einaudi', genres: ['classical'] },
];

export type Artist = { id: string; name: string };

/** Turns typed text into an artist, so "Хурд" and "hurd" count as the same favourite. */
export function toArtist(text: string): Artist {
  const key = text.toLocaleLowerCase();
  const known = ARTISTS.find(
    (artist) => artist.name.toLocaleLowerCase() === key || artist.mn?.toLocaleLowerCase() === key,
  );
  return known ? { id: known.id, name: known.name } : { id: `custom:${key}`, name: text };
}

export function artistName(artist: Artist, locale: Locale): string {
  const known = ARTISTS.find((item) => item.id === artist.id);
  return (locale === 'mn' && known?.mn) || artist.name;
}

export function suggestArtists(query: string, genres: readonly GenreId[], chosen: readonly Artist[]) {
  const key = query.trim().toLocaleLowerCase();
  const score = (artist: SuggestedArtist) => artist.genres.filter((id) => genres.includes(id)).length;

  return ARTISTS.filter(
    (artist) =>
      !chosen.some((item) => item.id === artist.id) &&
      `${artist.name} ${artist.mn ?? ''}`.toLocaleLowerCase().includes(key),
  )
    .sort((a, b) => score(b) - score(a))
    .slice(0, 8);
}
