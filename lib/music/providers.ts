import { parseSpotifyUrl } from './spotify.ts';

/*
 * The one place the app learns about music services. To add another service:
 * write a parser like spotify.ts, then register it in PROVIDERS.
 * This layer only handles links. It never fetches, plays or downloads music.
 */
export type ProviderId = 'spotify';
export type LinkKind = 'profile' | 'playlist';
export type MusicLink = { provider: ProviderId; kind: LinkKind; url: string };
export type LinkError = 'invalid' | 'shortLink' | 'wrongKind';
export type LinkResult = { ok: true; link: MusicLink } | { ok: false; error: LinkError };

export const PROVIDERS: Record<ProviderId, { name: string; parse: (text: string) => LinkResult }> = {
  spotify: { name: 'Spotify', parse: parseSpotifyUrl },
};
