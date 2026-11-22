'use client';

import { createLocalStore } from '../storage/local-store.ts';
import { parseProfile } from './parse.ts';
import { EMPTY_PROFILE, type Profile } from './types.ts';

/*
 * The profile is kept in this browser only.
 * Supabase starts here. Screens will also need sign-in, saving and network-error states,
 * and the server must repeat every validation and visibility rule.
 */
const store = createLocalStore('music-community.profile.v1', EMPTY_PROFILE, parseProfile);

export function updateProfile(change: (profile: Profile) => Partial<Profile>) {
  store.update((profile) => ({ ...profile, ...change(profile) }));
}

export const deleteProfile = store.reset;

export function useProfile() {
  const { value, ready, saveFailed } = store.use();
  return { profile: value, ready, saveFailed };
}
