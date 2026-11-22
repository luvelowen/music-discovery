'use client';

import { useState } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile } from '@/lib/profile/store';
import { checkBio, checkUsername, isComplete } from '@/lib/profile/validation';
import { getVisibleProfile, type Viewer } from '@/lib/profile/visibility';
import { useSocial } from '@/lib/social/store';
import { STEPS } from '@/lib/steps';
import { DeleteData } from './delete-data';
import { ProfileCard } from './profile-card';

const VIEWERS: Viewer[] = ['stranger', 'connection'];

export function ProfileScreen() {
  const { t } = useI18n();
  const { profile, ready, saveFailed } = useProfile();
  const { social, ready: socialReady } = useSocial();
  const [viewer, setViewer] = useState<Viewer>('stranger');

  if (!ready || !socialReady) return <p role="status" className="gutter py-16 text-muted">{t.loading}</p>;

  if (!isComplete(profile)) {
    const aboutNeedsWork = checkUsername(profile.username) || checkBio(profile.bio);
    const target = profile.genres.length && aboutNeedsWork ? 'about' : 'genres';
    return (
      <div className="gutter py-16 lg:py-24">
        <h1 className="poster text-5xl sm:text-7xl">{t.profile.incompleteTitle}</h1>
        <p className="mt-3 mb-8 text-muted">{t.profile.incompleteBody}</p>
        <ButtonLink href={`/setup/${target}`}>{t.profile.incompleteAction}</ButtonLink>
      </div>
    );
  }

  return (
    <>
      <div className="gutter flex flex-col gap-6 pt-6 pb-7 lg:flex-row lg:items-end lg:justify-between lg:pt-10">
        <div>
          <h1 className="poster text-[clamp(2.75rem,6vw,5rem)]">{t.profile.title}</h1>
          <p className="mt-2 text-muted">{t.profile.body}</p>
        </div>
        <div role="group" aria-label={t.profile.viewAs} className="lg:w-96">
          <p className="mb-2 text-sm text-muted">{t.profile.viewAs}</p>
          <div className="grid grid-cols-2 gap-2">
            {VIEWERS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={viewer === option}
                onClick={() => setViewer(option)}
                className={cn(
                  'min-h-12 rounded-control border px-3 font-medium transition-colors',
                  viewer === option ? 'border-chalk bg-chalk text-night' : 'border-edge hover:border-chalk',
                )}
              >
                {t.profile[option]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sm:gutter">
        <p aria-live="polite" className="mb-5 px-5 text-sm leading-relaxed text-flame sm:px-0">
          {viewer === 'stranger' ? t.profile.strangerNote : t.profile.connectionNote}{' '}
          {profile.seeking.includes('dating') && t.profile.datingNote}
        </p>
        <ProfileCard profile={getVisibleProfile(profile, viewer, social.privacy, true)} />
      </div>

      <div className="gutter pt-8 pb-14">
        <div className="mb-9 flex flex-col items-start gap-x-5 gap-y-3 sm:flex-row sm:items-center">
          <ButtonLink href="/discover" className="w-full sm:w-auto">{t.profile.discover}</ButtonLink>
          {!social.privacy.discoverable && <p className="text-sm text-muted">{t.profile.hiddenNote}</p>}
        </div>
        <h2 className="font-semibold">{t.profile.edit}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {STEPS.map((step) => (
            <li key={step}>
              <ButtonLink href={`/setup/${step}?edit=1`} variant="secondary">{t.steps[step]}</ButtonLink>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">{t.profile.comingNext}</p>
        {saveFailed && <p role="alert" className="mt-2 text-sm text-danger">{t.setup.saveFailed}</p>}
        <DeleteData />
      </div>
    </>
  );
}
