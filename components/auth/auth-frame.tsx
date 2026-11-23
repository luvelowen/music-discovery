'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { AppMark } from '@/components/ui/app-mark';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';

/**
 * Sign-in, sign-up, forgotten password and email codes.
 * Wide screens show the night photo beside the form. Phones show only the form, with the main button in thumb reach.
 * `top` sits above the title (the sign-up progress bar).
 */
export function AuthFrame({ title, body, top, children }: { title: string; body?: string; top?: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 gap-10 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:px-6">
      {/* Stays put while a long form scrolls beside it. */}
      <figure className="sticky top-4 hidden h-[calc(100dvh-5.5rem)] min-h-[32rem] flex-1 self-start overflow-hidden rounded-[2rem] lg:block">
        <Image
          src="/photos/ub-night.jpg"
          alt={t.welcome.photo}
          fill
          preload
          sizes="(min-width: 64rem) 50vw, 1px"
          className="object-cover object-[50%_40%] brightness-[0.45] saturate-[0.4]"
        />
        <figcaption className="absolute inset-x-0 bottom-0 p-10">
          <AppMark className="mb-6 size-12" />
          <p className="display max-w-lg text-[clamp(2rem,3.2vw,2.75rem)] leading-[1.08] text-chalk">{t.welcome.title}</p>
          <p className="mt-5 text-xs text-chalk/60">{t.welcome.credit}</p>
        </figcaption>
      </figure>

      <div className="flex w-full flex-col lg:w-[30rem] lg:shrink-0 lg:justify-center">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col pt-2 sm:pt-8 lg:flex-none lg:pb-10">
          {top}
          <AppMark className="mb-5 size-12 lg:hidden" />
          <PageTitle title={title} body={body} />
          {children}
        </div>
      </div>
    </div>
  );
}
