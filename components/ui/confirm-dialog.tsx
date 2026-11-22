import type { RefObject } from 'react';
import { Button } from './button';
import { Dialog } from './dialog';

type Props = {
  ref: RefObject<HTMLDialogElement | null>;
  title: string;
  body: string;
  confirm: string;
  cancel: string;
  onConfirm: () => void;
};

export function ConfirmDialog({ ref, title, body, confirm, cancel, onConfirm }: Props) {
  function accept() {
    ref.current?.close();
    onConfirm();
  }

  return (
    <Dialog ref={ref} title={title}>
      <p className="mt-3 leading-relaxed text-muted">{body}</p>
      <div className="mt-7 grid grid-cols-2 gap-2">
        <Button autoFocus variant="secondary" onClick={() => ref.current?.close()}>{cancel}</Button>
        <Button variant="danger" onClick={accept}>{confirm}</Button>
      </div>
    </Dialog>
  );
}
