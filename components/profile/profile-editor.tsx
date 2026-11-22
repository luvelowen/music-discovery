'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { SaveStatus } from '@/components/account/save-status';
import { linkLabel } from '@/components/links/link-label';
import { SettingsSection } from '@/components/settings/settings-section';
import { Button, ButtonLink } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';
import { artistName } from '@/lib/music/artists';
import { useProfile, useUpdateProfile } from '@/lib/profile/store';
import { LIMITS, MOMENTS, OUTINGS } from '@/lib/profile/types';
import { AnswerFields } from './answer-fields';
import { ChipPicker } from './chip-picker';
import { IdentityFields, type IdentityHandle } from './identity-fields';
import { SeekingPicker } from './seeking-picker';

export function ProfileEditor() {
  const { t, locale } = useI18n();
  const words = t.me;
  const router = useRouter();
  const { flush } = useAccount();
  const { profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const identity = useRef<IdentityHandle>(null);
  const [busy, setBusy] = useState(false);

  async function done() {
    if (busy || !identity.current?.check()) return;
    setBusy(true);
    const saved = await flush();
    setBusy(false);
    if (saved) router.push('/profile');
  }

  const music = [
    ['genres', profile.genres.map((id) => t.genres[id])],
    ['artists', profile.artists.map((artist) => artistName(artist, locale))],
    ['tracks', profile.tracks.map((track) => track.title)],
    ['links', profile.links.map((link) => linkLabel(link, t))],
  ] as const;
  const anthem = profile.anthem ? profile.tracks.findIndex((track) => track.title === profile.anthem?.title && track.artist === profile.anthem.artist) : -1;

  return (
    <>
      <div className="gutter flex-1 pt-8 pb-10">
        <PageTitle title={words.editTitle} body={words.editBody} />

        <SettingsSection title={words.identity}>
          <div className="py-2"><IdentityFields handle={identity} /></div>
        </SettingsSection>

        <SettingsSection title={t.profile.seeking}>
          <SeekingPicker />
        </SettingsSection>

        <SettingsSection id="music" title={words.music}>
          <ul className="divide-y divide-line">
            {music.map(([step, values]) => (
              <li key={step}>
                <Link href={`/setup/${step}?edit=1`} className="flex min-h-14 items-center gap-3 py-2 hover:text-accent">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{t.steps[step]}</span>
                    <span className="block truncate text-sm text-muted">{values.length ? values.join(', ') : words.notAdded}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </SettingsSection>

        <SettingsSection id="anthem" title={words.anthem} body={words.anthemBody}>
          {profile.tracks.length ? (
            <div className="relative my-1">
              <select
                aria-label={words.anthem}
                value={anthem}
                onChange={(event) => updateProfile((current) => ({ anthem: current.tracks[Number(event.target.value)] ?? null }))}
                className="h-12 w-full min-w-0 appearance-none truncate rounded-control border border-edge bg-surface pr-11 pl-3 text-base"
              >
                <option value={-1}>{words.noAnthem}</option>
                {profile.tracks.map((track, index) => (
                  <option key={`${track.title}\n${track.artist}`} value={index}>{[track.title, track.artist].filter(Boolean).join(', ')}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-muted" aria-hidden />
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">{words.anthemEmpty}</p>
              <ButtonLink href="/setup/tracks?edit=1" variant="secondary">{t.tracksStep.add}</ButtonLink>
            </div>
          )}
        </SettingsSection>

        <SettingsSection id="answers" title={words.answers} body={words.answersBody}>
          <AnswerFields />
        </SettingsSection>

        <SettingsSection id="moments" title={words.momentsTitle} body={words.pickThree}>
          <div className="py-1">
            <ChipPicker label={words.momentsTitle} options={MOMENTS} names={words.moments} chosen={profile.moments} max={LIMITS.moments} onChange={(moments) => updateProfile(() => ({ moments }))} />
          </div>
        </SettingsSection>

        <SettingsSection id="outings" title={words.outingsTitle} body={words.pickThree}>
          <div className="py-1">
            <ChipPicker label={words.outingsTitle} options={OUTINGS} names={words.outings} chosen={profile.outings} max={LIMITS.outings} onChange={(outings) => updateProfile(() => ({ outings }))} />
          </div>
        </SettingsSection>
      </div>

      <div className="gutter sticky bottom-0 z-20 border-t border-line bg-night pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex max-w-3xl items-center justify-between gap-3">
          <SaveStatus />
          <Button onClick={done} aria-disabled={busy || undefined} className="min-w-32">{words.done}</Button>
        </div>
      </div>
    </>
  );
}
