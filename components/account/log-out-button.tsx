'use client';

import { useTransition } from 'react';
import { logOutAction } from '@/app/auth-actions';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';

export function LogOutButton() {
  const { t } = useI18n();
  const { flush, status } = useAccount();
  const [pending, start] = useTransition();

  function leave() {
    start(async () => {
      // Never throw away an unsaved change. If we're already signed out there's nowhere to save it.
      if ((await flush()) || status === 'signedOut') await logOutAction();
    });
  }

  return <Button variant="secondary" disabled={pending} onClick={leave}>{t.account.logOut}</Button>;
}
