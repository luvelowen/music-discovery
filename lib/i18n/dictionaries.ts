import type { Locale } from './config.ts';
import { en, type Dictionary } from './en.ts';
import { mn } from './mn.ts';

export const DICTIONARIES: Record<Locale, Dictionary> = { en, mn };
