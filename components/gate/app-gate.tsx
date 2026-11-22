'use client';

import type { ReactNode } from 'react';
import { EmailSecurity } from '@/components/account/email-security';
import { SaveStatus } from '@/components/account/save-status';
import { ButtonLink } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';
import { isComplete } from '@/lib/profile/validation';

/** Wrap every screen that shows other people in this. The server checks the same things again. */
export function AppGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { account, status, emailChecked } = useAccount();
  const words = t.community.gate;

  if (!isComplete(account.profile)) {
    return (
      <div className="gutter py-14">
        <PageTitle title={words.incompleteTitle} body={words.incompleteBody} />
        <ButtonLink href="/setup/genres" className="mt-6">{words.incompleteAction}</ButtonLink>
      </div>
    );
  }

  if (!emailChecked) {
    return (
      <div className="gutter py-14">
        <div className="max-w-xl">
          <PageTitle title={words.emailTitle} body={words.emailBody} />
          <div className="mt-6 rounded-panel bg-surface px-4 sm:px-5">
            <EmailSecurity password={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {status !== 'saved' && status !== 'saving' && <SaveStatus className="gutter pt-3" />}
      {children}
    </>
  );
}
