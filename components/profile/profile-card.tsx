'use client';

import { linkLabel } from '@/components/links/link-label';
import { useI18n } from '@/lib/i18n/provider';
import { artistName } from '@/lib/music/artists';
import type { Profile } from '@/lib/profile/types';
import { Avatar } from './avatar';
import { SeekingTags } from './seeking-tags';

/** Draws only what it is given. Filter with getVisibleProfile before passing a profile in. */
export function ProfileCard({ profile, showIdentity = true }: { profile: Profile; showIdentity?: boolean }) {
  const { t, locale } = useI18n();
  const { username, bio, seeking, genres, artists, tracks, links } = profile;

  const row = 'grid gap-1 border-t border-line py-4 first:border-0 first:pt-0 last:pb-0 sm:grid-cols-[11rem_1fr] sm:gap-4';
  return (
    <article className="max-w-3xl rounded-panel bg-surface p-5">
      {showIdentity && (
        <div className="flex items-center gap-4 pb-5">
          <Avatar profile={profile} className="size-14" />
          <h2 className="min-w-0 text-xl font-semibold [overflow-wrap:anywhere]">{username}</h2>
        </div>
      )}
      {bio && <p className="max-w-xl pb-5 leading-relaxed [overflow-wrap:anywhere]">{bio}</p>}

      <dl>
        {seeking.length > 0 && (
          <div className={row}>
            <dt className="text-sm text-muted">{t.profile.seeking}</dt>
            <dd><SeekingTags seeking={seeking} /></dd>
          </div>
        )}
        <div className={row}>
          <dt className="text-sm text-muted">{t.profile.genres}</dt>
          <dd>{genres.map((id) => t.genres[id]).join(', ')}</dd>
        </div>
        {artists.length > 0 && (
          <div className={row}>
            <dt className="text-sm text-muted">{t.profile.artists}</dt>
            <dd className="[overflow-wrap:anywhere]">{artists.map((artist) => artistName(artist, locale)).join(', ')}</dd>
          </div>
        )}
        {tracks.length > 0 && (
          <div className={row}>
            <dt className="text-sm text-muted">{t.profile.tracks}</dt>
            <dd>
              <ul className="space-y-1.5">
                {tracks.map((track) => (
                  <li key={`${track.title}\n${track.artist}`} className="[overflow-wrap:anywhere]">
                    {track.title}
                    {track.artist && <span className="text-muted">, {track.artist}</span>}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {links.length > 0 && (
          <div className={row}>
            <dt className="text-sm text-muted">{t.profile.links}</dt>
            <dd className="flex flex-wrap gap-x-5">
              {links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent">
                  {linkLabel(link, t)}
                  <span className="sr-only">{t.profile.newTab}</span>
                </a>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}
