'use client';

import { ChevronRight, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SaveStatus } from '@/components/account/save-status';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { PageTitle } from '@/components/ui/page-title';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';
import { missingParts, type CompletionItem } from '@/lib/profile/completion';
import { checkBio, checkUsername, isComplete } from '@/lib/profile/validation';
import { getVisibleProfile, type Viewer } from '@/lib/profile/visibility';
import { ProfileCard } from './profile-card';

const VIEWERS: Viewer[] = ['connection', 'stranger'];
const WHERE: Record<CompletionItem, string> = {
  photo: '', bio: '', anthem: '#anthem', answers: '#answers', moments: '#moments', outings: '#outings',
};

export function ProfileScreen() {
  const { t } = useI18n();
  const { profile, social } = useAccount().account;
  const [viewer, setViewer] = useState<Viewer>('connection');

  if (!isComplete(profile)) {
    const aboutNeedsWork = checkUsername(profile.username) || checkBio(profile.bio);
    const target = profile.genres.length && aboutNeedsWork ? 'about' : 'genres';
    return (
      <div className="gutter py-14">
        <PageTitle title={t.profile.incompleteTitle} body={t.profile.incompleteBody} />
        <ButtonLink href={`/setup/${target}`} className="mt-6">{t.profile.incompleteAction}</ButtonLink>
      </div>
    );
  }

  const missing = missingParts(profile);
  const hidden = !social.privacy.discoverable;

  return (
    <div className="gutter pt-5 pb-16 lg:pt-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div role="group" aria-label={t.profile.viewAs} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted">{t.profile.viewAs}</span>
          {VIEWERS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={viewer === option}
              onClick={() => setViewer(option)}
              className={cn('min-h-11 rounded-full px-4 text-sm', viewer === option ? 'bg-accent font-semibold text-night' : 'bg-surface text-chalk/85 hover:bg-raised')}
            >
              {t.profile[option]}
            </button>
          ))}
        </div>
        <SaveStatus quiet />
      </div>

      <ProfileCard
        profile={getVisibleProfile(profile, viewer, social.privacy, true)}
        actions={
          <>
            <ButtonLink href="/profile/edit"><Pencil className="size-4" aria-hidden />{t.me.edit}</ButtonLink>
            {!profile.links.some((link) => link.provider === 'instagram') && (
              <ButtonLink href="/setup/links?edit=1" variant="secondary">{t.linksStep.instagram.button}</ButtonLink>
            )}
          </>
        }
      />

      <p aria-live="polite" className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">
        {viewer === 'stranger' ? t.profile.strangerNote : t.profile.connectionNote}{' '}
        {profile.seeking.includes('dating') && t.profile.datingNote}
      </p>

      {(missing.length > 0 || hidden) && (
        <section className="mt-10 max-w-3xl">
          <h2 className="text-lg font-bold">{t.me.nextTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.me.nextBody}</p>
          <ul className="mt-2.5 divide-y divide-line rounded-panel bg-surface px-4 sm:px-5">
            {hidden && (
              <li>
                <Link href="/settings#privacy" className="flex min-h-13 items-center justify-between gap-3 py-2 text-accent">
                  {t.me.goVisible}
                  <ChevronRight className="size-5 shrink-0" aria-hidden />
                </Link>
              </li>
            )}
            {missing.map((item) => (
              <li key={item}>
                <Link href={`/profile/edit${WHERE[item]}`} className="flex min-h-13 items-center justify-between gap-3 py-2 hover:text-accent">
                  {t.me.next[item]}
                  <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ButtonLink href="/account/data" variant="quiet" className="mt-4 px-0! text-sm">{t.account.myData}</ButtonLink>
    </div>
  );
}
