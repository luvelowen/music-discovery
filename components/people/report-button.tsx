'use client';

import { Flag } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { ReportDialog } from './report-dialog';

type Props = {
  id: string;
  name: string;
  canAttach: boolean;
  onDone: () => void;
  /** Tells rows apart for a screen reader when there is no name. */
  context?: string;
};

/** Reporting from places where the profile itself is gone: after a block, or once a chat has closed. */
export function ReportButton({ id, name, canAttach, onDone, context }: Props) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const label = t.community.person.report;
  const about = name || context;
  return (
    <>
      <Button variant="secondary" aria-label={about ? `${label}: ${about}` : undefined} onClick={() => dialog.current?.showModal()}>
        <Flag className="size-4" aria-hidden />
        {label}
      </Button>
      <ReportDialog ref={dialog} id={id} name={name} canAttach={canAttach} onDone={onDone} />
    </>
  );
}
