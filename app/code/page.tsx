import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CodeForm } from '@/components/auth/code-form';
import { getI18n } from '@/lib/i18n/server';
import { getDb } from '@/lib/server/db';
import { deliveryMethod } from '@/lib/server/mail';
import { currentUser, isOurHost, readCodeToken } from '@/lib/server/session';
import { findCode } from '@/lib/server/verification';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.account.codeTitle };
}

export default async function Page() {
  const token = await readCodeToken();
  const row = token && (await isOurHost()) ? findCode(getDb(), token) : undefined;
  if (!row) redirect((await currentUser()) ? '/settings' : '/login');
  return <CodeForm purpose={row.purpose} email={row.email} delivery={deliveryMethod()} />;
}
