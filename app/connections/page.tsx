import type { Metadata } from 'next';
import { ConnectionsScreen } from '@/components/connections/connections-screen';
import { AppGate } from '@/components/gate/app-gate';
import { getI18n } from '@/lib/i18n/server';
import { requireUser } from '@/lib/server/session';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.community.connections.title };
}

export default async function Page() {
  await requireUser();
  return (
    <AppGate>
      <ConnectionsScreen />
    </AppGate>
  );
}
