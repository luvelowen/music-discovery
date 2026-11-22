import { ARTISTS } from '../music/artists.ts';
import type { GenreId } from '../music/genres.ts';
import type { Locale } from '../i18n/config.ts';
import type { Seeking } from '../profile/types.ts';
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
  seeking: Seeking[];
  artists: string[];
  tracks?: [title: string, artist: string][];
  privacy?: Partial<Privacy>;
};

const SAMPLES: Sample[] = [
  {
    id: 'sample-01', seeking: ['friends', 'dating'], username: 'sarny.notes',
    bio: { en: 'I make playlists for long bus rides.', mn: 'Автобусанд сонсох плейлист цуглуулдаг.' },
    genres: ['indie', 'folk', 'country'], artists: ['magnolian', 'billie-eilish', 'nujabes'],
    tracks: [['Ocean Eyes', 'Billie Eilish']],
  },
  {
    id: 'sample-02', seeking: ['dating'], username: 'last.bus',
    bio: { en: 'I always miss the last bus after the encore.', mn: 'Тоглолтын дараа сүүлийн автобуснаас байнга хоцордог.' },
    genres: ['rnb', 'soul', 'jazz'], artists: ['bruno-mars', 'nujabes'],
    privacy: { requests: 'everyone' },
  },
  {
    id: 'sample-03', seeking: ['friends'], username: 'bass_salhi',
    bio: { en: 'Bass player looking for a drummer.', mn: 'Басс тоглодог, бөмбөрчин хайж байгаа.' },
    genres: ['rock', 'metal', 'punk'], artists: ['the-hu', 'khurd', 'kharanga'],
    tracks: [['Wolf Totem', 'The HU'], ['Yuve Yuve Yu', 'The HU']],
  },
  {
    id: 'sample-04', seeking: ['friends', 'dating'], username: 'neon_nomad',
    bio: { en: 'Beats after work.', mn: 'Ажлын дараа бит хийдэг.' },
    genres: ['electronic', 'hipHop', 'ambient'], artists: ['daft-punk', 'kendrick-lamar', 'nujabes'],
    tracks: [['One More Time', 'Daft Punk'], ['Feather', 'Nujabes']],
  },
  {
    id: 'sample-05', seeking: ['friends'], username: 'odod.mp3',
    bio: { en: 'Here for comebacks and choreography.', mn: 'Камбэк, бүжгийн хөдөлгөөн хоёрт дуртай.' },
    genres: ['kPop', 'pop', 'jPop'], artists: ['bts', 'newjeans', 'yoasobi'],
    tracks: [['Dynamite', 'BTS'], ['Ditto', 'NewJeans']],
  },
  {
    id: 'sample-06', seeking: ['friends', 'dating'], username: 'хөх_тэнгэр',
    bio: { en: 'I sing while doing the dishes.', mn: 'Аяга угаахдаа дуулдаг.' },
    genres: ['latin', 'pop', 'rnb'], artists: ['camerton', 'bruno-mars'],
    tracks: [['Just the Way You Are', 'Bruno Mars']],
  },
  {
    id: 'sample-07', seeking: ['friends'], username: 'piano.nuudel',
    bio: { en: 'Practice room regular.', mn: 'Төгөлдөр хуурын өрөөнөөс гардаггүй.' },
    genres: ['classical', 'jazz', 'blues'], artists: ['ludovico-einaudi', 'nujabes'],
    tracks: [['Nuvole Bianche', 'Ludovico Einaudi']],
    privacy: { requests: 'nobody' },
  },
  {
    id: 'sample-08', seeking: ['friends', 'dating'], username: 'улаан_гэрэл',
    bio: { en: 'Front row or nothing.', mn: 'Тоглолт үзвэл урд эгнээнд.' },
    genres: ['rock', 'alternative', 'electronic'], artists: ['arctic-monkeys', 'daft-punk'],
  },
  {
    id: 'sample-09', seeking: ['dating'], username: 'ub_beats',
    bio: { en: 'Writing verses on night shifts.', mn: 'Шөнийн ээлжиндээ шүлэг бичдэг.' },
    genres: ['hipHop', 'caribbean', 'rnb'], artists: ['vandebo', 'kendrick-lamar'],
  },
  {
    id: 'sample-10', seeking: ['friends', 'dating'], username: 'шөнийн_долгион',
    bio: { en: 'Headphones on after midnight.', mn: 'Шөнө дундаас хойш чихэвчтэй.' },
    genres: ['electronic', 'indie', 'jazz'], artists: ['magnolian', 'daft-punk'],
    tracks: [['Get Lucky', 'Daft Punk']],
    privacy: { showTracks: false },
  },
  {
    id: 'sample-11', seeking: ['friends'], username: 'anime_ost',
    bio: { en: 'The soundtrack is the best part.', mn: 'Анимений хамгийн гоё нь хөгжим нь.' },
    genres: ['jPop', 'classical', 'kPop'], artists: ['yoasobi', 'ludovico-einaudi'],
    tracks: [['Idol', 'YOASOBI']],
    privacy: { requests: 'everyone', showArtists: false },
  },
  {
    // Never appears in Discover. Proves that hiding works.
    id: 'sample-12', seeking: ['friends', 'dating'], username: 'quiet.riff',
    bio: { en: 'Mostly listening.', mn: 'Голдуу сонсдог.' },
    genres: ['metal', 'rock', 'indie'], artists: ['the-hu', 'nisvanis'],
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
      seeking: sample.seeking,
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
