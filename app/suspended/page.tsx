import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SuspendedScreen } from '@/components/account/suspended-screen';
import { getI18n } from '@/lib/i18n/server';
import { operator } from '@/lib/server/operator';
import { suspendedUser } from '@/lib/server/session';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.account.suspension.title };
}

export default async function Page() {
  if (!(await suspendedUser())) redirect('/login');
  return <SuspendedScreen contact={operator().contact} />;
}
