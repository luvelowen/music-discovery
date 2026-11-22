'use client';

import { useI18n } from '../i18n/provider.tsx';
import { PEOPLE } from './people.ts';

/** The one place screens get other people from. Supabase replaces the inside of this hook. */
export function usePeople() {
  return PEOPLE[useI18n().locale];
}
