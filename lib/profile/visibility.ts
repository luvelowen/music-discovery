import { DEFAULT_PRIVACY, type Privacy } from '../social/types.ts';
import type { Profile, Track } from './types.ts';

export type Viewer = 'stranger' | 'connection';

function visibleTrack(track: Track, connected: boolean, privacy: Privacy): Track {
  // A song names its artist, so hiding artists has to hide that name here as well.
  return connected || privacy.showArtists ? track : { title: track.title, artist: '' };
}

/**
 * The single rule for who sees what. It copies fields in one by one, so a field added
 * to Profile later stays hidden from strangers until someone deliberately adds it here.
 * It runs on the server, before anything is sent to another person.
 */
export function getVisibleProfile(
  profile: Profile,
  viewer: Viewer,
  privacy: Privacy = DEFAULT_PRIVACY,
  viewerDates = false,
): Profile {
  const connected = viewer === 'connection';
  const songs = connected || privacy.showTracks;
  return {
    username: profile.username,
    // All or nothing. Leaving out only "dating" made a dating-only person the one with an empty list.
    seeking: viewerDates ? profile.seeking : [],
    genres: profile.genres,
    artists: connected || privacy.showArtists ? profile.artists : [],
    tracks: songs ? profile.tracks.map((track) => visibleTrack(track, connected, privacy)) : [],
    anthem: songs && profile.anthem ? visibleTrack(profile.anthem, connected, privacy) : null,
    // These three are labeled as public where people write them.
    answers: profile.answers,
    moments: profile.moments,
    outings: profile.outings,
    bio: connected ? profile.bio : '',
    photo: connected ? profile.photo : null,
    links: connected ? profile.links : [],
  };
}
