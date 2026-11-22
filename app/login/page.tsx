import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { getI18n } from '@/lib/i18n/server';
import { currentUser } from '@/lib/server/session';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.account.logIn };
}

export default async function Page() {
  if (await currentUser()) redirect('/');
  return <AuthForm key="login" mode="login" />;
}
