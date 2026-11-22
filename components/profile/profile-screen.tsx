'use client';

import { useState } from 'react';
import { SaveStatus } from '@/components/account/save-status';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { PageTitle } from '@/components/ui/page-title';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';
import { checkBio, checkUsername, isComplete } from '@/lib/profile/validation';
import { getVisibleProfile, type Viewer } from '@/lib/profile/visibility';
import { STEPS } from '@/lib/steps';
import { ProfileCard } from './profile-card';

const VIEWERS: Viewer[] = ['stranger', 'connection'];

export function ProfileScreen() {
  const { t } = useI18n();
  const { profile, social } = useAccount().account;
  const [viewer, setViewer] = useState<Viewer>('stranger');

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

  return (
    <div className="gutter pt-8 pb-14">
      <PageTitle title={t.profile.title} body={t.profile.body} />
      <SaveStatus className="mt-2" />

      <div role="group" aria-label={t.profile.viewAs} className="mt-6 flex gap-6 border-b border-line">
        {VIEWERS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={viewer === option}
            onClick={() => setViewer(option)}
            className={cn('-mb-px min-h-11 border-b text-sm', viewer === option ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-chalk')}
          >
            {t.profile[option]}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-3 mb-6 max-w-2xl text-sm leading-relaxed text-muted">
        {viewer === 'stranger' ? t.profile.strangerNote : t.profile.connectionNote}{' '}
        {profile.seeking.includes('dating') && t.profile.datingNote}
      </p>

      <ProfileCard profile={getVisibleProfile(profile, viewer, social.privacy, true)} />

      <div className="max-w-3xl pt-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <ButtonLink href="/discover">{t.profile.discover}</ButtonLink>
          {!profile.links.some((link) => link.provider === 'instagram') && (
            <ButtonLink href="/setup/links?edit=1" variant="secondary">{t.linksStep.instagram.button}</ButtonLink>
          )}
          <ButtonLink href="/account/data" variant="secondary">{t.account.myData}</ButtonLink>
        </div>
        {!social.privacy.discoverable && <p className="mt-3 text-sm text-muted">{t.profile.hiddenNote}</p>}

        <h2 className="mt-8 text-sm text-muted">{t.profile.edit}</h2>
        <ul className="mt-1 flex flex-wrap gap-x-5">
          {STEPS.map((step) => (
            <li key={step}>
              <ButtonLink href={`/setup/${step}?edit=1`} variant="quiet" className="px-0! underline underline-offset-4">{t.steps[step]}</ButtonLink>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm leading-relaxed text-muted">{t.profile.comingNext}</p>
      </div>
    </div>
  );
}
