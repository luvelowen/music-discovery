import { LOCALES, type Locale } from '../i18n/config.ts';
import { DICTIONARIES } from '../i18n/dictionaries.ts';

/*
 * The wording someone agrees to. The screen sends back a mark of what it showed, and the server keeps
 * the full text only when that mark matches. A tab left open over a wording change has to read it again.
 */
export type ConsentKind = 'signup' | 'chat';
export type Shown = { locale: Locale; mark: string };

export function consentWording(kind: ConsentKind, locale: Locale) {
  const { account, chat, legal } = DICTIONARIES[locale];
  if (kind === 'chat') return chat.consent;
  return { consent: account.consent, note: account.consentNote, privacy: legal.privacy, rules: legal.rules };
}

/** Short enough for a form field. It spots changed wording. It is not a secret or a signature. */
export function shownMark(kind: ConsentKind, locale: Locale) {
  let hash = 0x811c9dc5;
  for (const letter of JSON.stringify(consentWording(kind, locale))) hash = Math.imul(hash ^ letter.codePointAt(0)!, 0x01000193);
  return (hash >>> 0).toString(36);
}

export function parseShown(locale: unknown, mark: unknown): Shown | null {
  const known = LOCALES.find((item) => item === locale);
  return known && typeof mark === 'string' && mark.length <= 12 ? { locale: known, mark } : null;
}
