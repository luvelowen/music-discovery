'use client';

import { useState } from 'react';
import { GenreTile } from '@/components/artwork/genre-tile';
import { useI18n } from '@/lib/i18n/provider';
import { GENRE_IDS } from '@/lib/music/genres';
import { LIMITS } from '@/lib/profile/types';
import { useGenreToggle } from '@/lib/profile/use-genre-toggle';
import { StepFrame, type StepProps } from './step-frame';

export function GenresStep({ editing }: StepProps) {
  const { t } = useI18n();
  const { genres, full, toggle } = useGenreToggle();
  const [attempted, setAttempted] = useState(false);
  const missing = attempted && genres.length === 0;

  function next() {
    setAttempted(true);
    if (genres.length > 0) return true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return false;
  }

  return (
    <StepFrame step="genres" editing={editing} title={t.genresStep.title} body={t.genresStep.body} onNext={next}>
      <div className="mb-5 min-h-6 text-sm">
        {missing ? (
          <p role="alert" className="text-danger">{t.genresStep.required}</p>
        ) : (
          <p aria-live="polite" className="font-medium text-pine">
            {full ? t.genresStep.limit : t.genresStep.selected(genres.length, LIMITS.genres)}
          </p>
        )}
      </div>
      <ul className="grid grid-cols-3 gap-x-3.5 gap-y-6 sm:grid-cols-6 sm:gap-x-4">
        {GENRE_IDS.map((id) => (
          <li key={id}>
            <GenreTile
              genre={id}
              label={t.genres[id]}
              position={genres.indexOf(id) + 1}
              blocked={full && !genres.includes(id)}
              onToggle={() => toggle(id)}
            />
          </li>
        ))}
      </ul>
    </StepFrame>
  );
}
