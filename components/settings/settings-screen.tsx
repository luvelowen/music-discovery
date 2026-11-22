'use client';

import { EmailSecurity } from '@/components/account/email-security';
import { LogOutButton } from '@/components/account/log-out-button';
import { SaveStatus } from '@/components/account/save-status';
import { ChatSettings } from '@/components/chat/chat-settings';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { Button, ButtonLink } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { useAccount } from '@/lib/account/provider';
import { usePeople } from '@/lib/demo/use-people';
import { formatDateTime } from '@/lib/format-date';
import { useI18n } from '@/lib/i18n/provider';
import { DeleteAccount } from './delete-account';
import { PrivacySettings } from './privacy-settings';
import { SettingsSection } from './settings-section';

export function SettingsScreen() {
  const { t } = useI18n();
  const words = t.community.settings;
  const { account: { social }, change } = useAccount();
  const people = usePeople();

  return (
    <div className="gutter pt-8 pb-12">
      <div className="pb-7">
        <PageTitle title={words.title} body={words.body} />
        <SaveStatus className="mt-2" />
      </div>

      <SettingsSection id="data" title={t.account.account} body={words.dataBody}>
        <EmailSecurity />
        <div className="flex flex-wrap gap-2.5 border-t border-line pt-4 pb-1">
          <ButtonLink href="/account/data">{t.account.myData}</ButtonLink>
          <LogOutButton />
        </div>
      </SettingsSection>

      <SettingsSection title={words.privacy} body={words.privacyBody}>
        <PrivacySettings />
      </SettingsSection>

      <SettingsSection title={t.chat.settings.title}>
        <ChatSettings />
      </SettingsSection>

      <SettingsSection title={words.blocked} body={words.blockedBody}>
        {social.blocked.length ? (
          <ul className="divide-y divide-line">
            {social.blocked.map((id) => {
              const name = people.find((person) => person.id === id)?.profile.username ?? id;
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="[overflow-wrap:anywhere]">{name}</span>
                  <Button variant="secondary" aria-label={`${words.unblock}: ${name}`} onClick={() => change({ kind: 'unblock', personId: id })}>{words.unblock}</Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted">{words.blockedEmpty}</p>
        )}
      </SettingsSection>

      <SettingsSection title={words.reports} body={words.reportsBody}>
        {social.reports.length ? (
          <ul className="divide-y divide-line">
            {social.reports.map((report) => (
              <li key={report.id} className="py-3">
                <p className="font-medium [overflow-wrap:anywhere]">{report.username}</p>
                <p className="text-sm">{t.community.report.reasons[report.reason]}</p>
                <p className="mt-1 text-sm text-muted">{words.notSent}, {formatDateTime(report.createdAt)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{words.reportsEmpty}</p>
        )}
      </SettingsSection>

      <SettingsSection title={words.dates} body={words.datesBody}>
        <ul className="space-y-2 text-sm leading-relaxed">
          {words.dateTips.map((tip) => <li key={tip}>{tip}</li>)}
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
