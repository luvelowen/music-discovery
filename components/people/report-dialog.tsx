'use client';

import { useState, type FormEvent, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Dialog } from '@/components/ui/dialog';
import { TextArea } from '@/components/ui/field';
import { useI18n } from '@/lib/i18n/provider';
import { useSocial } from '@/lib/social/store';
import { REPORT_REASONS, SOCIAL_LIMITS, type Person, type ReportReason } from '@/lib/social/types';

type Props = { ref: RefObject<HTMLDialogElement | null>; person: Person; onDone: () => void };

export function ReportDialog({ ref, person, onDone }: Props) {
  const { t } = useI18n();
  const words = t.community.report;
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [missing, setMissing] = useState(false);

  const { change } = useSocial();

  function clear() {
    setReason(null);
    setDetails('');
    setAlsoBlock(true);
    setMissing(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason) return setMissing(true);
    ref.current?.close();
    change({ kind: 'report', personId: person.id, reason, details, block: alsoBlock });
    onDone();
    clear();
  }

  return (
    <Dialog ref={ref} title={words.title(person.profile.username)} onClose={clear}>
      <p className="mt-3 rounded-control bg-raised p-3 text-sm leading-relaxed">{words.prototype}</p>
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
        <Choice type="checkbox" label={words.alsoBlock} checked={alsoBlock} onChange={(event) => setAlsoBlock(event.target.checked)} className="mt-2" />
        {missing && <p role="alert" className="mt-2 text-sm text-danger">{words.required}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => ref.current?.close()}>{t.community.person.keep}</Button>
          <Button type="submit" variant="danger">{words.submit}</Button>
        </div>
      </form>
    </Dialog>
  );
}
