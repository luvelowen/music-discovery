'use client';

import { useRef, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useChat } from '@/lib/chat/provider';
import type { ChatProblem } from '@/lib/chat/types';
import { formatDateTime } from '@/lib/format-date';
import { useI18n } from '@/lib/i18n/provider';

export function ChatSettings() {
  const { t } = useI18n();
  const words = t.chat.settings;
  const { list, problem, act } = useChat();
  const [error, setError] = useState<ChatProblem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  if (!list) return <p role="status" className="text-sm text-muted">{problem ? t.chat.errors[problem] : t.chat.loading}</p>;
  const since = list.consentAt;

  async function turnOff() {
    const result = await act({ kind: 'off' });
    setError(result.ok ? null : result.error);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">{since === null ? words.off : words.on(formatDateTime(since))}</p>
      {since === null ? (
        <ButtonLink href="/chats" variant="secondary">{words.open}</ButtonLink>
      ) : (
        <Button variant="destructive" onClick={() => dialog.current?.showModal()}>{words.turnOff}</Button>
      )}
      {error && <p role="alert" className="w-full text-sm text-danger">{t.chat.errors[error]}</p>}
      <ConfirmDialog ref={dialog} title={words.confirmTitle} body={words.confirmBody} confirm={words.turnOff} cancel={t.community.person.keep} onConfirm={turnOff} />
    </div>
  );
}
