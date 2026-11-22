import type { Metadata } from 'next';
import { connection } from 'next/server';
import { LegalScreen } from '@/components/legal/legal-screen';
import { getI18n } from '@/lib/i18n/server';
import { operator } from '@/lib/server/operator';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.legal.privacy.title };
}

export default async function Page() {
  await connection(); // Who runs the app is read when asked, not baked in at build time.
  return <LegalScreen page="privacy" operator={operator()} />;
}
