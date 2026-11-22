'use client';

import { CoverRecord } from '@/components/artwork/cover';
import { GenreTile } from '@/components/artwork/genre-tile';
import { ButtonLink } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { GENRE_IDS, type GenreId } from '@/lib/music/genres';
import { useProfile } from '@/lib/profile/store';
import { useGenreToggle } from '@/lib/profile/use-genre-toggle';
import { isComplete } from '@/lib/profile/validation';

const EXAMPLE: GenreId[] = ['morinKhuur', 'hipHop', 'mongolianPop', 'longSong', 'kPop'];

export function WelcomeScreen() {
  const { t } = useI18n();
  const { profile } = useProfile();
  const { genres, full, toggle } = useGenreToggle();

  const complete = isComplete(profile);
  const started = genres.length > 0;

  return (
    <>
      <section className="gutter grid items-center gap-x-16 gap-y-10 pt-6 pb-12 lg:grid-cols-[1.05fr_1fr] lg:pt-12 lg:pb-20">
        <div>
          <h1 className="text-[clamp(2.125rem,4.6vw,4rem)] leading-[1.08] font-semibold tracking-[-0.025em]">
            {t.welcome.title}
          </h1>
          <p className="mt-5 text-xl leading-snug text-pine lg:text-2xl">{t.welcome.subtitle}</p>
          <p className="mt-3 max-w-md leading-relaxed text-muted">{t.welcome.body}</p>
          <ButtonLink href={complete ? '/profile' : '/setup/genres'} className="mt-7 w-full px-7 sm:w-auto lg:mt-9">
            {complete ? t.welcome.view : started ? t.welcome.resume : t.welcome.start}
          </ButtonLink>
        </div>
        <figure className="mx-auto w-full max-w-md lg:max-w-xl">
          <CoverRecord genres={started ? genres : EXAMPLE} className="w-full" />
          <figcaption className="mt-4 text-sm text-muted">{started ? t.welcome.yourCover : t.welcome.exampleCover}</figcaption>
        </figure>
      </section>

      <section aria-labelledby="shelf-title" className="bg-mist py-10 lg:py-14">
        <div className="gutter">
          <h2 id="shelf-title" className="text-2xl font-semibold tracking-tight">{t.welcome.shelfTitle}</h2>
          <p aria-live="polite" className="mt-1 text-muted">{full ? t.genresStep.limit : t.welcome.shelfHint}</p>
        </div>
        <ul className="gutter mt-5 flex scroll-px-5 gap-4 overflow-x-auto py-3 lg:grid lg:grid-cols-9 lg:gap-x-4 lg:gap-y-7 lg:overflow-visible">
          {GENRE_IDS.map((id) => (
            <li key={id} className="w-28 shrink-0 lg:w-auto">
              <GenreTile
                genre={id}
                label={t.genres[id]}
                position={genres.indexOf(id) + 1}
                blocked={full && !genres.includes(id)}
                onToggle={() => toggle(id)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="gutter grid gap-8 py-12 md:grid-cols-3 md:gap-12 lg:py-16">
        {t.welcome.promises.map(({ title, body }) => (
          <div key={title}>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 max-w-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
