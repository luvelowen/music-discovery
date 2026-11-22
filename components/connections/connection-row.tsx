'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Cover } from '@/components/artwork/cover';
import { RelationActions } from '@/components/people/relation-actions';
import { useI18n } from '@/lib/i18n/provider';
import { artistName } from '@/lib/music/artists';
import { useProfile } from '@/lib/profile/store';
import type { Profile } from '@/lib/profile/types';
import { compareMusic } from '@/lib/social/shared';
import type { Person } from '@/lib/social/types';

export function ConnectionRow({ person, seen, extra }: { person: Person; seen: Profile; extra?: ReactNode }) {
  const { t, locale } = useI18n();
  const music = compareMusic(useProfile().profile, seen);
  const both = [
    ...music.artists.map((artist) => artistName(artist, locale)),
    ...music.genres.map((id) => t.genres[id]),
    ...music.tracks.map((track) => track.title),
  ];

  return (
    <li className="flex flex-col gap-3 py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div className="flex min-w-0 items-center gap-4">
        <Cover genres={seen.genres} className="size-20 shrink-0" />
        <div className="min-w-0">
          <Link href={`/people/${person.id}`} className="inline-flex min-h-7 items-center text-lg font-semibold tracking-tight [overflow-wrap:anywhere] underline-offset-4 hover:underline">
            {seen.username}
          </Link>
          <p className="text-xs text-muted">{t.community.demo.badge}</p>
          <p className="mt-1.5 text-sm leading-snug">
            <span className="text-muted">{both.length ? t.community.discover.both : t.community.discover.differentTaste}: </span>
            <span className="font-semibold text-pine">{(both.length ? both : seen.genres.map((id) => t.genres[id])).join(', ')}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:max-w-[55%] lg:shrink-0 lg:justify-end">
        <RelationActions person={person} compact />
        {extra}
      </div>
    </li>
  );
}
