'use client';

import Image from 'next/image';
import { LegalLinks } from '@/components/legal/legal-links';
import { ButtonLink } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';

export function WelcomeScreen() {
  const { t } = useI18n();

  return (
    <div className="gutter grid flex-1 content-center items-center gap-x-16 gap-y-7 pt-2 pb-10 md:grid-cols-[1.15fr_1fr] md:py-10">
      <div>
        <h1 className="display text-[clamp(2rem,5vw,3.25rem)] leading-[1.06]">{t.welcome.title}</h1>
        <p className="mt-5 max-w-sm text-lg leading-relaxed text-muted">{t.welcome.body}</p>
        {/* Stacked and full width on phones, like Spotify's and Tinder's first screen. */}
        <div className="mt-8 grid max-w-sm gap-3 sm:grid-cols-2">
          <ButtonLink href="/signup" className="h-13 text-base">{t.account.signUp}</ButtonLink>
          <ButtonLink href="/login" variant="secondary" className="h-13 text-base">{t.account.logIn}</ButtonLink>
        </div>
        <LegalLinks className="mt-3" />
      </div>
      <figure className="max-md:order-first">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] md:aspect-[4/5]">
          <Image src="/photos/ub-night.jpg" alt={t.welcome.photo} fill preload sizes="(min-width: 48rem) 26rem, 100vw" className="object-cover object-[50%_40%] brightness-75 saturate-50" />
        </div>
        <figcaption className="mt-2 text-xs text-muted">{t.welcome.credit}</figcaption>
      </figure>
    </div>
  );
}
