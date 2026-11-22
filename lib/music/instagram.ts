import type { LinkResult } from './providers.ts';

const NOT_PROFILES = ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv', 'about', 'developer', 'share'];
const HOSTS = ['instagram.com', 'www.instagram.com', 'm.instagram.com'];
const HANDLE = /^(?!\.)(?!.*\.\.)[a-z\d._]{1,30}(?<!\.)$/;

/** Takes a username or a profile link and rebuilds it, which drops tracking codes such as ?igsh=. */
export function parseInstagram(text: string): LinkResult {
  const input = text.trim();
  let handle = input.replace(/^@/, '');

  if (/[/:]/.test(input) || HOSTS.includes(input.toLowerCase())) {
    let url: URL;
    try {
      url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`);
    } catch {
      return { ok: false, error: 'instagram' };
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !HOSTS.includes(url.hostname)) {
      return { ok: false, error: 'instagram' };
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length !== 1) return { ok: false, error: 'instagram' };
    handle = parts[0]!;
  }

  handle = handle.toLowerCase();
  if (!HANDLE.test(handle) || NOT_PROFILES.includes(handle)) return { ok: false, error: 'instagram' };
  return { ok: true, link: { provider: 'instagram', kind: 'profile', url: `https://www.instagram.com/${handle}/` } };
}

export const instagramHandle = (url: string) => `@${url.split('/').filter(Boolean).pop()}`;
