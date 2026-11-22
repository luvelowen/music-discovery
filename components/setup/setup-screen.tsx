'use client';

import type { ComponentType } from 'react';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile } from '@/lib/profile/store';
import type { Step } from '@/lib/steps';
import { AboutStep } from './about-step';
import { ArtistsStep } from './artists-step';
import { GenresStep } from './genres-step';
import { LinksStep } from './links-step';
import type { StepProps } from './step-frame';
import { TracksStep } from './tracks-step';

const SCREENS: Record<Step, ComponentType<StepProps>> = {
  genres: GenresStep,
  artists: ArtistsStep,
  tracks: TracksStep,
  links: LinksStep,
  about: AboutStep,
};

export function SetupScreen({ step, editing }: StepProps & { step: Step }) {
  const { t } = useI18n();
  const { ready } = useProfile();
  // Wait for saved data, so typing can never overwrite it with an empty profile.
  if (!ready) return <p role="status" className="gutter py-16 text-muted">{t.loading}</p>;

  const Screen = SCREENS[step];
  return <Screen editing={editing} />;
}
