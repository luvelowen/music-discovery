'use client';

import type { ComponentType } from 'react';
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
  const Screen = SCREENS[step];
  return <Screen editing={editing} />;
}
