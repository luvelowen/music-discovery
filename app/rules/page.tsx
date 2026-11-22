import type { Metadata } from 'next';
import { LegalScreen } from '@/components/legal/legal-screen';
import { getI18n } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.legal.rules.title };
}

export default function Page() {
  return <LegalScreen page="rules" />;
}
