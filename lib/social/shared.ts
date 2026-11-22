import type { Profile, Track } from '../profile/types.ts';

const trackKey = (track: Track) => `${track.title}\n${track.artist}`.toLocaleLowerCase();

/** Compares me with what I am allowed to see of someone, never with their hidden fields. */
export function compareMusic(me: Profile, theirs: Profile) {
  const myTracks = new Set(me.tracks.map(trackKey));
  const knowsArtist = (id: string) => me.artists.some((artist) => artist.id === id);

  const genres = theirs.genres.filter((id) => me.genres.includes(id));
  const artists = theirs.artists.filter((artist) => knowsArtist(artist.id));
  const tracks = theirs.tracks.filter((track) => myTracks.has(trackKey(track)));
  const newArtists = theirs.artists.filter((artist) => !knowsArtist(artist.id));

  // Used only for ordering. People are never shown a compatibility score.
  const rank = genres.length + artists.length * 2 + tracks.length * 2;
  return { genres, artists, tracks, newArtists, rank };
}
