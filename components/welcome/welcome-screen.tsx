'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CoverRecord } from '@/components/artwork/cover';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import { GENRE_IDS, type GenreId } from '@/lib/music/genres';
import { useProfile } from '@/lib/profile/store';
import { useGenreToggle } from '@/lib/profile/use-genre-toggle';
import { isComplete } from '@/lib/profile/validation';

const EXAMPLE: GenreId[] = ['hipHop', 'mongolianPop', 'kPop', 'rock', 'rnb'];
// Credited as thanks. The sources are in DESIGN.md.
const PHOTOGRAPHERS = ['@sterre_reeuwijk', '@noiseporn', '@onegrandtrip', '@naranbayar_1'];

export function WelcomeScreen() {
  const { t, locale } = useI18n();
  const words = t.welcome;
  const { profile } = useProfile();
  const { genres, full, toggle } = useGenreToggle();

  const complete = isComplete(profile);
  const started = genres.length > 0;

  return (
    <>
      <section>
        <div className="relative flex h-[clamp(20rem,64svh,46rem)] flex-col justify-end overflow-hidden">
          <Image src="/photos/red-crowd.jpg" alt="" fill preload sizes="100vw" className="object-cover object-[50%_70%]" />
          <h1 className="gutter poster relative pb-5 text-[clamp(3rem,8.4vw,8rem)] lg:pb-8">
            <span className="block max-w-[14ch]">{words.title}</span>
          </h1>
        </div>
        <div className="gutter flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10 lg:py-8">
          <p className="max-w-xl text-lg leading-snug lg:text-xl">{words.body}</p>
          <ButtonLink href={complete ? '/profile' : '/setup/genres'} className="w-full shrink-0 px-8! text-lg sm:w-auto sm:min-h-14">
            {complete ? words.view : started ? words.resume : words.start}
          </ButtonLink>
        </div>
      </section>

      <section className="grid grid-cols-5 lg:grid-cols-12">
        <div className="relative col-span-5 aspect-[4/3] lg:col-span-7 lg:aspect-auto lg:min-h-[32rem]">
          <Image src="/photos/turntable.jpg" alt="" fill sizes="(min-width: 64rem) 58vw, 100vw" className="object-cover" />
        </div>
        <div className="col-span-5 flex flex-col justify-end bg-flame px-5 py-10 text-night sm:px-10 lg:p-12">
          <h2 className="poster text-[clamp(3rem,6vw,5.75rem)]">{words.datesTitle}</h2>
          <p className="mt-5 max-w-md text-lg leading-snug">{words.datesBody}</p>
        </div>
        <div className="col-span-5 flex flex-col justify-center bg-blush px-5 py-10 text-night sm:px-10 lg:col-span-4 lg:p-12">
          <h2 className="poster text-[clamp(2.75rem,4.4vw,4.25rem)]">{words.friendsTitle}</h2>
          <p className="mt-5 max-w-md text-lg leading-snug">{words.friendsBody}</p>
        </div>
        <div className="relative col-span-5 aspect-[16/9] lg:col-span-8 lg:aspect-auto lg:min-h-[26rem]">
          <Image src="/photos/red-hands.jpg" alt="" fill sizes="(min-width: 64rem) 66vw, 100vw" className="object-cover brightness-75 contrast-150" />
        </div>
      </section>

      <section className="gutter grid items-center gap-x-16 gap-y-10 py-14 lg:grid-cols-[1fr_1.15fr] lg:py-24">
        <div>
          <h2 className="poster text-[clamp(3rem,6vw,5.75rem)]">{words.screenTitle}</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">{words.screenBody}</p>
        </div>
        <figure className="min-w-0">
          <div className="flex items-start gap-3 sm:gap-6">
            <Image src={`/screens/discover-${locale}.jpg`} alt={words.screenDiscover} width={780} height={1560} sizes="(min-width: 64rem) 22rem, 55vw" className="h-auto w-[56%] border border-seam" />
            <Image src={`/screens/person-${locale}.jpg`} alt={words.screenPerson} width={780} height={1560} sizes="(min-width: 64rem) 18rem, 45vw" className="mt-16 h-auto min-w-0 flex-1 border border-seam" />
          </div>
          <figcaption className="mt-4 text-sm text-muted">{words.screenCaption}</figcaption>
        </figure>
      </section>

      <section aria-labelledby="shelf-title" className="gutter grid items-center gap-x-16 gap-y-8 bg-cherry py-14 lg:grid-cols-[1.35fr_1fr] lg:py-20">
        <div className="min-w-0">
          <h2 id="shelf-title" className="poster text-[clamp(2.75rem,5vw,4.5rem)]">{words.shelfTitle}</h2>
          <p aria-live="polite" className="mt-3 text-muted">{full ? t.genresStep.limit : words.shelfHint}</p>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-1">
            {GENRE_IDS.map((id) => {
              const position = genres.indexOf(id) + 1;
              const blocked = full && !position;
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={position > 0}
                    aria-disabled={blocked || undefined}
                    aria-label={t.genres[id]}
                    onClick={() => toggle(id)}
                    className={cn(
                      'poster min-h-12 py-1 text-left text-[clamp(2rem,4.4vw,3.75rem)] transition-colors',
                      position ? 'text-flame underline decoration-4 underline-offset-4' : blocked ? 'text-muted' : 'hover:text-blush',
                    )}
                  >
                    {t.genres[id]}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <figure className="w-full max-w-md justify-self-center">
          <CoverRecord genres={started ? genres : EXAMPLE} className="w-full" />
          <figcaption className="mt-4 text-sm text-muted">{started ? words.yourCover : words.exampleCover}</figcaption>
        </figure>
      </section>

      <section className="grid lg:grid-cols-[1fr_1.2fr]">
        <div className="relative aspect-square lg:aspect-auto lg:min-h-[36rem]">
          <Image src="/photos/ub-night.jpg" alt="" fill sizes="(min-width: 64rem) 46vw, 100vw" className="object-cover object-[50%_40%]" />
        </div>
        <div className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:p-16">
          <h2 className="poster max-w-2xl text-[clamp(2.75rem,5vw,4.5rem)]">{words.dataTitle}</h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed">{words.dataBody}</p>
          <Link href="/settings#data" className="mt-4 inline-flex min-h-11 items-center self-start text-flame underline underline-offset-4">{words.dataMore}</Link>
          <p className="mt-10 text-xs leading-relaxed text-muted">{words.credits} {PHOTOGRAPHERS.join(', ')}</p>
        </div>
      </section>
    </>
  );
}
