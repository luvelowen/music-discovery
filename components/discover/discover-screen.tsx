'use client';

import { Sleeve } from '@/components/artwork/sleeve';
import { PersonCard } from '@/components/people/person-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { usePeople } from '@/lib/demo/use-people';
import { useI18n } from '@/lib/i18n/provider';
import { GENRE_IDS, type GenreId } from '@/lib/music/genres';
import { useProfile } from '@/lib/profile/store';
import { toggleCommunity } from '@/lib/social/actions';
import { isInDiscover, seePerson } from '@/lib/social/policy';
import { compareMusic } from '@/lib/social/shared';
import { updateSocial, useSocial } from '@/lib/social/store';
import { CommunityShelf } from './community-shelf';

export function DiscoverScreen({ community }: { community: GenreId | null }) {
  const { t } = useI18n();
  const words = t.community.discover;
  const { profile } = useProfile();
  const { social } = useSocial();

  const visible = usePeople().flatMap((person) => {
    const seen = isInDiscover(social, person) ? seePerson(social, person) : null;
    return seen ? [{ person, seen, rank: compareMusic(profile, seen).rank }] : [];
  });

  // Joined first, then the genres I picked, then the rest.
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
    <>
      <div className="gutter pt-7 pb-6 lg:pt-10">
        <PageTitle title={words.title} body={words.body} />
        {!social.privacy.discoverable && (
          <div className="mt-6 flex flex-col gap-3 border-l-2 border-sage pl-4 sm:flex-row sm:items-center sm:gap-5">
            <p className="text-sm leading-relaxed">{words.hidden}</p>
            <Button
              variant="secondary"
              className="shrink-0 self-start"
              onClick={() => updateSocial((state) => ({ ...state, privacy: { ...state.privacy, discoverable: true } }))}
            >
              {words.show}
            </Button>
          </div>
        )}
      </div>

      <section aria-labelledby="communities-title" className="bg-mist pt-6 pb-5">
        <h2 id="communities-title" className="gutter mb-2 text-xl font-semibold tracking-tight">{words.communities}</h2>
        <CommunityShelf communities={communities} selected={community} />
      </section>

      <section aria-labelledby="people-title" className="gutter pt-8 pb-16 lg:pt-12">
        {community ? (
          <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Sleeve genre={community} className="size-16 shrink-0 rounded-sleeve border border-ink/10 sm:size-24" />
              <div className="min-w-0">
                <h2 id="people-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.genres[community]}</h2>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">{words.communityBody}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={joined ? 'secondary' : 'primary'} onClick={() => updateSocial((state) => toggleCommunity(state, community))}>
                {joined ? words.leave : words.join}
              </Button>
              <ButtonLink href="/discover" scroll={false} variant="quiet">{words.everyone}</ButtonLink>
            </div>
          </div>
        ) : (
          <h2 id="people-title" className="mb-6 text-xl font-semibold tracking-tight">{words.peopleTitle}</h2>
        )}

        {shown.length ? (
          <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2 sm:gap-y-14 xl:grid-cols-3">
            {shown.map(({ person, seen }) => (
              <li key={person.id}><PersonCard person={person} seen={seen} /></li>
            ))}
          </ul>
        ) : (
          <div className="py-6">
            <h3 className="text-lg font-semibold">{words.emptyTitle}</h3>
            <p className="mt-1 mb-5 text-muted">{words.emptyBody}</p>
            <ButtonLink href="/discover" variant="secondary">{words.showEveryone}</ButtonLink>
          </div>
        )}
      </section>
    </>
  );
}
