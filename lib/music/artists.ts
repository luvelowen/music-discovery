import type { Locale } from '../i18n/config.ts';
import type { GenreId } from './genres.ts';

/**
 * A small starter list for suggestions. An authorised music catalogue can replace it later.
 * People can always type an artist who is not listed.
 */
type SuggestedArtist = { id: string; name: string; mn?: string; genres: readonly GenreId[] };

export const ARTISTS: readonly SuggestedArtist[] = [
  { id: 'the-hu', name: 'The HU', genres: ['ethnoFusion', 'metal', 'rock', 'throatSinging'] },
  { id: 'magnolian', name: 'Magnolian', genres: ['indie'] },
  { id: 'the-lemons', name: 'The Lemons', genres: ['rock', 'indie'] },
  { id: 'vandebo', name: 'Vandebo', genres: ['hipHop', 'mongolianPop'] },
  { id: 'altan-urag', name: 'Altan Urag', mn: 'Алтан Ураг', genres: ['ethnoFusion', 'morinKhuur', 'longSong'] },
  { id: 'khusugtun', name: 'Khusugtun', mn: 'Хөсөгтөн', genres: ['throatSinging', 'morinKhuur', 'longSong'] },
  { id: 'camerton', name: 'Camerton', mn: 'Камертон', genres: ['mongolianPop', 'composedSongs', 'rnb'] },
  { id: 'khurd', name: 'Hurd', mn: 'Хурд', genres: ['rock', 'metal'] },
  { id: 'kharanga', name: 'Kharanga', mn: 'Харанга', genres: ['rock'] },
  { id: 'nisvanis', name: 'Nisvanis', mn: 'Нисванис', genres: ['rock', 'indie'] },
  { id: 'batzorig', name: 'Batzorig Vaanchig', mn: 'Ваанчигийн Батзориг', genres: ['throatSinging', 'morinKhuur'] },
  { id: 'bts', name: 'BTS', genres: ['kPop', 'pop'] },
  { id: 'newjeans', name: 'NewJeans', genres: ['kPop'] },
  { id: 'billie-eilish', name: 'Billie Eilish', genres: ['pop', 'indie'] },
  { id: 'kendrick-lamar', name: 'Kendrick Lamar', genres: ['hipHop'] },
  { id: 'taylor-swift', name: 'Taylor Swift', genres: ['pop'] },
  { id: 'arctic-monkeys', name: 'Arctic Monkeys', genres: ['indie', 'rock'] },
  { id: 'bruno-mars', name: 'Bruno Mars', genres: ['rnb', 'pop'] },
  { id: 'yoasobi', name: 'YOASOBI', genres: ['jPop'] },
  { id: 'daft-punk', name: 'Daft Punk', genres: ['electronic'] },
  { id: 'nujabes', name: 'Nujabes', genres: ['lofi', 'jazz', 'hipHop'] },
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
