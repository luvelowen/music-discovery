'use client';

import Link from 'next/link';
import { SeekingTags } from '@/components/profile/seeking-tags';
import { Cover, CoverRecord } from '@/components/artwork/cover';
import { useI18n } from '@/lib/i18n/provider';
import { artistName } from '@/lib/music/artists';
import { useProfile } from '@/lib/profile/store';
import type { Profile } from '@/lib/profile/types';
import { compareMusic } from '@/lib/social/shared';
import type { Person } from '@/lib/social/types';
import { RelationActions } from './relation-actions';

/** `seen` must come from seePerson(), so the card can only draw what is allowed. */
export function PersonCard({ person, seen }: { person: Person; seen: Profile }) {
  const { t, locale } = useI18n();
  const words = t.community.discover;
  const { profile } = useProfile();
  const music = compareMusic(profile, seen);

  const both = [
    ...music.artists.map((artist) => artistName(artist, locale)),
    ...music.genres.map((id) => t.genres[id]),
    ...music.tracks.map((track) => track.title),
  ];
  const fresh = music.newArtists.slice(0, 2).map((artist) => artistName(artist, locale));
  const href = `/people/${person.id}`;

  return (
    <article className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 py-6 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center sm:gap-x-8 lg:grid-cols-[16rem_minmax(0,1fr)_auto] lg:py-8">
      {/* The name below is the real link. This one is only a bigger target for mouse and touch. */}
      <Link href={href} tabIndex={-1} aria-hidden className="block">
        <Cover genres={seen.genres} className="w-full sm:hidden" />
        <CoverRecord genres={seen.genres} className="hidden w-full sm:block" />
      </Link>
      <div className="min-w-0">
        <h3 className="poster text-[clamp(1.875rem,4.5vw,3.75rem)] [overflow-wrap:anywhere]">
          <Link href={href} className="inline-flex min-h-7 items-center decoration-flame decoration-4 underline-offset-4 hover:underline">{seen.username}</Link>
        </h3>
        <p className="mt-2.5 text-xs text-muted">{t.community.demo.badge}</p>
        <SeekingTags seeking={seen.seeking} className="mt-2" />
        <dl className="mt-3 space-y-2 text-sm leading-snug">
          {both.length > 0 ? (
            <div>
              <dt className="text-muted">{words.both}</dt>
              <dd className="font-semibold text-flame [overflow-wrap:anywhere]">{both.join(', ')}</dd>
            </div>
          ) : (
            <div>
              <dt className="text-muted">{words.differentTaste}</dt>
              <dd className="font-semibold">{seen.genres.map((id) => t.genres[id]).join(', ')}</dd>
            </div>
          )}
          {fresh.length > 0 && (
            <div>
              <dt className="text-muted">{words.newArtists}</dt>
              <dd className="font-medium [overflow-wrap:anywhere]">{fresh.join(', ')}</dd>
            </div>
          )}
        </dl>
      </div>
      <div className="col-span-2 mt-4 sm:col-span-1 sm:col-start-2 lg:col-start-3 lg:mt-0 lg:max-w-64">
        <RelationActions person={person} compact />
      </div>
    </article>
  );
}
