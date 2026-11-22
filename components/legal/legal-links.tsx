'use client';

import Link from 'next/link';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';

export function LegalLinks({ className, newTab }: { className?: string; newTab?: boolean }) {
  const { t } = useI18n();
  // From a form they open in a new tab, so nothing typed is lost.
  const target = newTab ? { target: '_blank', rel: 'noopener' } : {};
  return (
    <p className={cn('flex flex-wrap gap-x-5 text-xs', className)}>
      <Link href="/privacy" {...target} className="inline-flex min-h-11 items-center text-muted underline underline-offset-4 hover:text-chalk">{t.legal.privacy.title}</Link>
      <Link href="/rules" {...target} className="inline-flex min-h-11 items-center text-muted underline underline-offset-4 hover:text-chalk">{t.legal.rules.title}</Link>
    </p>
  );
}
