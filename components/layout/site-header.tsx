'use client';

import Link from 'next/link';
import { AppMark } from '@/components/ui/app-mark';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import { LanguageSwitcher } from './language-switcher';

export function SiteHeader({ inApp }: { inApp: boolean }) {
  const { t } = useI18n();
  return (
    <header className={cn('flex h-16 shrink-0 items-center pt-[env(safe-area-inset-top)] justify-between gap-3', 'gutter', inApp && 'lg:hidden')}>
      <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2.5 text-sm leading-tight font-bold">
        <AppMark className="size-7" />
        {t.appName}
      </Link>
      <LanguageSwitcher />
    </header>
  );
}
