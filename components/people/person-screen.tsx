'use client';

import { ArrowLeft, Ban, Flag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ProfileCard } from '@/components/profile/profile-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';
import { artistName } from '@/lib/music/artists';
import { usePeople } from '@/lib/people/provider';
import type { PeopleProblem, Seen } from '@/lib/people/types';
import { useProfile } from '@/lib/profile/store';
import { compareMusic } from '@/lib/social/shared';
import { RelationActions } from './relation-actions';
import { ReportButton } from './report-button';
import { ReportDialog } from './report-dialog';

const CHECK_EVERY = 7000;

export function PersonScreen({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const mine = useProfile().profile;
  const words = t.community.person;
  const { act, getPerson, revision, overview } = usePeople();
  const [person, setPerson] = useState<Seen | null | undefined>(undefined);
  const [problem, setProblem] = useState<PeopleProblem | null>(null);
  const [reported, setReported] = useState(false);
  const blockDialog = useRef<HTMLDialogElement>(null);
  const reportDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let current = true;
    async function load() {
      const result = await getPerson(id);
      if (!current) return;
      setProblem(result.ok ? null : result.error);
      if (result.ok) setPerson(result.value.person);
    }
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, CHECK_EVERY);
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, [id, revision, getPerson]);

  async function blockThem() {
    const result = await act({ kind: 'block', personId: id });
    if (!result.ok) setProblem(result.error);
  }

  const notice = reported && <p role="status" className="my-5 max-w-xl rounded-panel bg-surface p-4 text-sm leading-relaxed">{t.community.report.done}</p>;

  if (person === undefined) {
    return <p role="status" className="gutter py-12 text-muted">{problem ? t.people.errors[problem] : t.people.loading}</p>;
  }

  if (!person) {
    const blocked = overview?.blocked.find((item) => item.id === id);
    const past = overview?.pastChats.find((item) => item.id === id);
    return (
      <div className="gutter py-14">
        <PageTitle
          focus
          title={blocked ? (blocked.username ? words.blockedTitle(blocked.username) : words.blockedUnnamed) : words.unavailableTitle}
          body={blocked ? words.blockedBody : undefined}
        />
        {notice}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <ButtonLink href="/discover">{words.back}</ButtonLink>
          {(blocked || past) && (
            <ReportButton id={id} name={blocked?.username ?? ''} canAttach={Boolean((blocked ?? past)?.chatted)} onDone={() => setReported(true)} />
          )}
        </div>
      </div>
    );
  }

  const { relation, profile } = person;
  const note = { connected: words.connectedNote, incoming: words.incomingNote, outgoing: words.privateNote, none: words.privateNote }[relation];

  const music = compareMusic(mine, profile);
  const shared = [
    ...music.artists.map((artist) => artistName(artist, locale)),
    ...music.genres.map((genre) => t.genres[genre]),
    ...music.tracks.map((track) => track.title),
  ];

  return (
    <div className="gutter pt-4 pb-14 lg:pt-7">
      <ButtonLink href="/discover" variant="quiet" className="mb-5 px-0!">
        <ArrowLeft className="size-5" aria-hidden />
        {words.back}
      </ButtonLink>
      {notice}
      {problem && <p role="alert" className="mb-4 text-sm text-danger">{t.people.errors[problem]}</p>}

      <ProfileCard
        profile={profile}
        note={
          <>
            {shared.length > 0 && (
              <p className="mt-3 max-w-lg leading-relaxed [overflow-wrap:anywhere]">
                <span className="text-muted">{t.community.discover.both}: </span>
                <span className="font-semibold">{shared.join(', ')}</span>
              </p>
            )}
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">{note}{relation === 'none' && ` ${words.requestNote}`}</p>
          </>
        }
        actions={<RelationActions person={person} />}
      />

      <div className="mt-9 flex flex-wrap gap-x-2 border-t border-line pt-2">
        <Button variant="quiet" className="px-3! text-muted!" onClick={() => blockDialog.current?.showModal()}>
          <Ban className="size-4" aria-hidden />
          {words.block}
        </Button>
        <Button variant="quiet" className="px-3! text-muted!" onClick={() => reportDialog.current?.showModal()}>
          <Flag className="size-4" aria-hidden />
          {words.report}
        </Button>
      </div>

      <ConfirmDialog
        ref={blockDialog}
        title={words.blockTitle(profile.username)}
        body={words.blockConfirmBody}
        confirm={words.block}
        cancel={words.keep}
        onConfirm={blockThem}
      />
      <ReportDialog ref={reportDialog} id={id} name={profile.username} canAttach={relation === 'connected'} onDone={() => setReported(true)} />
    </div>
  );
}
