'use client';

import { ArrowUpRight, Music2 } from 'lucide-react';
import { CoverRecord } from '@/components/artwork/cover';
import { Sleeve } from '@/components/artwork/sleeve';
import { useI18n } from '@/lib/i18n/provider';
import { artistName } from '@/lib/music/artists';
import type { Profile } from '@/lib/profile/types';
import { Avatar } from './avatar';

/** Draws only what it is given. Filter with getVisibleProfile before passing a profile in. */
export function ProfileCard({ profile, showIdentity = true }: { profile: Profile; showIdentity?: boolean }) {
  const { t, locale } = useI18n();
  const { username, bio, genres, artists, tracks, links } = profile;

  return (
    <article className="grid gap-x-16 gap-y-9 bg-mist px-5 py-8 sm:rounded-dialog sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:p-14">
      <div className="min-w-0">
        <CoverRecord genres={genres} className="w-full max-w-md" />
        {showIdentity && (
          <div className="mt-7 flex items-center gap-4">
            <Avatar profile={profile} className="size-16 sm:size-20" />
            <h2 className="min-w-0 text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{username}</h2>
          </div>
        )}
        {bio && <p className="mt-4 max-w-md text-lg leading-relaxed [overflow-wrap:anywhere]">{bio}</p>}
      </div>

      <div className="min-w-0 space-y-8">
        <section>
          <h3 className="mb-3 text-sm text-muted">{t.profile.genres}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {genres.map((id) => (
              <li key={id} className="flex items-center gap-3 font-medium">
                <Sleeve genre={id} className="size-10 shrink-0 rounded-sleeve border border-ink/10" />
                {t.genres[id]}
              </li>
            ))}
          </ul>
        </section>

        {artists.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm text-muted">{t.profile.artists}</h3>
            <ul className="text-2xl leading-snug font-semibold tracking-tight">
              {artists.map((artist) => <li key={artist.id} className="[overflow-wrap:anywhere]">{artistName(artist, locale)}</li>)}
            </ul>
          </section>
        )}

        {tracks.length > 0 && (
          <section>
            <h3 className="mb-1 text-sm text-muted">{t.profile.tracks}</h3>
            <ul className="divide-y divide-stone">
              {tracks.map((track) => (
                <li key={`${track.title}\n${track.artist}`} className="flex items-center gap-3 py-3">
                  <Music2 className="size-5 shrink-0 text-pine" aria-hidden />
                  <p className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="block font-medium">{track.title}</span>
                    <span className="block text-sm text-muted">{track.artist}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {links.length > 0 && (
          <section>
            <h3 className="mb-3 text-sm text-muted">{t.profile.links}</h3>
            <ul className="flex flex-wrap gap-2">
              {links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-control bg-ink px-4 font-medium text-paper transition-colors hover:bg-pine">
                    {t.linksStep[link.kind]}
                    <ArrowUpRight className="size-4" aria-hidden />
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
