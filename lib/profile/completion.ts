import type { Profile } from './types.ts';

export const COMPLETION = ['photo', 'bio', 'anthem', 'answers', 'moments', 'outings'] as const;
export type CompletionItem = (typeof COMPLETION)[number];

/** What would still make the profile better. Never shown to anyone else, and never a score. */
export function missingParts(profile: Profile): CompletionItem[] {
  return COMPLETION.filter((item) => {
    const value = profile[item];
    return Array.isArray(value) ? value.length === 0 : !value;
  });
}
