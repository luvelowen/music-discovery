'use client';

import Link from 'next/link';
import { Avatar } from '@/components/profile/avatar';
import { SeekingTags } from '@/components/profile/seeking-tags';
import { useI18n } from '@/lib/i18n/provider';
import { artistName } from '@/lib/music/artists';
import type { Seen } from '@/lib/people/types';
import { useProfile } from '@/lib/profile/store';
import { compareMusic } from '@/lib/social/shared';
import { RelationActions } from './relation-actions';

/** Used in Discover and in Connections. The server already removed what this viewer may not see. */
export function PersonCard({ person }: { person: Seen }) {
  const { t, locale } = useI18n();
  const words = t.community.discover;
  const { profile } = useProfile();
  const seen = person.profile;
  const music = compareMusic(profile, seen);

  const both = [
    ...music.artists.map((artist) => artistName(artist, locale)),
    ...music.genres.map((id) => t.genres[id]),
    ...music.tracks.map((track) => track.title),
  ];

  return (
    <article className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 py-5 md:grid-cols-[3.5rem_minmax(0,1fr)_auto] md:items-center">
      <Avatar profile={seen} className="size-14 text-lg" />
      <div className="min-w-0">
        <h3 className="font-semibold [overflow-wrap:anywhere]">
          <Link href={`/people/${person.id}`} className="inline-flex min-h-7 items-center underline-offset-4 hover:underline">{seen.username}</Link>
        </h3>
        <SeekingTags seeking={seen.seeking} className="text-sm text-accent" />
        <p className="mt-1 text-sm leading-relaxed [overflow-wrap:anywhere]">
          <span className="text-muted">{both.length ? words.both : words.differentTaste}: </span>
          {(both.length ? both : seen.genres.map((id) => t.genres[id])).join(', ')}
        </p>
        {seen.anthem && (
          <p className="text-sm leading-relaxed [overflow-wrap:anywhere]">
            <span className="text-muted">{t.me.anthemShort}: </span>
            {seen.anthem.title}
          </p>
        )}
      </div>
      <div className="col-start-2 md:col-start-3 md:max-w-72 md:justify-self-end">
        <RelationActions person={person} compact />
      </div>
    </article>
  );
}
