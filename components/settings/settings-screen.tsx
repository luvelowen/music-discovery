'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EmailSecurity } from '@/components/account/email-security';
import { LogOutButton } from '@/components/account/log-out-button';
import { SaveStatus } from '@/components/account/save-status';
import { ChatSettings } from '@/components/chat/chat-settings';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { ReportButton } from '@/components/people/report-button';
import { Button, ButtonLink } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { formatDateTime } from '@/lib/format-date';
import { useI18n } from '@/lib/i18n/provider';
import { usePeople } from '@/lib/people/provider';
import type { PeopleProblem } from '@/lib/people/types';
import { DeleteAccount } from './delete-account';
import { PrivacySettings } from './privacy-settings';
import { SettingsSection } from './settings-section';

export function SettingsScreen() {
  const { t } = useI18n();
  const words = t.community.settings;
  const { overview, act } = usePeople();
  const [error, setError] = useState<PeopleProblem | null>(null);
  // Held here, because reporting can also block, which takes the row and its dialog off the screen.
  const [reported, setReported] = useState(false);
  const sent = () => setReported(true);

  async function unblock(id: string) {
    const result = await act({ kind: 'unblock', personId: id });
    setError(result.ok ? null : result.error);
  }

  return (
    <div className="gutter pt-8 pb-14">
      <PageTitle title={words.title} body={words.body} />
      <SaveStatus quiet className="mt-2" />

      <SettingsSection id="data" title={t.account.account} body={words.dataBody}>
        <EmailSecurity />
        <div className="flex flex-wrap gap-2.5 border-t border-line pt-4 pb-1">
          <ButtonLink href="/account/data">{t.account.myData}</ButtonLink>
          <LogOutButton />
        </div>
      </SettingsSection>

      <SettingsSection id="privacy" title={words.privacy} body={words.privacyBody}>
        <PrivacySettings />
      </SettingsSection>

      <SettingsSection title={t.chat.settings.title}>
        <ChatSettings />
      </SettingsSection>

      <SettingsSection title={words.blocked} body={words.blockedBody}>
        {!overview ? (
          <p className="text-muted">{t.people.loading}</p>
        ) : overview.blocked.length ? (
          <ul className="divide-y divide-line">
            {overview.blocked.map(({ id, username, chatted }) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="[overflow-wrap:anywhere]">{username || words.unnamed}</span>
                <span className="flex flex-wrap gap-2">
                  <ReportButton id={id} name={username} canAttach={chatted} onDone={sent} />
                  <Button variant="secondary" aria-label={`${words.unblock}: ${username || words.unnamed}`} onClick={() => unblock(id)}>{words.unblock}</Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{words.blockedEmpty}</p>
        )}
        {error && <p role="alert" className="mt-2 text-sm text-danger">{t.people.errors[error]}</p>}
      </SettingsSection>

      {reported && <p role="status" className="mt-5 max-w-3xl rounded-panel bg-surface p-4 text-sm leading-relaxed">{t.community.report.done}</p>}

      {overview && overview.pastChats.length > 0 && (
        <SettingsSection title={words.pastChats} body={words.pastChatsBody}>
          <ul className="divide-y divide-line">
            {overview.pastChats.map(({ id, at, last, chatted }) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0 flex-1 basis-48 [overflow-wrap:anywhere]">
                  <span className="block">{formatDateTime(at)}</span>
                  {last && <span dir="auto" className="block text-sm text-muted">{last}</span>}
                </span>
                <ReportButton id={id} name="" context={formatDateTime(at)} canAttach={chatted} onDone={sent} />
              </li>
            ))}
          </ul>
        </SettingsSection>
      )}

      <SettingsSection title={words.reports} body={words.reportsBody}>
        {!overview ? (
          <p className="text-muted">{t.people.loading}</p>
        ) : overview.reports.length ? (
          <ul className="divide-y divide-line">
            {overview.reports.map((report) => (
              <li key={report.id} className="py-3">
                <p className="font-medium [overflow-wrap:anywhere]">{report.username || words.unnamed}</p>
                <p className="text-sm">{t.community.report.reasons[report.reason]}</p>
                <p className="mt-1 text-sm text-muted">{words.reportStatus[report.status]}, {formatDateTime(report.at)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{words.reportsEmpty}</p>
        )}
      </SettingsSection>

      <SettingsSection title={words.dates} body={words.datesBody}>
        <ul className="space-y-2 py-1 text-sm leading-relaxed">
          {words.dateTips.map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
      </SettingsSection>

      <SettingsSection title={t.legal.title}>
        <ul className="divide-y divide-line text-accent">
          <li><Link href="/privacy" className="flex min-h-12 items-center hover:underline">{t.legal.privacy.title}</Link></li>
          <li><Link href="/rules" className="flex min-h-12 items-center hover:underline">{t.legal.rules.title}</Link></li>
        </ul>
      </SettingsSection>

      <SettingsSection title={words.language}>
        <LanguageSwitcher />
      </SettingsSection>

      <SettingsSection title={words.account} body={words.accountBody}>
        <DeleteAccount />
      </SettingsSection>
    </div>
  );
}
