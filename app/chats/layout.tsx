import type { Metadata } from 'next';
import { ChatsFrame } from '@/components/chat/chats-frame';
import { AppGate } from '@/components/gate/app-gate';
import { getI18n } from '@/lib/i18n/server';
import { requireUser } from '@/lib/server/session';

// The title is deliberately generic, so a name never lands in browser history.
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.chat.title };
}

export default async function Layout({ children }: LayoutProps<'/chats'>) {
  await requireUser(); // Here as well: the gate below can decide not to show the page at all.
  return (
    <AppGate>
      <ChatsFrame>{children}</ChatsFrame>
    </AppGate>
  );
}
