import type { Dictionary } from '@/lib/i18n/en';
import { instagramHandle } from '@/lib/music/instagram';
import type { MusicLink } from '@/lib/music/providers';

export function linkLabel(link: MusicLink, t: Dictionary) {
  return link.provider === 'instagram' ? `Instagram ${instagramHandle(link.url)}` : t.linksStep[link.kind];
}
