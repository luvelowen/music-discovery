import type { Metadata } from 'next';
import { DataScreen } from '@/components/account/data-screen';
import { getI18n } from '@/lib/i18n/server';
import { storedData, toAccount } from '@/lib/server/accounts';
import { consentHistory } from '@/lib/server/consent';
import { DB_LABEL, getDb } from '@/lib/server/db';
import { operator } from '@/lib/server/operator';
import { requireUser } from '@/lib/server/session';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.account.data.title };
}

export default async function Page() {
  const user = await requireUser();
  const consents = consentHistory(getDb(), user.id).map(({ kind, action, at }) => ({ kind, action, at }));
  const { sessions, attempts, checkedAt, chat, social } = storedData(getDb(), user);
  const account = toAccount(user);
  // The browser gets a shortened copy: never the scrambled password, never a session.
  const { password_hash, ...row } = user;
  const record = {
    ...row,
    password_hash: `${password_hash.split(':').slice(0, 4).join(':')}:…`,
    profile: { ...account.profile, photo: account.profile.photo && `${account.profile.photo.slice(0, 40)}…` },
    social: JSON.parse(user.social) as object,
  };
  return (
    <DataScreen
      file={operator().location ?? (process.env.APP_DB_PATH ? 'APP_DB_PATH' : DB_LABEL)}
      record={record}
      photoSize={account.profile.photo ? Math.ceil(account.profile.photo.length / 1024) : null}
      sessions={sessions.map((session) => ({ ...session }))}
      attempts={attempts}
      checkedAt={checkedAt}
      chat={chat}
      social={account.social}
      counts={social}
      consents={consents}
    />
  );
}
