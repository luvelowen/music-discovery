import { parseInstagram } from './instagram.ts';
import { parseSpotifyUrl } from './spotify.ts';

/*
 * The one place the app learns about link services. To add another service:
 * write a parser like spotify.ts, then register it in PROVIDERS and in parseSavedLink.
 * This layer only handles links. It never fetches, plays or downloads anything.
 */
export type ProviderId = 'spotify' | 'instagram';
export type LinkKind = 'profile' | 'playlist';
export type MusicLink = { provider: ProviderId; kind: LinkKind; url: string };
export type LinkError = 'invalid' | 'shortLink' | 'wrongKind' | 'instagram';
export type LinkResult = { ok: true; link: MusicLink } | { ok: false; error: LinkError };

export const PROVIDERS: Record<ProviderId, { name: string; max: number; parse: (text: string) => LinkResult }> = {
  spotify: { name: 'Spotify', max: 3, parse: parseSpotifyUrl },
  instagram: { name: 'Instagram', max: 1, parse: parseInstagram },
};

/** Saved links are full addresses, so a bare word can never turn into an Instagram account by accident. */
export function parseSavedLink(url: string): LinkResult {
  return url.startsWith('https://www.instagram.com/') ? parseInstagram(url) : parseSpotifyUrl(url);
}
