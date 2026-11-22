'use client';

import type { ReactNode } from 'react';
import { SaveStatus } from '@/components/account/save-status';
import { ButtonLink } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';
import { isComplete } from '@/lib/profile/validation';

/** Wrap every screen that shows other people in this. Sign-in and age are already checked on the server. */
/** `bare` leaves out the notice, for screens such as chat that fill the window and say it themselves. */
export function AppGate({ children, bare }: { children: ReactNode; bare?: boolean }) {
  const { t } = useI18n();
  const { account, status } = useAccount();

  if (!isComplete(account.profile)) {
    const { incompleteTitle, incompleteBody, incompleteAction } = t.community.gate;
    return (
      <div className="gutter py-14">
        <PageTitle title={incompleteTitle} body={incompleteBody} />
        <ButtonLink href="/setup/genres" className="mt-6">{incompleteAction}</ButtonLink>
      </div>
    );
  }

  return (
    <>
      {!bare && <p className="gutter border-y border-line py-2 text-xs leading-relaxed text-muted">{t.community.demo.notice}</p>}
      {status !== 'saved' && status !== 'saving' && <SaveStatus className="gutter pt-3" />}
      {children}
    </>
  );
}
