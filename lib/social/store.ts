'use client';

import { createLocalStore } from '../storage/local-store.ts';
import { parseSocial } from './parse.ts';
import { EMPTY_SOCIAL } from './types.ts';

const store = createLocalStore('music-community.social.v1', EMPTY_SOCIAL, parseSocial);

export const updateSocial = store.update;
export const deleteSocial = store.reset;

export function useSocial() {
  const { value, ready, saveFailed } = store.use();
  return { social: value, ready, saveFailed };
}
