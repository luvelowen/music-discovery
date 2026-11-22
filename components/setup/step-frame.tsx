'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import { Cover, CoverRecord } from '@/components/artwork/cover';
import { DeleteData } from '@/components/profile/delete-data';
import { Button, ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { artistName } from '@/lib/music/artists';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile } from '@/lib/profile/store';
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
  const { t, locale } = useI18n();
  const { profile, saveFailed } = useProfile();
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);

  const index = STEPS.indexOf(step);
  const following = STEPS[index + 1];
  const previous = STEPS[index - 1];

  useEffect(() => {
    heading.current?.focus({ preventScroll: true }); // Screen readers announce each new step.
  }, []);

  function next() {
    if (!onNext()) return;
    router.push(editing || !following ? '/profile' : `/setup/${following}`);
  }

  const nextLabel = editing ? t.setup.save : !following ? t.setup.finish : skippable ? t.setup.skipStep : t.setup.next;
  const backHref = editing ? '/profile' : previous ? `/setup/${previous}` : '/';

  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col">
        <div className="flex-1 px-5 pt-4 pb-10 lg:pt-8 lg:pr-16 lg:pl-[max(3rem,calc((100vw-80rem)/2))]">
          {!editing && (
            <nav aria-label={t.setup.progress(index + 1, STEPS.length)} className="mb-9 lg:mb-12">
              <ol className="grid grid-cols-5 gap-1.5 sm:gap-3">
                {STEPS.map((item, position) => {
                  const content = (
                    <>
                      <span className={cn('block h-1 rounded-sm transition-colors', position <= index ? 'bg-ink' : 'bg-stone')} />
                      <span className="mt-2 hidden text-sm sm:block">{t.steps[item]}</span>
                    </>
                  );
                  return (
                    <li key={item} className={position === index ? 'font-semibold' : 'text-muted'}>
                      {position < index ? (
                        <Link href={`/setup/${item}`} aria-label={t.steps[item]} className="flex min-h-11 flex-col justify-center hover:text-ink">{content}</Link>
                      ) : (
                        <span aria-current={position === index ? 'step' : undefined} className="flex min-h-11 flex-col justify-center">{content}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
              <p className="mt-1 text-sm text-muted sm:hidden">{t.setup.progress(index + 1, STEPS.length)}</p>
            </nav>
          )}

          <h1 ref={heading} tabIndex={-1} className="text-[clamp(1.875rem,3.4vw,2.75rem)] leading-[1.12] font-semibold tracking-[-0.02em]">
            {title}
          </h1>
          <p className="mt-3 max-w-xl leading-relaxed text-muted">{body}</p>
          <div className="mt-8">{children}</div>

          <div className="mt-10 flex flex-wrap items-center gap-x-4 text-sm text-muted lg:hidden">
            <p>{t.setup.localOnly}</p>
            <DeleteData />
          </div>
          {saveFailed && <p role="alert" className="mt-4 text-sm text-danger">{t.setup.saveFailed}</p>}
        </div>

        <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-stone bg-paper px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pr-16 lg:pl-[max(3rem,calc((100vw-80rem)/2))]">
          <ButtonLink href={backHref} variant="quiet" aria-label={t.setup.back} className="w-12 shrink-0 px-0! sm:w-auto sm:px-4!">
            <ArrowLeft className="size-5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t.setup.back}</span>
          </ButtonLink>
          <Cover genres={profile.genres} className="size-12 shrink-0 lg:hidden" />
          <Button onClick={next} className="min-w-0 flex-1 sm:ml-auto sm:min-w-44 sm:flex-none">{nextLabel}</Button>
        </div>
      </div>

      <aside className="hidden bg-mist lg:block">
        <div className="sticky top-0 flex min-h-[calc(100dvh-5rem)] flex-col px-10 py-10 xl:pr-[max(3rem,calc((100vw-80rem)/2))] xl:pl-14">
          <div className="my-auto w-full max-w-md self-center">
            <CoverRecord genres={profile.genres} className="w-full" />
            {profile.username && <p className="mt-6 text-2xl font-semibold tracking-tight break-all">{profile.username}</p>}
            <p className={cn('text-muted', profile.username ? 'mt-2' : 'mt-6')}>
              {profile.genres.length ? profile.genres.map((id) => t.genres[id]).join(', ') : t.setup.coverEmpty}
            </p>
            {profile.artists.length > 0 && (
              <p className="mt-2 leading-relaxed font-medium break-words">
                {profile.artists.map((artist) => artistName(artist, locale)).join(', ')}
              </p>
            )}
          </div>
          <div className="mt-8 text-sm text-muted">
            <p>{t.setup.localOnly}</p>
            <DeleteData />
          </div>
        </div>
      </aside>
    </div>
  );
}
