'use client';

import { useRef, useState } from 'react';
import { Avatar } from '@/components/profile/avatar';
import { Button } from '@/components/ui/button';
import { TextArea, TextField } from '@/components/ui/field';
import { useI18n } from '@/lib/i18n/provider';
import { resizePhoto } from '@/lib/profile/resize-photo';
import { updateProfile, useProfile } from '@/lib/profile/store';
import { LIMITS } from '@/lib/profile/types';
import { checkBio, checkUsername } from '@/lib/profile/validation';
import { StepFrame, type StepProps } from './step-frame';

export function AboutStep({ editing }: StepProps) {
  const { t } = useI18n();
  const { profile } = useProfile();
  const [attempted, setAttempted] = useState(false);
  const [photoError, setPhotoError] = useState<'photoType' | 'photoSize' | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const bioInput = useRef<HTMLTextAreaElement>(null);

  const nameError = checkUsername(profile.username);
  const bioError = checkBio(profile.bio);

  async function choose(file?: File) {
    if (!file) return;
    if (file.size > LIMITS.photoBytes) return setPhotoError('photoSize');
    try {
      const photo = await resizePhoto(file);
      updateProfile(() => ({ photo }));
      setPhotoError(null);
    } catch {
      setPhotoError('photoType');
    }
  }

  function next() {
    setAttempted(true);
    if (nameError) nameInput.current?.focus();
    else if (bioError) bioInput.current?.focus();
    return !nameError && !bioError;
  }

  return (
    <StepFrame step="about" editing={editing} title={t.aboutStep.title} body={t.aboutStep.body} onNext={next}>
      <div className="max-w-xl space-y-7">
        <TextField
          ref={nameInput}
          label={t.aboutStep.username}
          help={t.aboutStep.usernameHelp}
          value={profile.username}
          maxLength={LIMITS.usernameMax}
          autoCapitalize="none"
          spellCheck={false}
          error={attempted && nameError ? t.errors[nameError] : null}
          onChange={(event) => {
            const username = event.target.value;
            updateProfile(() => ({ username }));
          }}
        />
        <div>
          <TextArea
            ref={bioInput}
            label={t.aboutStep.bio}
            help={t.aboutStep.bioHelp}
            placeholder={t.aboutStep.bioPlaceholder}
            value={profile.bio}
            maxLength={LIMITS.bio}
            error={bioError && t.errors[bioError]}
            onChange={(event) => {
              const bio = event.target.value;
              updateProfile(() => ({ bio }));
            }}
          />
          <p className="mt-1 text-right text-sm text-muted tabular-nums">{profile.bio.length}/{LIMITS.bio}</p>
        </div>

        <div>
          <h2 className="mb-3 font-medium">{t.aboutStep.photo}</h2>
          <div className="flex items-center gap-4">
            <Avatar profile={profile} className="size-20" />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => picker.current?.click()}>
                {profile.photo ? t.aboutStep.changePhoto : t.aboutStep.choosePhoto}
              </Button>
              {profile.photo && (
                <Button variant="quiet" onClick={() => updateProfile(() => ({ photo: null }))}>{t.aboutStep.removePhoto}</Button>
              )}
            </div>
            <input
              ref={picker}
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                void choose(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </div>
          <p className="mt-3 text-sm text-muted">{t.aboutStep.photoHelp}</p>
          {photoError && <p role="alert" className="mt-2 text-sm text-danger">{t.errors[photoError]}</p>}
        </div>
      </div>
    </StepFrame>
  );
}
