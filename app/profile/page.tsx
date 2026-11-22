import type { Metadata } from 'next';
import { ProfileScreen } from '@/components/profile/profile-screen';
import { getI18n } from '@/lib/i18n/server';
import { requireUser } from '@/lib/server/session';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.profile.title };
}

export default async function Page() {
  await requireUser();
  return <ProfileScreen />;
}
