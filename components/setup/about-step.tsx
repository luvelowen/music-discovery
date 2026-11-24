'use client';

import { useRef } from 'react';
import { IdentityFields, type IdentityHandle } from '@/components/profile/identity-fields';
import { useI18n } from '@/lib/i18n/provider';
import { StepFrame, type StepProps } from './step-frame';

export function AboutStep({ editing }: StepProps) {
  const { t } = useI18n();
  const identity = useRef<IdentityHandle>(null);

  return (
    <StepFrame step="about" editing={editing} title={t.aboutStep.title} body={t.aboutStep.body} onNext={() => identity.current?.check() ?? false}>
      <IdentityFields handle={identity} />
    </StepFrame>
  );
}
