'use client';

import { useRouter } from 'next/navigation';
import { useId, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { deleteEverything } from '@/lib/account';

export function DeleteData() {
  const { t } = useI18n();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();

  function confirm() {
    dialog.current?.close();
    deleteEverything();
    router.replace('/');
  }

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="min-h-11 text-sm underline underline-offset-4 hover:text-danger">
        {t.deleteData.trigger}
      </button>
      <dialog ref={dialog} aria-labelledby={`${id}-title`} className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-dialog bg-night p-6 text-chalk backdrop:bg-night/80 sm:p-8">
        <h2 id={`${id}-title`} className="text-2xl leading-tight font-display font-extrabold">{t.deleteData.title}</h2>
        <p className="mt-3 text-base leading-relaxed text-muted">{t.deleteData.body}</p>
        <div className="mt-7 grid grid-cols-2 gap-2">
          <Button autoFocus variant="secondary" onClick={() => dialog.current?.close()}>{t.deleteData.cancel}</Button>
          <Button variant="danger" onClick={confirm}>{t.deleteData.confirm}</Button>
        </div>
      </dialog>
    </>
  );
}
