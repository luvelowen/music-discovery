'use client';

import Link from 'next/link';
import { startTransition, useActionState } from 'react';
import { codeAction, resendAction, type AuthState } from '@/app/auth-actions';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';
import type { Delivery } from '@/lib/server/mail';
import type { Purpose } from '@/lib/server/verification';
import { PasswordFields } from './password-fields';

export function CodeForm({ purpose, email, delivery }: { purpose: Purpose; email: string; delivery: Delivery }) {
  const { t } = useI18n();
  const words = t.account;
  const [{ error }, send, pending] = useActionState<AuthState, FormData>(codeAction, {});
  const [again, resend, resending] = useActionState<AuthState, FormData>(resendAction, {});

  const resetting = purpose === 'reset';
  const back = { signup: '/signup', reset: '/forgot', check: '/settings' }[purpose];
  const codeError = error && error !== 'password' && error !== 'match' ? words.errors[error] : null;

  return (
    <div className="mx-auto w-full max-w-sm px-5 pt-10 pb-16 sm:px-0 sm:pt-16">
      <PageTitle title={resetting ? words.resetTitle : words.codeTitle} body={resetting ? words.resetBody(email) : words.codeBody(email)} />
      {delivery === 'file' && (
        <p className="mt-5 rounded-panel bg-surface px-4 py-3 text-sm leading-relaxed">
          {words.fileDelivery} <code className="text-accent">data/outbox</code>
        </p>
      )}

      <form
        action={send}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => send(data));
        }}
        className="mt-7 space-y-5"
      >
        <TextField
          name="code"
          label={words.code}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={9}
          className="tracking-[0.3em]"
          error={codeError}
        />
        {resetting && <PasswordFields choosing error={error} />}
        <Button type="submit" disabled={pending} className="w-full disabled:opacity-70">
          {pending ? words.working : resetting ? words.savePassword : words.confirmCode}
        </Button>
      </form>

      <form action={resend} className="mt-4">
        <Button type="submit" variant="quiet" disabled={resending} className="px-0! text-sm">{words.resend}</Button>
        <p role="status" className="text-sm text-muted">{again.error ? words.errors[again.error] : again.sent ? words.resent : ''}</p>
      </form>
      <Link href={back} className="mt-2 inline-flex min-h-11 items-center text-sm text-accent hover:underline">{t.setup.back}</Link>
    </div>
  );
}
