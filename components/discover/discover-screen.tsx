'use client';

import { useState } from 'react';
import { PersonCard } from '@/components/people/person-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { PageTitle } from '@/components/ui/page-title';
import { usePeople } from '@/lib/demo/use-people';
import { useI18n } from '@/lib/i18n/provider';
import { GENRE_IDS, type GenreId } from '@/lib/music/genres';
import { useProfile } from '@/lib/profile/store';
import { SEEKING, type Seeking } from '@/lib/profile/types';
import { isInDiscover, seePerson } from '@/lib/social/policy';
import { compareMusic } from '@/lib/social/shared';
import { useSocial } from '@/lib/social/store';
import { CommunityShelf } from './community-shelf';

export function DiscoverScreen({ community }: { community: GenreId | null }) {
  const { t } = useI18n();
  const words = t.community.discover;
  const { profile } = useProfile();
  const { social, change } = useSocial();
  const [choice, setChoice] = useState<Seeking | 'all'>('all');
  // The filter exists only for someone who chose both.
  const mode = profile.seeking.length > 1 ? choice : 'all';

  const visible = usePeople().flatMap((person) => {
    const seen = isInDiscover(social, profile, person) ? seePerson(social, profile, person) : null;
    return seen && (mode === 'all' || seen.seeking.includes(mode)) ? [{ person, seen, rank: compareMusic(profile, seen).rank }] : [];
  });

  // Followed first, then the genres I picked, then the rest.
  const order = new Set<GenreId>([...social.communities, ...profile.genres, ...GENRE_IDS]);
  const communities = [...order].map((id) => ({
    id,
    count: visible.filter(({ seen }) => seen.genres.includes(id)).length,
    joined: social.communities.includes(id),
  }));

  const shown = visible
    .filter(({ seen }) => !community || seen.genres.includes(community))
    .sort((a, b) => b.rank - a.rank);
  const joined = community !== null && social.communities.includes(community);

  return (
    <div className="gutter pt-8 pb-14">
      <PageTitle title={words.title} body={words.body} />

      {!social.privacy.discoverable && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 text-sm">
          <p className="leading-relaxed text-muted">{words.hidden}</p>
          <button type="button" onClick={() => change({ kind: 'privacy', patch: { discoverable: true } })} className="min-h-11 underline underline-offset-4 hover:text-accent">
            {words.show}
          </button>
        </div>
      )}

      {profile.seeking.length > 1 && (
        <div role="group" aria-label={words.mode} className="mt-5 flex gap-6 border-b border-line">
          {(['all', ...SEEKING] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setChoice(option)}
              className={cn('-mb-px min-h-11 min-w-11 border-b text-sm', mode === option ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-chalk')}
            >
              {option === 'all' ? words.all : t.seeking[option]}
            </button>
          ))}
        </div>
      )}

      <section aria-labelledby="communities-title" className="mt-5">
        <h2 id="communities-title" className="text-sm text-muted">{words.communities}</h2>
        <CommunityShelf communities={communities} selected={community} />
      </section>

      <section aria-labelledby="people-title" className="mt-6">
        {community ? (
          <div className="mb-4 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="people-title" className="text-lg font-semibold">{t.genres[community]}</h2>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">{words.communityBody}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={joined ? 'secondary' : 'primary'} onClick={() => change({ kind: 'community', genre: community, on: !joined })}>
                {joined ? words.leave : words.join}
              </Button>
              <ButtonLink href="/discover" scroll={false} variant="quiet">{words.everyone}</ButtonLink>
            </div>
          </div>
        ) : (
          <h2 id="people-title" className="sr-only">{words.peopleTitle}</h2>
        )}

        {shown.length ? (
          <ul className="divide-y divide-line border-t border-line">
            {shown.map(({ person, seen }) => (
              <li key={person.id}><PersonCard person={person} seen={seen} /></li>
            ))}
          </ul>
        ) : (
          <div className="border-t border-line py-6">
            <h3 className="font-semibold">{words.emptyTitle}</h3>
            <p className="mt-1 mb-5 text-muted">{words.emptyBody}</p>
            <ButtonLink href="/discover" variant="secondary">{words.showEveryone}</ButtonLink>
          </div>
        )}
      </section>
    </div>
  );
}
