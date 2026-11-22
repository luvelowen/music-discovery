import { ARTISTS } from '../music/artists.ts';
import type { GenreId } from '../music/genres.ts';
import type { Locale } from '../i18n/config.ts';
import { DEFAULT_PRIVACY, type Person, type Privacy } from '../social/types.ts';

/*
 * FICTIONAL PEOPLE, for trying the prototype. None of them is a real person.
 * They have no photos and no Spotify links, so no real account can be mistaken for theirs.
 * Delete this folder when Supabase provides real profiles.
 */
type Sample = {
  id: string;
  username: string;
  bio: Record<Locale, string>;
  genres: GenreId[];
  artists: string[];
  tracks?: [title: string, artist: string][];
  privacy?: Partial<Privacy>;
};

const SAMPLES: Sample[] = [
  {
    id: 'sample-01', username: 'sarny.notes',
    bio: { en: 'I make playlists for long bus rides.', mn: 'Автобусанд сонсох плейлист цуглуулдаг.' },
    genres: ['indie', 'lofi', 'pop'], artists: ['magnolian', 'billie-eilish', 'nujabes'],
    tracks: [['Ocean Eyes', 'Billie Eilish']],
  },
  {
    id: 'sample-02', username: 'steppe_echo',
    bio: { en: 'Learning throat singing, slowly.', mn: 'Хөөмий аажуухан сурч байгаа.' },
    genres: ['throatSinging', 'morinKhuur', 'longSong'], artists: ['khusugtun', 'batzorig', 'altan-urag'],
    privacy: { requests: 'everyone' },
  },
  {
    id: 'sample-03', username: 'bass_salhi',
    bio: { en: 'Bass player looking for a drummer.', mn: 'Басс тоглодог, бөмбөрчин хайж байгаа.' },
    genres: ['rock', 'metal', 'ethnoFusion'], artists: ['the-hu', 'khurd', 'kharanga'],
    tracks: [['Wolf Totem', 'The HU'], ['Yuve Yuve Yu', 'The HU']],
  },
  {
    id: 'sample-04', username: 'neon_nomad',
    bio: { en: 'Beats after class.', mn: 'Хичээлийн дараа бит хийдэг.' },
    genres: ['electronic', 'hipHop', 'lofi'], artists: ['daft-punk', 'kendrick-lamar', 'nujabes'],
    tracks: [['One More Time', 'Daft Punk'], ['Feather', 'Nujabes']],
  },
  {
    id: 'sample-05', username: 'odod.mp3',
    bio: { en: 'Here for comebacks and choreography.', mn: 'Камбэк, бүжгийн хөдөлгөөн хоёрт дуртай.' },
    genres: ['kPop', 'pop', 'jPop'], artists: ['bts', 'newjeans', 'yoasobi'],
    tracks: [['Dynamite', 'BTS'], ['Ditto', 'NewJeans']],
  },
  {
    id: 'sample-06', username: 'хөх_тэнгэр',
    bio: { en: 'I sing while doing the dishes.', mn: 'Аяга угаахдаа дуулдаг.' },
    genres: ['mongolianPop', 'composedSongs', 'rnb'], artists: ['camerton', 'bruno-mars'],
    tracks: [['Just the Way You Are', 'Bruno Mars']],
  },
  {
    id: 'sample-07', username: 'piano.nuudel',
    bio: { en: 'Practice room regular.', mn: 'Төгөлдөр хуурын өрөөнөөс гардаггүй.' },
    genres: ['classical', 'jazz', 'composedSongs'], artists: ['ludovico-einaudi', 'nujabes'],
    tracks: [['Nuvole Bianche', 'Ludovico Einaudi']],
    privacy: { requests: 'nobody' },
  },
  {
    id: 'sample-08', username: 'тал_нутаг',
    bio: { en: 'Old melodies, new arrangements.', mn: 'Хуучин аялгуу, шинэ найруулга.' },
    genres: ['ethnoFusion', 'longSong', 'morinKhuur'], artists: ['altan-urag', 'the-hu'],
  },
  {
    id: 'sample-09', username: 'ub_beats',
    bio: { en: 'Writing verses in lecture notes.', mn: 'Лекцийн дэвтэртээ шүлэг бичдэг.' },
    genres: ['hipHop', 'mongolianPop', 'rnb'], artists: ['vandebo', 'kendrick-lamar'],
  },
  {
    id: 'sample-10', username: 'шөнийн_долгион',
    bio: { en: 'Headphones on after midnight.', mn: 'Шөнө дундаас хойш чихэвчтэй.' },
    genres: ['electronic', 'indie', 'jazz'], artists: ['magnolian', 'daft-punk'],
    tracks: [['Get Lucky', 'Daft Punk']],
    privacy: { showTracks: false },
  },
  {
    id: 'sample-11', username: 'anime_ost',
    bio: { en: 'The soundtrack is the best part.', mn: 'Анимений хамгийн гоё нь хөгжим нь.' },
    genres: ['jPop', 'classical', 'kPop'], artists: ['yoasobi', 'ludovico-einaudi'],
    tracks: [['Idol', 'YOASOBI']],
    privacy: { requests: 'everyone', showArtists: false },
  },
  {
    // Never appears in Discover. Proves that hiding works.
    id: 'sample-12', username: 'quiet.riff',
    bio: { en: 'Mostly listening.', mn: 'Голдуу сонсдог.' },
    genres: ['metal', 'rock', 'throatSinging'], artists: ['the-hu', 'nisvanis'],
    privacy: { discoverable: false },
  },
];

function toPerson(sample: Sample, locale: Locale): Person {
  return {
    id: sample.id,
    age: 'adult',
    privacy: { ...DEFAULT_PRIVACY, discoverable: true, ...sample.privacy },
    profile: {
      username: sample.username,
      bio: sample.bio[locale],
      photo: null,
      genres: sample.genres,
      artists: sample.artists.flatMap((id) => {
        const artist = ARTISTS.find((item) => item.id === id);
        return artist ? [{ id, name: artist.name }] : [];
      }),
      tracks: (sample.tracks ?? []).map(([title, artist]) => ({ title, artist })),
      links: [],
    },
  };
}

export const PEOPLE: Record<Locale, Person[]> = {
  en: SAMPLES.map((sample) => toPerson(sample, 'en')),
  mn: SAMPLES.map((sample) => toPerson(sample, 'mn')),
};
