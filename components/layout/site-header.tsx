'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/provider';
import { AppNav } from './app-nav';
import { LanguageSwitcher } from './language-switcher';

export function SiteHeader() {
  const { t } = useI18n();
  return (
    <header className="gutter relative flex h-16 shrink-0 items-center justify-between gap-3 bg-paper lg:h-20">
      <a href="#content" className="sr-only z-20 rounded-control bg-ink p-3 text-paper focus:not-sr-only focus:absolute focus:left-4">
        {t.skip}
      </a>
      <Link href="/" aria-label={t.appName} className="flex min-h-11 min-w-11 items-center gap-3 font-semibold">
        {/* Temporary mark until the brand is decided. */}
        <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
          <rect width="32" height="32" rx="3" />
          <circle cx="16" cy="16" r="11" className="fill-sage" />
          <circle cx="16" cy="16" r="3.5" />
        </svg>
        <span className="hidden sm:inline">{t.appName}</span>
      </Link>
      <AppNav placement="top" />
      <LanguageSwitcher />
    </header>
  );
}
