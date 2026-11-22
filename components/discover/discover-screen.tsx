'use client';

import { Search } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { PersonCard } from '@/components/people/person-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';
import { GENRE_IDS, type GenreId } from '@/lib/music/genres';
import { usePeople } from '@/lib/people/provider';
import type { DiscoverPage, PeopleProblem } from '@/lib/people/types';
import { useProfile } from '@/lib/profile/store';
import { SEEKING, type Seeking } from '@/lib/profile/types';
import { useSocial } from '@/lib/social/store';
import { CommunityShelf } from './community-shelf';

const STEP = 30;
const CHECK_EVERY = 15_000;

export function DiscoverScreen({ community }: { community: GenreId | null }) {
  const { t } = useI18n();
  const words = t.community.discover;
  const { profile } = useProfile();
  const { social, change } = useSocial();
  const { getDiscover, revision } = usePeople();

  const [choice, setChoice] = useState<Seeking | 'all'>('all');
  const [typed, setTyped] = useState('');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(STEP);
  const [page, setPage] = useState<DiscoverPage | null>(null);
  const [problem, setProblem] = useState<PeopleProblem | null>(null);
  // The filter exists only for someone who chose both.
  const mode = profile.seeking.length > 1 ? choice : 'all';
  const settledSearch = useDeferredValue(search);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(typed.trim()), 250);
    return () => clearTimeout(timer);
  }, [typed]);

  useEffect(() => {
    let current = true;
    async function load() {
      const query = new URLSearchParams({ limit: String(limit) });
      if (community) query.set('genre', community);
      if (mode !== 'all') query.set('seeking', mode);
      if (settledSearch) query.set('search', settledSearch);
      const result = await getDiscover(query);
      if (!current) return;
      setProblem(result.ok ? null : result.error);
      if (result.ok) setPage(result.value);
    }
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, CHECK_EVERY);
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, [community, mode, settledSearch, limit, revision, getDiscover]);

  // Followed first, then the genres I picked, then the rest.
  const order = new Set<GenreId>([...social.communities, ...profile.genres, ...GENRE_IDS]);
  const communities = [...order].map((id) => ({ id, count: page?.counts[id] ?? 0, joined: social.communities.includes(id) }));
  const joined = community !== null && social.communities.includes(community);
  const filtered = Boolean(community || settledSearch || mode !== 'all');

  return (
    <div className="gutter pt-8 pb-16">
      <PageTitle title={words.title} body={words.body} />

      {!social.privacy.discoverable && (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-panel bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm leading-relaxed">{words.hidden}</p>
          <Button className="shrink-0" onClick={() => change({ kind: 'privacy', patch: { discoverable: true } })}>{words.show}</Button>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative block min-w-0 md:order-2 md:w-72">
          <span className="sr-only">{words.search}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={typed}
            maxLength={80}
            onChange={(event) => {
              setTyped(event.target.value);
              setLimit(STEP);
            }}
            placeholder={words.search}
            className="h-11 w-full rounded-control bg-raised pr-3 pl-10 text-base placeholder:text-muted"
          />
        </label>
        {profile.seeking.length > 1 ? (
          <div role="group" aria-label={words.mode} className="flex gap-1.5 md:order-1">
            {(['all', ...SEEKING] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => {
                  setChoice(option);
                  setLimit(STEP);
                }}
                className={cn('min-h-11 min-w-11 rounded-control px-3.5 text-sm', mode === option ? 'bg-raised font-semibold text-accent' : 'text-muted hover:text-chalk')}
              >
                {option === 'all' ? words.all : t.seeking[option]}
              </button>
            ))}
          </div>
        ) : <span />}
      </div>

      <section aria-labelledby="communities-title" className="mt-5">
        <h2 id="communities-title" className="text-sm text-muted">{words.communities}</h2>
        <CommunityShelf communities={communities} selected={community} />
      </section>

      <section aria-labelledby="people-title" className="mt-4" aria-busy={page === null}>
        {community ? (
          <div className="flex items-center justify-between gap-4 border-t border-line py-4">
            <div className="min-w-0">
              <h2 id="people-title" className="text-lg font-bold">{t.genres[community]}</h2>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">{words.communityBody}</p>
            </div>
            <Button variant="secondary" className="shrink-0" onClick={() => change({ kind: 'community', genre: community, on: !joined })}>
              {joined ? words.leave : words.join}
            </Button>
          </div>
        ) : (
          <h2 id="people-title" className="sr-only">{words.peopleTitle}</h2>
        )}

        {problem && <p role="alert" className="border-t border-line py-4 text-sm text-danger">{t.people.errors[problem]}</p>}
        {!page && !problem && <p role="status" className="border-t border-line py-8 text-muted">{t.people.loading}</p>}

        {page && page.people.length > 0 && (
          <>
            <ul className="divide-y divide-line border-t border-line">
              {page.people.map((person) => (
                <li key={person.id}><PersonCard person={person} /></li>
              ))}
            </ul>
            {page.total > page.people.length && <Button variant="secondary" className="mt-5" onClick={() => setLimit(limit + STEP)}>{words.more}</Button>}
          </>
        )}

        {page && page.people.length === 0 && (
          <div className="border-t border-line py-10">
            <h3 className="text-xl font-bold">{filtered ? words.emptyTitle : words.earlyTitle}</h3>
            <p className="mt-1.5 max-w-md leading-relaxed text-muted">{filtered ? words.emptyBody : words.earlyBody}</p>
            {filtered ? (
              <ButtonLink
                href="/discover"
                variant="secondary"
                className="mt-5"
                onClick={() => {
                  setTyped('');
                  setSearch('');
                  setChoice('all');
                }}
              >
                {words.showEveryone}
              </ButtonLink>
            ) : (
              <ButtonLink href="/profile/edit" variant="secondary" className="mt-5">{t.me.edit}</ButtonLink>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
