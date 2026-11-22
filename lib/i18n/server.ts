import { cookies } from 'next/headers';
import { LOCALE_COOKIE, toLocale } from './config.ts';
import { DICTIONARIES } from './dictionaries.ts';

/** Reads the language on the server, so the first paint is already in the right language. */
export async function getI18n() {
  const locale = toLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { locale, t: DICTIONARIES[locale] };
}
