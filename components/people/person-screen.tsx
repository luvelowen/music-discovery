'use client';

import { ArrowLeft, Ban, Flag } from 'lucide-react';
import { useRef, useState } from 'react';
import { Avatar } from '@/components/profile/avatar';
import { ProfileCard } from '@/components/profile/profile-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageTitle } from '@/components/ui/page-title';
import { usePeople } from '@/lib/demo/use-people';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile } from '@/lib/profile/store';
import { block } from '@/lib/social/actions';
import { seePerson } from '@/lib/social/policy';
import { updateSocial, useSocial } from '@/lib/social/store';
import { RelationActions } from './relation-actions';
import { ReportDialog } from './report-dialog';

export function PersonScreen({ id }: { id: string }) {
  const { t } = useI18n();
  const words = t.community.person;
  const { social } = useSocial();
  const { profile } = useProfile();
  const person = usePeople().find((item) => item.id === id);
  const [reported, setReported] = useState(false);
  const blockDialog = useRef<HTMLDialogElement>(null);
  const reportDialog = useRef<HTMLDialogElement>(null);

  const seen = person ? seePerson(social, profile, person) : null;
  const notice = reported && <p role="status" className="mt-5 max-w-xl rounded-control bg-cherry p-4 text-sm leading-relaxed">{t.community.report.done}</p>;

  if (!person || !seen) {
    const blocked = person && social.blocked.includes(id);
    return (
      <div className="gutter py-16">
        <PageTitle
          focus
          title={blocked ? words.blockedTitle(person.profile.username) : words.unavailableTitle}
          body={blocked ? words.blockedBody : undefined}
        />
        {notice}
        <ButtonLink href="/discover" className="mt-8">{words.back}</ButtonLink>
      </div>
    );
  }

  const relation = social.relations[id];
  const note = relation === 'connected' ? words.connectedNote : relation === 'incoming' ? words.incomingNote : words.privateNote;

  return (
    <div className="pb-14">
      <div className="gutter pt-4 lg:pt-7">
        <ButtonLink href="/discover" variant="quiet" className="-ml-3 px-3!">
          <ArrowLeft className="size-5" aria-hidden />
          {words.back}
        </ButtonLink>
        <div className="mt-3 mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <Avatar profile={seen} className="size-16 sm:size-20" />
              <div className="min-w-0">
                <PageTitle title={seen.username} />
                <p className="mt-3 text-sm text-muted">{t.community.demo.badge}</p>
              </div>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-flame">{note}</p>
          </div>
          <div className="lg:max-w-sm">
            <RelationActions person={person} />
            {(!relation || relation === 'declined') && <p className="mt-2 text-sm leading-relaxed text-muted">{words.requestNote}</p>}
          </div>
        </div>
        {notice}
      </div>

      <div className="sm:gutter mt-5">
        <ProfileCard profile={seen} showIdentity={false} />
      </div>

      <div className="gutter mt-6 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => blockDialog.current?.showModal()}>
          <Ban className="size-5" aria-hidden />
          {words.block}
        </Button>
        <Button variant="secondary" onClick={() => reportDialog.current?.showModal()}>
          <Flag className="size-5" aria-hidden />
          {words.report}
        </Button>
      </div>

      <ConfirmDialog
        ref={blockDialog}
        title={words.blockTitle(seen.username)}
        body={words.blockConfirmBody}
        confirm={words.block}
        cancel={words.keep}
        onConfirm={() => updateSocial((state) => block(state, id))}
      />
      <ReportDialog ref={reportDialog} person={person} onDone={() => setReported(true)} />
    </div>
  );
}
