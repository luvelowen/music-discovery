import { useId, type ReactNode, type Ref } from 'react';

type Props = { ref: Ref<HTMLDialogElement>; title: string; onClose?: () => void; children: ReactNode };

/** The browser's own dialog: it traps focus, closes with Escape and returns focus afterwards. */
export function Dialog({ ref, title, onClose, children }: Props) {
  const id = useId();
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100%-2rem))] overflow-y-auto rounded-dialog bg-surface p-6 text-left text-chalk backdrop:bg-night/80 sm:p-8"
    >
      <h2 id={id} className="text-xl leading-tight font-semibold [overflow-wrap:anywhere]">{title}</h2>
      {children}
    </dialog>
  );
}
