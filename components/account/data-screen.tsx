'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { SettingsSection } from '@/components/settings/settings-section';
import type { Account } from '@/lib/account/changes';
import { formatDateTime } from '@/lib/format-date';
import { useI18n } from '@/lib/i18n/provider';
import { artistName } from '@/lib/music/artists';
import type { UserRow } from '@/lib/server/accounts';

type Props = {
  file: string;
  record: Omit<UserRow, 'profile' | 'social'> & Account;
  photoSize: number | null;
  sessions: { created_at: number; expires_at: number }[];
  attempts: number;
  checkedAt: number | null;
  chat: { consentAt: number | null; messages: number };
};

function Rows({ rows }: { rows: [label: string, value: ReactNode][] }) {
  return (
    <dl className="divide-y divide-line text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
          <dt className="text-muted">{label}</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DataScreen({ file, record, photoSize, sessions, attempts, checkedAt, chat }: Props) {
  const { t, locale } = useI18n();
  const words = t.account.data;
  const router = useRouter();
  const { profile, social } = record;
  const list = (items: string[]) => (items.length ? items.join(', ') : words.none);
  const relations = Object.values(social.relations);

  return (
    <div className="gutter pt-8 pb-14">
      <div className="flex flex-col items-start justify-between gap-4 pb-8 sm:flex-row sm:items-end">
        <PageTitle title={words.title} body={words.body} />
        <Button variant="secondary" onClick={() => router.refresh()}>{words.refresh}</Button>
      </div>

      <SettingsSection title={words.where} body={words.whereBody}>
        <p className="font-medium"><code>{file}</code></p>
      </SettingsSection>

      <SettingsSection title={words.account}>
        <Rows
          rows={[
            [t.account.email, record.email],
            [words.emailCheck, checkedAt ? formatDateTime(checkedAt) : t.account.emailNotChecked],
            [words.id, record.id],
            [words.password, words.passwordValue],
            [words.age, words.ageValue],
            [words.consent, formatDateTime(record.consent_at)],
            [words.created, formatDateTime(record.created_at)],
            [words.updated, formatDateTime(record.updated_at)],
          ]}
        />
      </SettingsSection>

      <SettingsSection title={words.profile}>
        <Rows
          rows={[
            [t.aboutStep.username, profile.username || words.none],
            [t.profile.seeking, list(profile.seeking.map((item) => t.seeking[item]))],
            [t.profile.genres, list(profile.genres.map((id) => t.genres[id]))],
            [t.profile.artists, list(profile.artists.map((artist) => artistName(artist, locale)))],
            [t.profile.tracks, list(profile.tracks.map((track) => `${track.title} (${track.artist})`))],
            [t.profile.links, list(profile.links.map((link) => link.url))],
            [t.aboutStep.bio, profile.bio || words.none],
            [words.photo, photoSize === null ? words.none : words.photoValue(photoSize)],
          ]}
        />
      </SettingsSection>

      <SettingsSection title={words.activity}>
        <Rows
          rows={[
            [words.discoverable, social.privacy.discoverable ? words.yes : words.no],
            [t.community.settings.requests, t.community.settings.rules[social.privacy.requests]],
            [words.connections, relations.filter((value) => value === 'connected').length],
            [words.requests, relations.filter((value) => value === 'incoming' || value === 'outgoing').length],
            [words.communities, list(social.communities.map((id) => t.genres[id]))],
            [t.chat.data.consent, chat.consentAt === null ? t.chat.data.none : formatDateTime(chat.consentAt)],
            [t.chat.data.messages, chat.messages],
            [words.blocked, social.blocked.length],
            [words.reports, social.reports.length],
            [words.sessions, <ul key="sessions">{sessions.map((session, index) => <li key={index}>{formatDateTime(session.created_at)}, {words.until(formatDateTime(session.expires_at))}</li>)}</ul>],
            [words.attempts, attempts],
          ]}
        />
      </SettingsSection>

      <SettingsSection title={words.notStored}>
        <p className="text-sm">{words.notStoredBody}</p>
      </SettingsSection>

      <details className="max-w-3xl py-6">
        <summary className="min-h-11 cursor-pointer py-2.5 text-sm">{words.raw}</summary>
        <p className="mb-3 text-xs text-muted">{words.rawNote}</p>
        <pre className="bg-surface p-4 text-xs leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{JSON.stringify(record, null, 2)}</pre>
      </details>
    </div>
  );
}
