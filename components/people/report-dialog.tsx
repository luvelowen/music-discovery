'use client';

import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Dialog } from '@/components/ui/dialog';
import { TextArea } from '@/components/ui/field';
import { useI18n } from '@/lib/i18n/provider';
import { usePeople } from '@/lib/people/provider';
import type { PeopleProblem } from '@/lib/people/types';
import { REPORT_REASONS, SOCIAL_LIMITS, type ReportReason } from '@/lib/social/types';

/** `name` is empty for a closed chat. `canAttach` means there may be messages the reporter can still attach. */
type Props = { ref: RefObject<HTMLDialogElement | null>; id: string; name: string; canAttach: boolean; onDone: () => void };

export function ReportDialog({ ref, id, name, canAttach, onDone }: Props) {
  const { t } = useI18n();
  const words = t.community.report;
  const { act } = usePeople();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [attach, setAttach] = useState(false);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<PeopleProblem | null>(null);
  const [busy, setBusy] = useState(false);
  const attempt = useRef<string | null>(null);

  function clear() {
    setReason(null);
    setDetails('');
    setAlsoBlock(true);
    setAttach(false);
    setMissing(false);
    setError(null);
    attempt.current = null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!reason) return setMissing(true);
    attempt.current ??= crypto.randomUUID(); // The same id on a retry, so it's saved once.
    setBusy(true);
    const result = await act({ kind: 'report', personId: id, id: attempt.current, reason, details, block: alsoBlock, evidence: attach });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onDone();
    // Blocking can already have taken this dialog off the screen.
    ref.current?.close();
    clear();
  }

  return (
    <Dialog ref={ref} title={name ? words.title(name) : words.titleUnnamed} onClose={clear}>
      <p className="mt-3 text-sm leading-relaxed text-muted">{words.note}</p>
      <form onSubmit={submit} className="mt-5">
        <fieldset>
          <legend className="font-medium">{words.question}</legend>
          {REPORT_REASONS.map((item) => (
            <Choice key={item} type="radio" name="reason" label={words.reasons[item]} checked={reason === item} onChange={() => { setReason(item); setMissing(false); }} />
          ))}
        </fieldset>
        <div className="mt-4">
          <TextArea label={words.details} value={details} maxLength={SOCIAL_LIMITS.reportDetails} onChange={(event) => setDetails(event.target.value)} />
        </div>
        {canAttach && (
          <>
            <Choice type="checkbox" label={words.attach} checked={attach} onChange={(event) => setAttach(event.target.checked)} className="mt-2" />
            <p className="mb-1 pl-8 text-xs leading-relaxed text-muted">{words.attachNote}</p>
          </>
        )}
        <Choice type="checkbox" label={words.alsoBlock} checked={alsoBlock} onChange={(event) => setAlsoBlock(event.target.checked)} />
        {missing && <p role="alert" className="mt-2 text-sm text-danger">{words.required}</p>}
        {error && <p role="alert" className="mt-2 text-sm text-danger">{t.people.errors[error]}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => ref.current?.close()}>{t.community.person.keep}</Button>
          <Button type="submit" variant="danger" disabled={busy}>{words.submit}</Button>
        </div>
      </form>
    </Dialog>
  );
}
