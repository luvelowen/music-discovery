'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { RemovableList } from '@/components/ui/removable-list';
import { useI18n } from '@/lib/i18n/provider';
import { artistName, suggestArtists, toArtist } from '@/lib/music/artists';
import { useProfile, useUpdateProfile } from '@/lib/profile/store';
import { LIMITS } from '@/lib/profile/types';
import { cleanText } from '@/lib/profile/validation';
import { hasContactInfo } from '@/lib/safety/contact-info';
import { StepFrame, type StepProps } from './step-frame';

type ArtistError = 'empty' | 'contactInfo' | 'duplicate' | 'full';

export function ArtistsStep({ editing }: StepProps) {
  const { t, locale } = useI18n();
  const { artists, genres } = useProfile().profile;
  const updateProfile = useUpdateProfile();
  const [text, setText] = useState('');
  const [error, setError] = useState<ArtistError | null>(null);

  const full = artists.length >= LIMITS.artists;
  const suggestions = full ? [] : suggestArtists(text, genres, artists);

  function add(input: string) {
    const name = cleanText(input);
    const artist = toArtist(name);
    const problem: ArtistError | null = !name ? 'empty'
      : hasContactInfo(name) ? 'contactInfo'
      : artists.some((item) => item.id === artist.id) ? 'duplicate'
      : full ? 'full'
      : null;

    setError(problem);
    if (problem) return false;
    updateProfile((profile) => ({ artists: [...profile.artists, artist] }));
    setText('');
    return true;
  }

  return (
    <StepFrame
      step="artists"
      editing={editing}
      title={t.artistsStep.title}
      body={t.artistsStep.body}
      skippable={!artists.length && !text.trim()}
      // A name typed without pressing Add is still kept.
      onNext={() => !text.trim() || add(text)}
    >
      <div className="max-w-xl">
        <form onSubmit={(event) => { event.preventDefault(); add(text); }}>
          <TextField
            label={t.artistsStep.label}
            placeholder={t.artistsStep.placeholder}
            value={text}
            maxLength={LIMITS.name}
            enterKeyHint="done"
            error={error && t.errors[error]}
            onChange={(event) => { setText(event.target.value); setError(null); }}
            action={<Button type="submit" variant="secondary" className="shrink-0"><Plus className="size-5" aria-hidden />{t.setup.add}</Button>}
          />
        </form>

        {suggestions.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-sm text-muted">{t.artistsStep.suggestions}</h2>
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((artist) => (
                <li key={artist.id}>
                  <button type="button" onClick={() => add(artist.name)} className="min-h-11 rounded-control bg-surface px-3.5 text-sm transition-colors hover:bg-line">
                    {artistName(artist, locale)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!full && text.trim() && suggestions.length === 0 && <p className="mt-4 text-sm text-muted">{t.artistsStep.noMatch}</p>}

        <p aria-live="polite" className="mt-8 mb-1 text-sm text-muted">{t.setup.count(artists.length, LIMITS.artists)}</p>
        <RemovableList
          items={artists.map((artist) => {
            const name = artistName(artist, locale);
            return {
              key: artist.id,
              title: name,
              onRemove: () => updateProfile((profile) => ({ artists: profile.artists.filter((item) => item.id !== artist.id) })),
            };
          })}
        />
      </div>
    </StepFrame>
  );
}
