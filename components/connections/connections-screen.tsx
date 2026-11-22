'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { PageTitle } from '@/components/ui/page-title';
import { usePeople } from '@/lib/demo/use-people';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile } from '@/lib/profile/store';
import { demoAcceptMyRequest } from '@/lib/social/actions';
import { seePerson } from '@/lib/social/policy';
import { updateSocial, useSocial } from '@/lib/social/store';
import type { Relation } from '@/lib/social/types';
import { ConnectionRow } from './connection-row';
import { DemoTools } from './demo-tools';

export function ConnectionsScreen() {
  const { t } = useI18n();
  const words = t.community.connections;
  const { social } = useSocial();
  const { profile } = useProfile();
  const people = usePeople();

  const list = (relation: Relation) =>
    people.flatMap((person) => {
      const seen = social.relations[person.id] === relation ? seePerson(social, profile, person) : null;
      return seen ? [{ person, seen }] : [];
    });
  const connected = list('connected');
  const received = list('incoming');
  const sent = list('outgoing');
  const waiting = received.length + sent.length;

  // Open on requests when something is waiting.
  const [tab, setTab] = useState<'accepted' | 'requests'>(waiting ? 'requests' : 'accepted');
  const tabs = [['accepted', connected.length], ['requests', waiting]] as const;

  return (
    <div className="gutter pt-7 pb-16 lg:pt-10">
      <PageTitle title={words.title} body={words.body} />
      <div className="mt-7 flex gap-6 border-b border-seam">
        {tabs.map(([key, count]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={cn('-mb-px min-h-12 border-b-2 font-medium', tab === key ? 'border-chalk' : 'border-transparent text-muted hover:text-chalk')}
          >
            {words[key]} <span className="tabular-nums">{count}</span>
          </button>
        ))}
      </div>

      <div className="max-w-4xl">
        {tab === 'accepted' ? (
          connected.length ? (
            <ul className="divide-y divide-seam">
              {connected.map((item) => <ConnectionRow key={item.person.id} {...item} />)}
            </ul>
          ) : (
            <div className="py-10">
              <h2 className="text-3xl font-display font-extrabold">{words.acceptedEmptyTitle}</h2>
              <p className="mt-2 mb-6 max-w-md leading-relaxed text-muted">{words.acceptedEmptyBody}</p>
              <ButtonLink href="/discover">{words.find}</ButtonLink>
            </div>
          )
        ) : (
          <>
            <section className="pt-7">
              <h2 className="text-lg font-semibold">{words.received}</h2>
              {received.length ? (
                <ul className="divide-y divide-seam">
                  {received.map((item) => <ConnectionRow key={item.person.id} {...item} />)}
                </ul>
              ) : (
                <p className="py-4 text-muted">{words.receivedEmpty}</p>
              )}
            </section>
            <section className="pt-7">
              <h2 className="text-lg font-semibold">{words.sent}</h2>
              {sent.length ? (
                <ul className="divide-y divide-seam">
                  {sent.map((item) => (
                    <ConnectionRow
                      key={item.person.id}
                      {...item}
                      extra={
                        <Button variant="quiet" className="text-flame" onClick={() => updateSocial((state) => demoAcceptMyRequest(state, item.person))}>
                          {t.community.demo.acceptAs}
                        </Button>
                      }
                    />
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-muted">{words.sentEmpty}</p>
              )}
            </section>
          </>
        )}
        <DemoTools onReceived={() => setTab('requests')} />
      </div>
    </div>
  );
}
