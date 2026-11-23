'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { AppMark } from '@/components/ui/app-mark';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';

/**
 * Sign-in, sign-up, forgotten password and email codes.
 * Wide screens show the night photo beside the form. Phones show only the form.
 */
export function AuthFrame({ title, body, children }: { title: string; body?: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 gap-10 px-5 pb-6 lg:px-6">
      {/* Stays put while a long form (sign-up) scrolls beside it. */}
      <figure className="sticky top-4 hidden h-[calc(100dvh-5.5rem)] min-h-[30rem] flex-1 self-start overflow-hidden rounded-[1.75rem] lg:block">
        <Image
          src="/photos/ub-night.jpg"
          alt={t.welcome.photo}
          fill
          preload
          sizes="(min-width: 64rem) 50vw, 1px"
          className="object-cover object-[50%_40%] brightness-50 saturate-50"
        />
        <figcaption className="absolute inset-x-0 bottom-0 bg-night/55 px-10 py-8 backdrop-blur-md">
          <p className="max-w-md text-[2rem] leading-[1.15] font-bold text-chalk">{t.welcome.title}</p>
          <p className="mt-3 text-xs text-chalk/70">{t.welcome.credit}</p>
        </figcaption>
      </figure>

      <div className="flex w-full flex-col justify-center lg:w-[30rem] lg:shrink-0">
        <div className="mx-auto w-full max-w-sm pt-4 pb-10 sm:pt-10">
          <AppMark className="mb-6 size-14 rounded-[1rem] shadow-[0_0_0_1px_var(--color-line)]" />
          <PageTitle title={title} body={body} />
          {children}
        </div>
      </div>
    </div>
  );
}
