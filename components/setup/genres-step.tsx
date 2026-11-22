'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import { GENRE_IDS, RETIRED_GENRE_IDS } from '@/lib/music/genres';
import { LIMITS } from '@/lib/profile/types';
import { useGenreToggle } from '@/lib/profile/use-genre-toggle';
import { StepFrame, type StepProps } from './step-frame';

export function GenresStep({ editing }: StepProps) {
  const { t } = useI18n();
  const { genres, full, toggle } = useGenreToggle();
  const [attempted, setAttempted] = useState(false);
  // An old pick that's no longer offered stays listed, so it can be seen and removed.
  const [kept] = useState(() => RETIRED_GENRE_IDS.filter((id) => genres.includes(id)));
  const missing = attempted && genres.length === 0;

  function next() {
    setAttempted(true);
    if (genres.length > 0) return true;
    window.scrollTo({ top: 0 });
    return false;
  }

  return (
    <StepFrame step="genres" editing={editing} title={t.genresStep.title} body={t.genresStep.body} onNext={next}>
      <div className="mb-3 min-h-5 text-sm">
        {missing ? (
          <p role="alert" className="text-danger">{t.genresStep.required}</p>
        ) : (
          <p aria-live="polite" className="text-muted">
            {full ? t.genresStep.limit : t.genresStep.selected(genres.length, LIMITS.genres)}
          </p>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-5 rounded-panel bg-surface px-4 py-1">
        {[...GENRE_IDS, ...kept].map((id) => {
          const active = genres.includes(id);
          const blocked = full && !active;
          return (
            <li key={id} className="min-w-0 border-b border-line last:border-0 nth-last-2:odd:border-0">
              <button
                type="button"
                aria-pressed={active}
                aria-disabled={blocked || undefined}
                aria-label={t.genres[id]}
                onClick={() => toggle(id)}
                className={cn('flex min-h-12 w-full items-center justify-between gap-2 py-2 text-left leading-tight', active ? 'font-semibold text-accent' : blocked ? 'text-muted' : 'hover:text-accent')}
              >
                <span className="min-w-0 [overflow-wrap:anywhere]">{t.genres[id]}</span>
                {active && <Check className="size-4 shrink-0" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
    </StepFrame>
  );
}
