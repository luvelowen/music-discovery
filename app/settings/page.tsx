import type { Metadata } from 'next';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { getI18n } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.community.settings.title };
}

// Not behind the age gate: anyone must always be able to find help and delete their data.
export default function Page() {
  return <SettingsScreen />;
}
