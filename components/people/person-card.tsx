'use client';

import Link from 'next/link';
import { SeekingTags } from '@/components/profile/seeking-tags';
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

  return (
    <article className="grid gap-x-8 gap-y-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <h3 className="flex flex-wrap items-baseline gap-x-3 font-semibold [overflow-wrap:anywhere]">
          <Link href={`/people/${person.id}`} className="inline-flex min-h-7 items-center underline-offset-4 hover:underline">{seen.username}</Link>
          <span className="text-xs font-normal text-muted">{t.community.demo.badge}</span>
        </h3>
        <SeekingTags seeking={seen.seeking} className="mt-0.5 text-sm text-muted" />
        <p className="mt-1.5 text-sm leading-relaxed [overflow-wrap:anywhere]">
          <span className="text-muted">{both.length ? words.both : words.differentTaste}: </span>
          {(both.length ? both : seen.genres.map((id) => t.genres[id])).join(', ')}
        </p>
      </div>
      <div className="sm:max-w-64">
        <RelationActions person={person} compact />
      </div>
    </article>
  );
}
