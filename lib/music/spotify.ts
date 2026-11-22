import type { LinkResult } from './providers.ts';

/**
 * Accepts only Spotify profile and playlist links and rebuilds them from scratch,
 * which drops tracking codes such as ?si= that can identify who shared the link.
 */
export function parseSpotifyUrl(text: string): LinkResult {
  const input = text.trim();
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`);
  } catch {
    return { ok: false, error: 'invalid' };
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    return { ok: false, error: 'invalid' };
  }
  if (url.hostname === 'spotify.link' || url.hostname === 'spoti.fi') {
    return { ok: false, error: 'shortLink' };
  }
  if (url.hostname !== 'open.spotify.com') return { ok: false, error: 'invalid' };

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0]?.startsWith('intl-')) parts.shift();
  const [type, id, ...rest] = parts;

  if (type && ['track', 'album', 'artist', 'episode', 'show'].includes(type)) {
    return { ok: false, error: 'wrongKind' };
  }
  if (!id || rest.length > 0) return { ok: false, error: 'invalid' };

  if (type === 'playlist' && /^[A-Za-z\d]{22}$/.test(id)) {
    return { ok: true, link: { provider: 'spotify', kind: 'playlist', url: `https://open.spotify.com/playlist/${id}` } };
  }
  if (type === 'user' && /^[\w.%~-]{1,128}$/.test(id)) {
    return { ok: true, link: { provider: 'spotify', kind: 'profile', url: `https://open.spotify.com/user/${id}` } };
  }
  return { ok: false, error: 'invalid' };
}
