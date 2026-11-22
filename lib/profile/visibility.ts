import { DEFAULT_PRIVACY, type Privacy } from '../social/types.ts';
import type { Profile } from './types.ts';

export type Viewer = 'stranger' | 'connection';

function visibleTracks(profile: Profile, connected: boolean, privacy: Privacy) {
  if (connected) return profile.tracks;
  if (!privacy.showTracks) return [];
  // A song names its artist, so hiding artists has to hide that name here as well.
  return privacy.showArtists ? profile.tracks : profile.tracks.map(({ title }) => ({ title, artist: '' }));
}

/**
 * The single rule for who sees what. It copies fields in one by one, so a field added
 * to Profile later stays hidden from strangers until someone deliberately adds it here.
 * With Supabase, this rule must also be enforced by the database.
 */
export function getVisibleProfile(
  profile: Profile,
  viewer: Viewer,
  privacy: Privacy = DEFAULT_PRIVACY,
  viewerDates = false,
): Profile {
  const connected = viewer === 'connection';
  return {
    username: profile.username,
    seeking: profile.seeking.filter((item) => item === 'friends' || viewerDates),
    genres: profile.genres,
    artists: connected || privacy.showArtists ? profile.artists : [],
    tracks: visibleTracks(profile, connected, privacy),
    bio: connected ? profile.bio : '',
    photo: connected ? profile.photo : null,
    links: connected ? profile.links : [],
  };
}
