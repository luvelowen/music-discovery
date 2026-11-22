'use client';

import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile } from '@/lib/profile/store';
import { isComplete } from '@/lib/profile/validation';
import { isEligible } from '@/lib/social/eligibility';
import { useSocial } from '@/lib/social/store';
import { EligibilityScreen } from './eligibility-screen';

/** Wrap every screen that shows other people in this. */
export function AppGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const profile = useProfile();
  const social = useSocial();

  if (!profile.ready || !social.ready) return <p role="status" className="gutter py-16 text-muted">{t.loading}</p>;

  if (!isComplete(profile.profile)) {
    const { incompleteTitle, incompleteBody, incompleteAction } = t.community.gate;
    return (
      <div className="gutter py-16 lg:py-24">
        <PageTitle title={incompleteTitle} body={incompleteBody} />
        <ButtonLink href="/setup/genres" className="mt-8">{incompleteAction}</ButtonLink>
      </div>
    );
  }

  if (!isEligible(social.social.eligibility)) return <EligibilityScreen />;

  return (
    <>
      <p className="gutter bg-mist py-2 text-sm text-muted">{t.community.demo.notice}</p>
      {(profile.saveFailed || social.saveFailed) && <p role="alert" className="gutter pt-3 text-sm text-danger">{t.setup.saveFailed}</p>}
      {children}
    </>
  );
}
