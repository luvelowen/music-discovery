'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { useChat } from '@/lib/chat/provider';
import type { ChatProblem } from '@/lib/chat/types';
import { useI18n } from '@/lib/i18n/provider';

export function ChatConsent() {
  const { t } = useI18n();
  const words = t.chat.consent;
  const { act } = useChat();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ChatProblem | null>(null);

  async function agree() {
    setBusy(true);
    const result = await act({ kind: 'consent' });
    setBusy(false);
    setError(result.ok ? null : result.error);
  }

  return (
    <div className="gutter pt-8 pb-14">
      <div className="max-w-xl">
        <PageTitle title={words.title} body={words.body} />
        <ul className="mt-6 divide-y divide-line rounded-panel bg-surface px-4 text-sm leading-relaxed">
          {words.points.map((point) => <li key={point} className="py-3">{point}</li>)}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button disabled={busy} onClick={agree}>{words.agree}</Button>
          <ButtonLink href="/discover" variant="secondary">{words.later}</ButtonLink>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{t.chat.errors[error]}</p>}
      </div>
    </div>
  );
}
