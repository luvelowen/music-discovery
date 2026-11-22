'use client';

import type { GenreId } from '../music/genres.ts';
import { updateProfile, useProfile } from './store.ts';
import { LIMITS } from './types.ts';

/** Shared by the welcome shelf and the genre step, so both follow the same rules. */
export function useGenreToggle() {
  const { genres } = useProfile().profile;
  const full = genres.length >= LIMITS.genres;

  function toggle(id: GenreId) {
    updateProfile((profile) => {
      if (profile.genres.includes(id)) return { genres: profile.genres.filter((item) => item !== id) };
      return profile.genres.length < LIMITS.genres ? { genres: [...profile.genres, id] } : {};
    });
  }

  return { genres, full, toggle };
}
