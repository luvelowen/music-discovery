export const LOCALES = ['mn', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'mn'; // The first market is Ulaanbaatar.
export const LOCALE_COOKIE = 'locale';
export const LOCALE_NAMES: Record<Locale, string> = { mn: 'Монгол', en: 'English' };

export function toLocale(value: string | undefined): Locale {
  return LOCALES.find((locale) => locale === value) ?? DEFAULT_LOCALE;
}
