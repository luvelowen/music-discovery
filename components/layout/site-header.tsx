'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/provider';
import { AppNav } from './app-nav';
import { LanguageSwitcher } from './language-switcher';

export function SiteHeader() {
  const { t } = useI18n();
  return (
    <header className="gutter relative flex h-16 shrink-0 items-center justify-between gap-3 bg-night lg:h-20">
      <a href="#content" className="sr-only z-20 rounded-control bg-chalk p-3 text-night focus:not-sr-only focus:absolute focus:left-4">
        {t.skip}
      </a>
      <Link href="/" aria-label={t.appName} className="flex min-h-11 min-w-11 items-center gap-3 font-semibold">
        {/* Temporary mark until the brand is decided: two records, one shared song. */}
        <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
          <rect width="32" height="32" className="fill-flame" />
          <circle cx="20.5" cy="16" r="8" className="fill-blush" />
          <circle cx="11.5" cy="16" r="8" />
          <circle cx="11.5" cy="16" r="2.5" className="fill-flame" />
          <circle cx="22.5" cy="16" r="2" />
        </svg>
        <span className="poster hidden text-2xl whitespace-nowrap sm:inline lg:hidden xl:inline">{t.appName}</span>
      </Link>
      <AppNav placement="top" />
      <LanguageSwitcher />
    </header>
  );
}
