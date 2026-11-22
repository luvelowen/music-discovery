'use client';

import { ListMusic, Plus, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { RemovableList } from '@/components/ui/removable-list';
import { useI18n } from '@/lib/i18n/provider';
import { PROVIDERS, type LinkError } from '@/lib/music/providers';
import { updateProfile, useProfile } from '@/lib/profile/store';
import { LIMITS } from '@/lib/profile/types';
import { StepFrame, type StepProps } from './step-frame';

type Problem = LinkError | 'duplicate' | 'oneProfile' | 'full';

export function LinksStep({ editing }: StepProps) {
  const { t } = useI18n();
  const { links } = useProfile().profile;
  const [text, setText] = useState('');
  const [error, setError] = useState<Problem | null>(null);

  function add() {
    const result = PROVIDERS.spotify.parse(text);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    const { link } = result;
    const problem: Problem | null = links.some((item) => item.url === link.url) ? 'duplicate'
      : link.kind === 'profile' && links.some((item) => item.kind === 'profile') ? 'oneProfile'
      : links.length >= LIMITS.links ? 'full'
      : null;

    setError(problem);
    if (problem) return false;
    updateProfile((profile) => ({ links: [...profile.links, link] }));
    setText('');
    return true;
  }

  return (
    <StepFrame
      step="links"
      editing={editing}
      title={t.linksStep.title}
      body={t.linksStep.body}
      skippable={!links.length && !text.trim()}
      onNext={() => !text.trim() || add()}
    >
      <div className="max-w-xl">
        {/* noValidate: our own translated error replaces the browser's English one. */}
        <form noValidate onSubmit={(event) => { event.preventDefault(); add(); }}>
          <TextField
            label={t.linksStep.label}
            help={t.linksStep.help}
            placeholder="https://open.spotify.com/…"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            value={text}
            maxLength={500}
            error={error && t.errors[error]}
            onChange={(event) => { setText(event.target.value); setError(null); }}
            action={<Button type="submit" variant="secondary" className="shrink-0"><Plus className="size-5" aria-hidden />{t.setup.add}</Button>}
          />
        </form>
        <p className="mt-6 rounded-control bg-mist px-4 py-3 text-sm leading-relaxed">{t.linksStep.privacy}</p>

        <div className="mt-6">
          <RemovableList
            items={links.map((link) => {
              const Icon = link.kind === 'profile' ? UserRound : ListMusic;
              return {
                key: link.url,
                title: t.linksStep[link.kind],
                detail: link.url.replace('https://', ''),
                leading: <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-sleeve bg-sage"><Icon className="size-5" /></span>,
                onRemove: () => updateProfile((profile) => ({ links: profile.links.filter((item) => item.url !== link.url) })),
              };
            })}
          />
        </div>
      </div>
    </StepFrame>
  );
}
