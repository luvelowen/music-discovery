'use client';

import { useState } from 'react';
import { PersonCard } from '@/components/people/person-card';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';
import { usePeople } from '@/lib/people/provider';
import type { Seen } from '@/lib/people/types';

type Tab = 'accepted' | 'requests';

function People({ people, empty }: { people: Seen[]; empty: string }) {
  if (!people.length) return <p className="py-4 text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {people.map((person) => <li key={person.id}><PersonCard person={person} /></li>)}
    </ul>
  );
}

export function ConnectionsScreen() {
  const { t } = useI18n();
  const words = t.community.connections;
  const { overview, problem } = usePeople();
  const [picked, setPicked] = useState<Tab | null>(null);

  if (!overview) {
    return (
      <div className="gutter pt-8">
        <PageTitle title={words.title} body={words.body} />
        <p role="status" className="mt-6 text-muted">{problem ? t.people.errors[problem] : t.people.loading}</p>
      </div>
    );
  }

  const { connected, incoming, outgoing } = overview;
  // Until a tab is chosen, open on requests when someone is waiting for an answer.
  const tab = picked ?? (incoming.length || (!connected.length && outgoing.length) ? 'requests' : 'accepted');
  const tabs = [['accepted', connected.length], ['requests', incoming.length + outgoing.length]] as const;

  return (
    <div className="gutter pt-8 pb-16">
      <PageTitle title={words.title} body={words.body} />
      <div className="mt-5 flex gap-1.5">
        {tabs.map(([key, count]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setPicked(key)}
            className={cn('min-h-11 rounded-control px-3.5 text-sm', tab === key ? 'bg-raised font-semibold text-accent' : 'text-muted hover:text-chalk')}
          >
            {words[key]}{count > 0 && <span className="tabular-nums"> {count}</span>}
          </button>
        ))}
      </div>
      {problem && <p role="alert" className="mt-3 text-sm text-danger">{t.people.errors[problem]}</p>}

      {tab === 'accepted' ? (
        connected.length ? (
          <div className="mt-3"><People people={connected} empty="" /></div>
        ) : (
          <div className="py-10">
            <h2 className="text-xl font-bold">{words.acceptedEmptyTitle}</h2>
            <p className="mt-2 mb-6 max-w-md leading-relaxed text-muted">{words.acceptedEmptyBody}</p>
            <ButtonLink href="/discover">{words.find}</ButtonLink>
          </div>
        )
      ) : (
        <>
          <section className="pt-6">
            <h2 className="text-lg font-bold">{words.received}</h2>
            <People people={incoming} empty={words.receivedEmpty} />
          </section>
          <section className="pt-6">
            <h2 className="text-lg font-bold">{words.sent}</h2>
            <People people={outgoing} empty={words.sentEmpty} />
          </section>
        </>
      )}
    </div>
  );
}
