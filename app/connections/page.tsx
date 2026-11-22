import type { Metadata } from 'next';
import { ConnectionsScreen } from '@/components/connections/connections-screen';
import { AppGate } from '@/components/gate/app-gate';
import { getI18n } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.community.connections.title };
}

export default function Page() {
  return (
    <AppGate>
      <ConnectionsScreen />
    </AppGate>
  );
}
