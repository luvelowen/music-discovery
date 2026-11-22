'use client';

import { startTransition, useActionState, useRef, useState } from 'react';
import { deleteAccountAction, type AuthState } from '@/app/auth-actions';
import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Dialog } from '@/components/ui/dialog';
import { TextField } from '@/components/ui/field';
import { useI18n } from '@/lib/i18n/provider';

export function DeleteAccount() {
  const { t } = useI18n();
  const words = t.community.settings;
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [understood, setUnderstood] = useState(false);
  const [{ error }, send, pending] = useActionState<AuthState, FormData>(deleteAccountAction, {});

  function clear() {
    setUnderstood(false);
    form.current?.reset();
  }

  return (
    <>
      <Button variant="destructive" onClick={() => dialog.current?.showModal()}>{words.deleteAction}</Button>
      <Dialog ref={dialog} title={words.deleteTitle} onClose={clear}>
        <p className="mt-3 leading-relaxed text-muted">{words.deleteBody}</p>
        <form
          ref={form}
          action={send}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            startTransition(() => send(data));
          }}
          className="mt-5"
        >
          <TextField name="password" type="password" label={t.account.deletePassword} autoComplete="current-password" maxLength={128} error={error ? t.account.errors[error] : null} />
          <Choice type="checkbox" label={words.understand} checked={understood} onChange={(event) => setUnderstood(event.target.checked)} className="mt-3" />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button autoFocus variant="secondary" onClick={() => dialog.current?.close()}>{t.community.person.keep}</Button>
            <Button type="submit" variant="danger" disabled={!understood || pending} className="disabled:opacity-40">{words.deleteConfirm}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
