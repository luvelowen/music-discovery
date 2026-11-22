'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Dialog } from '@/components/ui/dialog';
import { deleteEverything } from '@/lib/account';
import { useI18n } from '@/lib/i18n/provider';

export function DeleteAccount() {
  const { t } = useI18n();
  const words = t.community.settings;
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [understood, setUnderstood] = useState(false);

  function confirm() {
    dialog.current?.close();
    deleteEverything();
    router.replace('/');
  }

  return (
    <>
      <Button variant="secondary" className="text-danger" onClick={() => dialog.current?.showModal()}>{words.deleteAction}</Button>
      <Dialog ref={dialog} title={words.deleteTitle} onClose={() => setUnderstood(false)}>
        <p className="mt-3 leading-relaxed text-muted">{words.deleteBody}</p>
        <Choice type="checkbox" label={words.understand} checked={understood} onChange={(event) => setUnderstood(event.target.checked)} className="mt-4" />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button autoFocus variant="secondary" onClick={() => dialog.current?.close()}>{t.community.person.keep}</Button>
          <Button variant="danger" disabled={!understood} className="disabled:opacity-40" onClick={confirm}>{words.deleteConfirm}</Button>
        </div>
      </Dialog>
    </>
  );
}
