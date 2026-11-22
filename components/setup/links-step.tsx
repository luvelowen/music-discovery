'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { linkLabel } from '@/components/links/link-label';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { RemovableList } from '@/components/ui/removable-list';
import { useI18n } from '@/lib/i18n/provider';
import { PROVIDERS, type LinkError, type MusicLink, type ProviderId } from '@/lib/music/providers';
import { useProfile, useUpdateProfile } from '@/lib/profile/store';
import { StepFrame, type StepProps } from './step-frame';

type Problem = LinkError | 'duplicate' | 'oneProfile' | 'full';
const SERVICES = ['instagram', 'spotify'] as const;

export function LinksStep({ editing }: StepProps) {
  const { t } = useI18n();
  const { links } = useProfile().profile;
  const updateProfile = useUpdateProfile();
  const [open, setOpen] = useState<Record<ProviderId, boolean>>({ instagram: false, spotify: false });
  const [text, setText] = useState<Record<ProviderId, string>>({ instagram: '', spotify: '' });
  const [errors, setErrors] = useState<Partial<Record<ProviderId, Problem>>>({});

  const typed = SERVICES.filter((service) => text[service].trim());

  /** Adds every given box at once, so two filled boxes can't overwrite each other. */
  function add(services: readonly ProviderId[]) {
    const added: MusicLink[] = [];
    const problems: Partial<Record<ProviderId, Problem>> = {};
    for (const service of services) {
      const result = PROVIDERS[service].parse(text[service]);
      if (!result.ok) {
        problems[service] = result.error;
        continue;
      }
      const mine = links.filter((item) => item.provider === service);
      const { link } = result;
      const problem: Problem | null = mine.some((item) => item.url === link.url) ? 'duplicate'
        : link.kind === 'profile' && mine.some((item) => item.kind === 'profile') ? 'oneProfile'
        : mine.length >= PROVIDERS[service].max ? 'full'
        : null;
      if (problem) problems[service] = problem;
      else added.push(link);
    }

    setErrors(problems);
    if (added.length) {
      updateProfile((profile) => ({ links: [...profile.links, ...added] }));
      setText((value) => ({ ...value, ...Object.fromEntries(added.map((link) => [link.provider, ''])) }));
      setOpen((value) => ({ ...value, ...Object.fromEntries(added.map((link) => [link.provider, false])) }));
    }
    return Object.keys(problems).length === 0;
  }

  return (
    <StepFrame
      step="links"
      editing={editing}
      title={t.linksStep.title}
      body={t.linksStep.body}
      skippable={!links.length && !typed.length}
      onNext={() => !typed.length || add(typed)}
    >
      <div className="space-y-3">
        {SERVICES.map((service) => {
          const words = t.linksStep[service];
          const room = links.filter((link) => link.provider === service).length < PROVIDERS[service].max;
          if (!room) return null;
          if (!open[service]) {
            return (
              <Button key={service} variant="secondary" className="w-full justify-start!" onClick={() => setOpen({ ...open, [service]: true })}>
                <Plus className="size-5" aria-hidden />
                {words.button}
              </Button>
            );
          }
          const error = errors[service];
          return (
            // noValidate: our own translated error replaces the browser's English one.
            <form key={service} noValidate onSubmit={(event) => { event.preventDefault(); add([service]); }} className="rounded-panel bg-surface p-4">
              <TextField
                autoFocus
                label={words.label}
                help={words.help}
                placeholder={words.placeholder}
                inputMode={service === 'spotify' ? 'url' : 'text'}
                autoCapitalize="none"
                spellCheck={false}
                value={text[service]}
                maxLength={500}
                error={error && t.errors[error]}
                onChange={(event) => {
                  setText({ ...text, [service]: event.target.value });
                  setErrors({ ...errors, [service]: undefined });
                }}
                action={<Button type="submit" className="shrink-0">{t.setup.add}</Button>}
              />
            </form>
          );
        })}
      </div>

      <div className="mt-5">
        <RemovableList
          items={links.map((link) => ({
            key: link.url,
            title: linkLabel(link, t),
            detail: link.url.replace('https://', ''),
            onRemove: () => updateProfile((profile) => ({ links: profile.links.filter((item) => item.url !== link.url) })),
          }))}
        />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">{t.linksStep.privacy}</p>
    </StepFrame>
  );
}
