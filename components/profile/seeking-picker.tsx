'use client';

import { Choice } from '@/components/ui/choice';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile, useUpdateProfile } from '@/lib/profile/store';
import { SEEKING, type Seeking } from '@/lib/profile/types';

/** At least one always stays chosen. */
export function SeekingPicker() {
  const { t } = useI18n();
  const { seeking } = useProfile().profile;
  const updateProfile = useUpdateProfile();

  function toggle(value: Seeking) {
    updateProfile((profile) => {
      const next = SEEKING.filter((item) => (item === value) !== profile.seeking.includes(item));
      return next.length ? { seeking: next } : {};
    });
  }

  return (
    <fieldset>
      <legend className="mb-1 font-medium">{t.aboutStep.seeking}</legend>
      <div className="flex gap-8">
        {SEEKING.map((value) => (
          <Choice key={value} type="checkbox" label={t.seeking[value]} checked={seeking.includes(value)} onChange={() => toggle(value)} />
        ))}
      </div>
      <p className="mt-1 text-sm text-muted">{t.aboutStep.seekingHelp}</p>
    </fieldset>
  );
}
