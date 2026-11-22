'use client';

import { Check } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useI18n } from '@/lib/i18n/provider';
import { usePeople } from '@/lib/people/provider';
import type { PeopleInput, PeopleProblem, Seen } from '@/lib/people/types';

type Kind = Exclude<PeopleInput['kind'], 'report'>;

/** The right buttons for wherever two people stand. `compact` leaves out removal. */
export function RelationActions({ person, compact }: { person: Seen; compact?: boolean }) {
  const { t } = useI18n();
  const words = t.community.relation;
  const { act } = usePeople();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PeopleProblem | null>(null);
  const removeDialog = useRef<HTMLDialogElement>(null);
  const { relation, problem, id } = person;
  const name = person.profile.username;

  async function run(kind: Kind) {
    if (busy) return;
    setBusy(true);
    const result = await act({ kind, personId: id });
    setBusy(false);
    setError(result.ok ? null : result.error);
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={busy}>
      {relation === 'connected' && (
        <>
          {!compact && (
            <p role="status" className="flex min-h-11 items-center gap-2 text-sm text-muted">
              <Check className="size-4" aria-hidden />
              {words.connected}
            </p>
          )}
          <ButtonLink href={`/chats/${id}`} variant={compact ? 'secondary' : 'primary'} aria-label={t.chat.messageTo(name)}>{t.chat.message}</ButtonLink>
          {!compact && (
            <>
              <Button variant="quiet" onClick={() => removeDialog.current?.showModal()}>{words.remove}</Button>
              <ConfirmDialog
                ref={removeDialog}
                title={t.community.person.removeTitle(name)}
                body={t.community.person.removeBody}
                confirm={words.remove}
                cancel={t.community.person.keep}
                onConfirm={() => run('remove')}
              />
            </>
          )}
        </>
      )}

      {relation === 'incoming' && (
        <>
          <Button disabled={busy} aria-label={`${words.accept}: ${name}`} onClick={() => run('accept')}>{words.accept}</Button>
          <Button disabled={busy} variant="secondary" aria-label={`${words.decline}: ${name}`} onClick={() => run('decline')}>{words.decline}</Button>
        </>
      )}

      {relation === 'outgoing' && (
        <>
          <p role="status" className="flex min-h-11 items-center gap-2 text-sm text-muted">
            <Check className="size-4" aria-hidden />
            {words.requested}
          </p>
          <Button disabled={busy} variant="quiet" aria-label={`${words.cancel}: ${name}`} onClick={() => run('cancel')}>{words.cancel}</Button>
        </>
      )}

      {relation === 'none' && (problem ? (
        <p className={cn('flex items-center text-muted', compact ? 'text-xs' : 'min-h-11 text-sm')}>{words.problems[problem]}</p>
      ) : (
        <Button disabled={busy} variant={compact ? 'secondary' : 'primary'} aria-label={`${words.connect}: ${name}`} className="min-w-32" onClick={() => run('send')}>
          {words.connect}
        </Button>
      ))}

      {error && <p role="alert" className="w-full text-sm text-danger">{t.people.errors[error]}</p>}
    </div>
  );
}
