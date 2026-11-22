'use client';

import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { usePeople } from '@/lib/demo/use-people';
import { useI18n } from '@/lib/i18n/provider';
import { unblock } from '@/lib/social/actions';
import { isEligible } from '@/lib/social/eligibility';
import { updateSocial, useSocial } from '@/lib/social/store';
import { DeleteAccount } from './delete-account';
import { PrivacySettings } from './privacy-settings';
import { SettingsSection } from './settings-section';

// Checked 2026-11-22. Mongolia is moving emergency calls to 112, so check again before the pilot.
const HELPLINES = [
  { key: 'police', number: '102' },
  { key: 'ambulance', number: '103' },
  { key: 'child', number: '108' },
] as const;

const twoDigits = (value: number) => String(value).padStart(2, '0');

function formatDate(time: number) {
  const date = new Date(time);
  return `${date.getFullYear()}.${twoDigits(date.getMonth() + 1)}.${twoDigits(date.getDate())}`;
}

export function SettingsScreen() {
  const { t } = useI18n();
  const words = t.community.settings;
  const { social, ready, saveFailed } = useSocial();
  const people = usePeople();

  if (!ready) return <p role="status" className="gutter py-16 text-muted">{t.loading}</p>;

  return (
    <div className="gutter pt-7 pb-12 lg:pt-10">
      <div className="pb-8">
        <PageTitle title={words.title} body={words.body} />
        {saveFailed && <p role="alert" className="mt-3 text-sm text-danger">{t.setup.saveFailed}</p>}
      </div>

      {/* Privacy, blocks and reports only mean something once someone can meet people. */}
      {isEligible(social.eligibility) && (
        <>
          <SettingsSection title={words.privacy} body={words.privacyBody}>
            <PrivacySettings />
          </SettingsSection>

          <SettingsSection title={words.blocked} body={words.blockedBody}>
            {social.blocked.length ? (
              <ul className="divide-y divide-stone">
                {social.blocked.map((id) => {
                  const name = people.find((person) => person.id === id)?.profile.username ?? id;
                  return (
                    <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="font-medium [overflow-wrap:anywhere]">{name}</span>
                      <Button variant="secondary" aria-label={`${words.unblock}: ${name}`} onClick={() => updateSocial((state) => unblock(state, id))}>{words.unblock}</Button>
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
              <ul className="divide-y divide-stone">
                {social.reports.map((report) => (
                  <li key={report.id} className="py-3">
                    <p className="font-medium [overflow-wrap:anywhere]">{report.username}</p>
                    <p className="text-sm">{t.community.report.reasons[report.reason]}</p>
                    <p className="mt-1 text-sm text-muted">{words.notSent}, {formatDate(report.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">{words.reportsEmpty}</p>
            )}
          </SettingsSection>
        </>
      )}

      <SettingsSection title={words.help} body={words.helpBody}>
        <ul className="divide-y divide-stone">
          {HELPLINES.map(({ key, number }) => (
            <li key={key}>
              <a href={`tel:${number}`} className="flex min-h-14 items-center justify-between gap-4 hover:text-pine">
                <span>{words[key]}</span>
                <span className="text-2xl font-semibold tabular-nums">{number}</span>
              </a>
            </li>
          ))}
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
