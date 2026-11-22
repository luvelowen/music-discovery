'use client';

import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Avatar } from '@/components/profile/avatar';
import { Button } from '@/components/ui/button';
import { TextArea, TextField } from '@/components/ui/field';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';
import { resizePhoto } from '@/lib/profile/resize-photo';
import { useProfile, useUpdateProfile } from '@/lib/profile/store';
import { LIMITS } from '@/lib/profile/types';
import { checkBio, checkUsername } from '@/lib/profile/validation';

export type IdentityHandle = { check: () => boolean };
type Props = { handle: Ref<IdentityHandle> };

/**
 * Photo, username and bio. What's typed is saved only once it's valid,
 * so nobody else ever sees a half-typed name.
 */
export function IdentityFields({ handle }: Props) {
  const { t } = useI18n();
  const { profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { status } = useAccount();
  const [name, setName] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [attempted, setAttempted] = useState(false);
  const [photoError, setPhotoError] = useState<'photoType' | 'photoSize' | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const bioInput = useRef<HTMLTextAreaElement>(null);

  // Once saving has finished, a different saved name means the server found this one taken.
  const nameTaken = status !== 'saving' && !checkUsername(name) && name !== profile.username;
  const nameError = checkUsername(name) ?? (nameTaken ? 'usernameTaken' : null);
  const bioError = checkBio(bio);

  const check = () => {
    setAttempted(true);
    if (nameError) nameInput.current?.focus();
    else if (bioError) bioInput.current?.focus();
    return !nameError && !bioError;
  };
  useImperativeHandle(handle, () => ({ check }));

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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar profile={profile} className="size-24 text-3xl" />
          <div>
            <p className="mb-2 font-medium">{t.aboutStep.photo}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => picker.current?.click()}>
                {profile.photo ? t.aboutStep.changePhoto : t.aboutStep.choosePhoto}
              </Button>
              {profile.photo && <Button variant="quiet" onClick={() => updateProfile(() => ({ photo: null }))}>{t.aboutStep.removePhoto}</Button>}
            </div>
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
        <p className="mt-2 text-sm text-muted">{t.aboutStep.photoHelp}</p>
        {photoError && <p role="alert" className="mt-2 text-sm text-danger">{t.errors[photoError]}</p>}
      </div>

      <TextField
        ref={nameInput}
        label={t.aboutStep.username}
        help={t.aboutStep.usernameHelp}
        value={name}
        maxLength={LIMITS.usernameMax}
        autoCapitalize="none"
        spellCheck={false}
        error={nameError && (attempted || nameTaken) ? t.errors[nameError] : null}
        onChange={(event) => {
          const username = event.target.value;
          setName(username);
          if (!checkUsername(username)) updateProfile(() => ({ username }));
        }}
      />

      <div>
        <TextArea
          ref={bioInput}
          label={t.aboutStep.bio}
          help={t.aboutStep.bioHelp}
          placeholder={t.aboutStep.bioPlaceholder}
          value={bio}
          maxLength={LIMITS.bio}
          error={bioError && t.errors[bioError]}
          onChange={(event) => {
            const next = event.target.value;
            setBio(next);
            if (!checkBio(next)) updateProfile(() => ({ bio: next }));
          }}
        />
        <p className="mt-1 text-right text-xs text-muted tabular-nums">{bio.length}/{LIMITS.bio}</p>
      </div>
    </div>
  );
}
