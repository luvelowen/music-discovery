'use client';

import { useActionState } from 'react';
import { startCheckAction, type AuthState } from '@/app/auth-actions';
import { Button, ButtonLink } from '@/components/ui/button';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';

export function EmailSecurity({ password = true }: { password?: boolean }) {
  const { t } = useI18n();
  const words = t.account;
  const { email, emailChecked } = useAccount();
  const [{ error }, start, pending] = useActionState<AuthState, FormData>(startCheckAction, {});

  return (
    <div className="divide-y divide-line">
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="[overflow-wrap:anywhere]">{email}</p>
          <p className="text-sm text-muted">{emailChecked ? words.emailChecked : words.emailNotChecked}</p>
        </div>
        {!emailChecked && (
          <form action={start}>
            <Button type="submit" variant={password ? 'secondary' : 'primary'} disabled={pending}>{words.checkEmail}</Button>
          </form>
        )}
        {error && <p role="alert" className="w-full text-sm text-danger">{words.errors[error]}</p>}
      </div>
      {password && (
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <p>{words.password}</p>
          <ButtonLink href="/forgot" variant="secondary">{words.changePassword}</ButtonLink>
        </div>
      )}
    </div>
  );
}
