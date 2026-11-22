import type { Metadata } from 'next';
import { DiscoverScreen } from '@/components/discover/discover-screen';
import { AppGate } from '@/components/gate/app-gate';
import { getI18n } from '@/lib/i18n/server';
import { isGenreId } from '@/lib/music/genres';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.community.discover.title };
}

export default async function Page({ searchParams }: PageProps<'/discover'>) {
  const { community } = await searchParams;
  return (
    <AppGate>
      <DiscoverScreen community={isGenreId(community) ? community : null} />
    </AppGate>
  );
}
