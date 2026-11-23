'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import { LanguageSwitcher } from './language-switcher';

/** Sign-in screens are full width, so their header lines up with the photo instead of the centred column. */
const AUTH = /^\/(login|signup|forgot|code)(\/|$)/;

export function SiteHeader({ inApp }: { inApp: boolean }) {
  const { t } = useI18n();
  const auth = AUTH.test(usePathname());
  return (
    <header className={cn('flex h-16 shrink-0 items-center justify-between gap-3', auth ? 'px-5 lg:px-8' : 'gutter', inApp && 'lg:hidden')}>
      <Link href="/" className="flex min-h-11 min-w-0 items-center text-sm leading-tight font-bold">{t.appName}</Link>
      <LanguageSwitcher />
    </header>
  );
}
