'use client';

import type { ReactNode } from 'react';
import { AppMark } from '@/components/ui/app-mark';
import { PageTitle } from '@/components/ui/page-title';

/**
 * Sign-in, sign-up, forgotten password and email codes.
 * One clean centred column on black, no photo. On phones the main button waits in thumb reach.
 * `top` sits above the title (the sign-up progress bar).
 */
export function AuthFrame({ title, body, top, children }: { title: string; body?: string; top?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col pt-2 sm:justify-center sm:pt-6 sm:pb-16">
        <div className="flex flex-1 flex-col sm:flex-none">
          {top}
          <AppMark className="mb-5 size-12" />
          <PageTitle title={title} body={body} />
          {children}
        </div>
      </div>
    </div>
  );
}
