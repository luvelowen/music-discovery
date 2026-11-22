'use client';

import Link from 'next/link';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import { LanguageSwitcher } from './language-switcher';

export function SiteHeader({ inApp }: { inApp: boolean }) {
  const { t } = useI18n();
  return (
    <header className={cn('gutter flex h-16 shrink-0 items-center justify-between gap-3', inApp && 'lg:hidden')}>
      <Link href="/" className="flex min-h-11 min-w-0 items-center text-sm leading-tight font-bold">{t.appName}</Link>
      <LanguageSwitcher />
    </header>
  );
}
