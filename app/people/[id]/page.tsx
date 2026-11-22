import type { Metadata } from 'next';
import { AppGate } from '@/components/gate/app-gate';
import { PersonScreen } from '@/components/people/person-screen';
import { getI18n } from '@/lib/i18n/server';

// The title is deliberately generic, so a username never lands in browser history or link previews.
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.community.person.title };
}

export default async function Page({ params }: PageProps<'/people/[id]'>) {
  const { id } = await params;
  return (
    <AppGate>
      <PersonScreen key={id} id={id} />
    </AppGate>
  );
}
