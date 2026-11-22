'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LogOutButton } from '@/components/account/log-out-button';
import { SaveStatus } from '@/components/account/save-status';
import { Button, ButtonLink } from '@/components/ui/button';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';
import { STEPS, type Step } from '@/lib/steps';

export type StepProps = { editing: boolean };

type Props = StepProps & {
  step: Step;
  title: string;
  body: string;
  /** True when an optional step is empty, so the button can say "Skip for now". */
  skippable?: boolean;
  /** Return false to stay on this step, for example to show an error. */
  onNext: () => boolean;
  children: ReactNode;
};

export function StepFrame({ step, editing, title, body, skippable, onNext, children }: Props) {
  const { t } = useI18n();
  const { flush } = useAccount();
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const [busy, setBusy] = useState(false);

  const index = STEPS.indexOf(step);
  const following = STEPS[index + 1];
  const previous = STEPS[index - 1];

  useEffect(() => {
    heading.current?.focus({ preventScroll: true }); // Screen readers announce each new step.
  }, []);

  async function next() {
    if (busy || !onNext()) return;
    setBusy(true);
    // Move on only once the database has the changes.
    const saved = await flush();
    setBusy(false);
    if (saved) router.push(editing || !following ? '/profile' : `/setup/${following}`);
  }

  const nextLabel = editing ? t.setup.save : !following ? t.setup.finish : skippable ? t.setup.skipStep : t.setup.next;
  const backHref = editing ? '/profile' : previous ? `/setup/${previous}` : null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
      <div className="flex-1 px-5 pt-6 pb-10 sm:pt-10">
        {!editing && <p className="mb-2 text-sm text-muted">{t.setup.progress(index + 1, STEPS.length)}</p>}
        <h1 ref={heading} tabIndex={-1} className="title">{title}</h1>
        <p className="mt-2 leading-relaxed text-muted">{body}</p>
        <div className="mt-7">{children}</div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-line bg-night px-5 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <SaveStatus className="mb-2" />
        <div className="flex items-center justify-between gap-3">
          {backHref ? <ButtonLink href={backHref} variant="secondary">{t.setup.back}</ButtonLink> : <LogOutButton />}
          <Button onClick={next} aria-disabled={busy || undefined} className="min-w-0 flex-1 sm:min-w-44 sm:flex-none">{nextLabel}</Button>
        </div>
      </div>
    </div>
  );
}
