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
        <h1 className="text-[clamp(1.875rem,4vw,2.875rem)] leading-[1.18] font-bold">{t.welcome.title}</h1>
        <p className="mt-4 max-w-sm leading-relaxed text-muted">{t.welcome.body}</p>
        <div className="mt-7 grid max-w-sm grid-cols-2 gap-2.5">
          <ButtonLink href="/signup">{t.account.signUp}</ButtonLink>
          <ButtonLink href="/login" variant="secondary">{t.account.logIn}</ButtonLink>
        </div>
        <LegalLinks className="mt-3" />
      </div>
      <figure className="max-md:order-first">
        <div className="relative aspect-[16/9] overflow-hidden rounded-dialog md:aspect-[4/5]">
          <Image src="/photos/ub-night.jpg" alt={t.welcome.photo} fill preload sizes="(min-width: 48rem) 26rem, 100vw" className="object-cover object-[50%_40%] brightness-75 saturate-50" />
        </div>
        <figcaption className="mt-2 text-xs text-muted">{t.welcome.credit}</figcaption>
      </figure>
    </div>
  );
}
