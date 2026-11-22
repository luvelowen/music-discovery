'use client';

import type { GenreId } from '../music/genres.ts';
import { useProfile, useUpdateProfile } from './store.ts';
import { LIMITS } from './types.ts';

/** The rules for picking categories: five at most. */
export function useGenreToggle() {
  const { genres } = useProfile().profile;
  const updateProfile = useUpdateProfile();
  const full = genres.length >= LIMITS.genres;

  function toggle(id: GenreId) {
    updateProfile((profile) => {
      if (profile.genres.includes(id)) return { genres: profile.genres.filter((item) => item !== id) };
      return profile.genres.length < LIMITS.genres ? { genres: [...profile.genres, id] } : {};
    });
  }

  return { genres, full, toggle };
}
