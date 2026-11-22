'use client';

import { ButtonLink } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n/provider';
import { updateSocial, useSocial } from '@/lib/social/store';
import { REQUEST_RULES, type Privacy } from '@/lib/social/types';

export function PrivacySettings() {
  const { t } = useI18n();
  const words = t.community.settings;
  const { privacy } = useSocial().social;

  const save = (change: Partial<Privacy>) =>
    updateSocial((state) => ({ ...state, privacy: { ...state.privacy, ...change } }));

  return (
    <>
      <Switch label={words.discoverable} help={words.discoverableHelp} checked={privacy.discoverable} onChange={(discoverable) => save({ discoverable })} />
      <Switch label={words.showArtists} checked={privacy.showArtists} onChange={(showArtists) => save({ showArtists })} />
      <Switch label={words.showTracks} help={words.showHelp} checked={privacy.showTracks} onChange={(showTracks) => save({ showTracks })} />
      <fieldset className="pt-5">
        <legend className="font-medium">{words.requests}</legend>
        {REQUEST_RULES.map((rule) => (
          <Choice key={rule} type="radio" name="requests" label={words.rules[rule]} checked={privacy.requests === rule} onChange={() => save({ requests: rule })} />
        ))}
        <p className="mt-1 text-sm text-muted">{words.requestsHelp}</p>
      </fieldset>
      <ButtonLink href="/profile" variant="secondary" className="mt-6">{words.preview}</ButtonLink>
    </>
  );
}
