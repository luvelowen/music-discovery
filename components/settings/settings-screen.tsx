'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EmailSecurity } from '@/components/account/email-security';
import { LogOutButton } from '@/components/account/log-out-button';
import { SaveStatus } from '@/components/account/save-status';
import { ChatSettings } from '@/components/chat/chat-settings';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
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
            {overview.blocked.map(({ id, username }) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="[overflow-wrap:anywhere]">{username}</span>
                <Button variant="secondary" aria-label={`${words.unblock}: ${username}`} onClick={() => unblock(id)}>{words.unblock}</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{words.blockedEmpty}</p>
        )}
        {error && <p role="alert" className="mt-2 text-sm text-danger">{t.people.errors[error]}</p>}
      </SettingsSection>

      <SettingsSection title={words.reports} body={words.reportsBody}>
        {!overview ? (
          <p className="text-muted">{t.people.loading}</p>
        ) : overview.reports.length ? (
          <ul className="divide-y divide-line">
            {overview.reports.map((report) => (
              <li key={report.id} className="py-3">
                <p className="font-medium [overflow-wrap:anywhere]">{report.username}</p>
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
