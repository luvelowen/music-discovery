'use client';

import { ArrowUpRight, Music2 } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { linkLabel } from '@/components/links/link-label';
import { useI18n } from '@/lib/i18n/provider';
import { artistName } from '@/lib/music/artists';
import type { Profile } from '@/lib/profile/types';
import { Avatar } from './avatar';

type Props = { profile: Profile; actions?: ReactNode; note?: ReactNode; focus?: boolean };

/**
 * Laid out like an artist's page: who it is, the one song, then the lists.
 * Draws only what it is given. Filter with getVisibleProfile before passing a profile in.
 */
export function ProfileCard({ profile, actions, note, focus }: Props) {
  const { t, locale } = useI18n();
  const { username, bio, genres, artists, tracks, anthem, answers, moments, outings, links } = profile;
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focus) heading.current?.focus();
  }, [focus]);

  const facts = [
    [t.profile.genres, genres.map((id) => t.genres[id])],
    [t.me.momentsTitle, moments.map((id) => t.me.moments[id])],
    [t.me.outingsTitle, outings.map((id) => t.me.outings[id])],
  ] as const;
  const group = 'mt-2.5 divide-y divide-line rounded-panel bg-surface px-4 sm:px-5';

  return (
    <article>
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:gap-8 sm:text-left">
        <Avatar profile={profile} className="size-32 text-5xl sm:size-44 sm:text-6xl" />
        <div className="min-w-0">
          <h1 ref={heading} tabIndex={focus ? -1 : undefined} className="text-[clamp(1.875rem,5vw,3rem)] leading-[1.1] font-bold [overflow-wrap:anywhere]">{username}</h1>
          {bio && <p dir="auto" className="mt-3 max-w-lg leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">{bio}</p>}
          {note}
          {actions && <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">{actions}</div>}
        </div>
      </div>

      {anthem && (
        <div className="mt-8 flex items-center gap-4 rounded-panel bg-surface px-4 py-4 sm:px-5">
          <Music2 className="size-7 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs text-muted">{t.me.anthem}</p>
            <p className="text-xl leading-snug font-bold [overflow-wrap:anywhere]">{anthem.title}</p>
            {anthem.artist && <p className="text-sm text-muted [overflow-wrap:anywhere]">{anthem.artist}</p>}
          </div>
        </div>
      )}

      <div className="mt-8 grid items-start gap-x-8 gap-y-8 md:grid-cols-2">
        {artists.length > 0 && (
          <section className="min-w-0">
            <h2 className="text-lg font-bold">{t.profile.artists}</h2>
            <ol className={group}>
              {artists.map((artist, index) => (
                <li key={artist.id} className="flex min-h-12 items-center gap-4 py-2.5">
                  <span aria-hidden className="w-4 shrink-0 text-right text-sm text-muted tabular-nums">{index + 1}</span>
                  <span className="min-w-0 font-medium [overflow-wrap:anywhere]">{artistName(artist, locale)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {tracks.length > 0 && (
          <section className="min-w-0">
            <h2 className="text-lg font-bold">{t.profile.tracks}</h2>
            <ol className={group}>
              {tracks.map((track, index) => (
                <li key={`${index}\n${track.title}`} className="flex min-h-12 items-center gap-4 py-2.5">
                  <span aria-hidden className="w-4 shrink-0 text-right text-sm text-muted tabular-nums">{index + 1}</span>
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="block font-medium">{track.title}</span>
                    {track.artist && <span className="block text-sm text-muted">{track.artist}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {answers.length > 0 && (
          <section className="min-w-0">
            <h2 className="text-lg font-bold">{t.me.answers}</h2>
            <dl className={group}>
              {answers.map((answer) => (
                <div key={answer.id} className="py-3">
                  <dt className="text-sm text-muted">{t.me.prompts[answer.id]}</dt>
                  <dd dir="auto" className="mt-1 leading-relaxed [overflow-wrap:anywhere]">{answer.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="min-w-0">
          <h2 className="text-lg font-bold">{t.me.about}</h2>
          <dl className={group}>
            {facts.map(([label, values]) => values.length > 0 && (
              <div key={label} className="py-3">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-1 leading-relaxed">{values.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </section>

        {links.length > 0 && (
          <section className="min-w-0">
            <h2 className="text-lg font-bold">{t.profile.links}</h2>
            <ul className={group}>
              {links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between gap-3 py-2 text-accent hover:underline">
                    <span className="min-w-0 [overflow-wrap:anywhere]">{linkLabel(link, t)}</span>
                    <ArrowUpRight className="size-4 shrink-0" aria-hidden />
                    <span className="sr-only">{t.profile.newTab}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
