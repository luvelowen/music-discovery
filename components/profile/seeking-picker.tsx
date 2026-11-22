'use client';

import { Check, Heart, UsersRound } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import { updateProfile, useProfile } from '@/lib/profile/store';
import { SEEKING, type Seeking } from '@/lib/profile/types';

const LOOK = {
  friends: { icon: UsersRound, on: 'border-blush bg-blush text-night' },
  dating: { icon: Heart, on: 'border-flame bg-flame text-night' },
};

/** At least one always stays chosen. */
export function SeekingPicker() {
  const { t } = useI18n();
  const { seeking } = useProfile().profile;

  function toggle(value: Seeking) {
    updateProfile((profile) => {
      const next = SEEKING.filter((item) => (item === value) !== profile.seeking.includes(item));
      return { seeking: next.length ? next : profile.seeking };
    });
  }

  return (
    <fieldset>
      <legend className="mb-3 font-medium">{t.aboutStep.seeking}</legend>
      <div className="grid grid-cols-[1fr_1.25fr] gap-2">
        {SEEKING.map((value) => {
          const active = seeking.includes(value);
          const Icon = LOOK[value].icon;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(value)}
              className={cn('flex min-h-24 flex-col justify-between rounded-control border p-3 text-left', active ? LOOK[value].on : 'border-edge hover:border-chalk')}
            >
              <span className="flex w-full justify-between">
                <Icon className="size-5" aria-hidden />
                {active && <Check className="size-5" aria-hidden />}
              </span>
              <span className="poster text-3xl">{t.seeking[value]}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted">{t.aboutStep.seekingHelp}</p>
    </fieldset>
  );
}
