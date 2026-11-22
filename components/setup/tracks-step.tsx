'use client';

import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { RemovableList } from '@/components/ui/removable-list';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile, useUpdateProfile } from '@/lib/profile/store';
import { LIMITS, type Track } from '@/lib/profile/types';
import { cleanText } from '@/lib/profile/validation';
import { hasContactInfo } from '@/lib/safety/contact-info';
import { StepFrame, type StepProps } from './step-frame';

type TrackError = 'trackIncomplete' | 'contactInfo' | 'duplicate' | 'full';

const trackKey = (track: Track) => `${track.title}\n${track.artist}`.toLocaleLowerCase();

export function TracksStep({ editing }: StepProps) {
  const { t } = useI18n();
  const { tracks } = useProfile().profile;
  const updateProfile = useUpdateProfile();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [error, setError] = useState<TrackError | null>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const typed = Boolean(title.trim() || artist.trim());

  function add() {
    const track = { title: cleanText(title), artist: cleanText(artist) };
    const problem: TrackError | null = !track.title || !track.artist ? 'trackIncomplete'
      : hasContactInfo(track.title) || hasContactInfo(track.artist) ? 'contactInfo'
      : tracks.some((item) => trackKey(item) === trackKey(track)) ? 'duplicate'
      : tracks.length >= LIMITS.tracks ? 'full'
      : null;

    setError(problem);
    if (problem) return false;
    updateProfile((profile) => ({ tracks: [...profile.tracks, track] }));
    setTitle('');
    setArtist('');
    return true;
  }

  return (
    <StepFrame
      step="tracks"
      editing={editing}
      title={t.tracksStep.title}
      body={t.tracksStep.body}
      skippable={!tracks.length && !typed}
      onNext={() => !typed || add()}
    >
      <div className="max-w-xl">
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (add()) titleInput.current?.focus(); }}>
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
            <TextField ref={titleInput} label={t.tracksStep.trackTitle} value={title} maxLength={LIMITS.name} onChange={(event) => { setTitle(event.target.value); setError(null); }} />
            <TextField label={t.tracksStep.trackArtist} value={artist} maxLength={LIMITS.name} onChange={(event) => { setArtist(event.target.value); setError(null); }} />
          </div>
          {error && <p role="alert" className="text-sm text-danger">{t.errors[error]}</p>}
          <Button type="submit" variant="secondary"><Plus className="size-5" aria-hidden />{t.tracksStep.add}</Button>
        </form>

        <p aria-live="polite" className="mt-8 mb-1 text-sm text-muted">{t.setup.count(tracks.length, LIMITS.tracks)}</p>
        <RemovableList
          items={tracks.map((track) => ({
            key: trackKey(track),
            title: track.title,
            detail: track.artist,
            onRemove: () => updateProfile((profile) => ({ tracks: profile.tracks.filter((item) => trackKey(item) !== trackKey(track)) })),
          }))}
        />
      </div>
    </StepFrame>
  );
}
