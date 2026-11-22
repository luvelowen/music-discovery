import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';
import { getI18n } from '@/lib/i18n/server';
import { currentUser } from '@/lib/server/session';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.account.forgotTitle };
}

// Also used from Settings to change a password, so it stays open when signed in.
export default async function Page() {
  const user = await currentUser();
  return <AuthForm key="forgot" mode="forgot" email={user?.email} />;
}
