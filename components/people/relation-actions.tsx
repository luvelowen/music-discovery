'use client';

import { Check } from 'lucide-react';
import { useRef } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile } from '@/lib/profile/store';
import { requestProblem } from '@/lib/social/policy';
import { useSocial } from '@/lib/social/store';
import type { Person } from '@/lib/social/types';

/** The right buttons for wherever two people stand. `compact` leaves out removal. */
export function RelationActions({ person, compact }: { person: Person; compact?: boolean }) {
  const { t } = useI18n();
  const words = t.community.relation;
  const { profile } = useProfile();
  const { social, change } = useSocial();
  const removeDialog = useRef<HTMLDialogElement>(null);
  const relation = social.relations[person.id];
  const name = person.profile.username;

  if (relation === 'connected') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p role="status" className="flex min-h-12 items-center gap-2 text-sm text-muted">
          <Check className="size-5" aria-hidden />
          {words.connected}
        </p>
        <ButtonLink href={`/chats/${person.id}`} variant={compact ? 'secondary' : 'primary'} aria-label={t.chat.messageTo(name)}>
          {t.chat.message}
        </ButtonLink>
        {!compact && (
          <>
            <Button variant="quiet" onClick={() => removeDialog.current?.showModal()}>{words.remove}</Button>
            <ConfirmDialog
              ref={removeDialog}
              title={t.community.person.removeTitle(name)}
              body={t.community.person.removeBody}
              confirm={words.remove}
              cancel={t.community.person.keep}
              onConfirm={() => change({ kind: 'remove', personId: person.id })}
            />
          </>
        )}
      </div>
    );
  }

  if (relation === 'incoming') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button aria-label={`${words.accept}: ${name}`} onClick={() => change({ kind: 'accept', personId: person.id })}>{words.accept}</Button>
        <Button variant="secondary" aria-label={`${words.decline}: ${name}`} onClick={() => change({ kind: 'decline', personId: person.id })}>{words.decline}</Button>
      </div>
    );
  }

  if (relation === 'outgoing') {
    return (
      <div className="flex flex-wrap items-center gap-x-2">
        <p role="status" className="flex min-h-12 items-center gap-2 text-sm text-muted">
          <Check className="size-5" aria-hidden />
          {words.requested}
        </p>
        <Button variant="quiet" aria-label={`${words.cancel}: ${name}`} onClick={() => change({ kind: 'cancel', personId: person.id })}>{words.cancel}</Button>
      </div>
    );
  }

  const problem = requestProblem(social, profile, person, Date.now());
  if (problem) return <p className="flex min-h-12 items-center text-sm text-muted">{words.problems[problem]}</p>;

  return (
    <Button
      variant={compact ? 'secondary' : 'primary'}
      aria-label={`${words.connect}: ${name}`}
      className="w-full sm:w-auto sm:min-w-36"
      onClick={() => change({ kind: 'send', personId: person.id })}
    >
      {words.connect}
    </Button>
  );
}
