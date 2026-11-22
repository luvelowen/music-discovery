import type { Metadata } from 'next';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { getI18n } from '@/lib/i18n/server';
import { requireUser } from '@/lib/server/session';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.community.settings.title };
}

// Not behind the profile check: anyone signed in must always be able to leave and delete their data.
export default async function Page() {
  await requireUser();
  return <SettingsScreen />;
}
