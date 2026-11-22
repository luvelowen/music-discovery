'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { LOCALE_COOKIE, type Locale } from './config.ts';
import { DICTIONARIES } from './dictionaries.ts';
import type { Dictionary } from './en.ts';

type I18n = { locale: Locale; t: Dictionary; setLocale: (locale: Locale) => void };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setCurrent] = useState(initialLocale);

  function setLocale(next: Locale) {
    setCurrent(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    router.refresh(); // Updates the browser tab title. What the person typed is kept.
  }

  return <I18nContext value={{ locale, t: DICTIONARIES[locale], setLocale }}>{children}</I18nContext>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
