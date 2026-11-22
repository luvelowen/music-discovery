'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import { AppNav, useInApp } from './app-nav';
import { SiteHeader } from './site-header';

/** A sidebar on desktop and a tab bar on phones, once someone is inside the app. */
export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const inApp = useInApp();
  // An open chat uses the whole phone screen, so the box to type in sits where the thumb is.
  const path = usePathname();
  const inThread = path.startsWith('/chats/') || path === '/profile/edit';
  return (
    <>
      <a href="#content" className="sr-only z-40 rounded-control bg-chalk p-3 text-night focus:not-sr-only focus:fixed focus:top-3 focus:left-4">
        {t.skip}
      </a>
      {inApp && <AppNav placement="side" />}
      <div className={cn('flex min-w-0 flex-1 flex-col', inApp && 'lg:pl-64')}>
        <SiteHeader inApp={inApp} />
        <main id="content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </main>
        {inApp && !inThread && <AppNav placement="bottom" />}
      </div>
    </>
  );
}
