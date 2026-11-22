import type { Metadata } from 'next';
import { ProfileEditor } from '@/components/profile/profile-editor';
import { getI18n } from '@/lib/i18n/server';
import { requireUser } from '@/lib/server/session';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.me.editTitle };
}

export default async function Page() {
  await requireUser();
  return <ProfileEditor />;
}
