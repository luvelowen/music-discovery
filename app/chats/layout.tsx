import type { Metadata } from 'next';
import { ChatsFrame } from '@/components/chat/chats-frame';
import { AppGate } from '@/components/gate/app-gate';
import { getI18n } from '@/lib/i18n/server';

// The title is deliberately generic, so a name never lands in browser history.
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.chat.title };
}

export default function Layout({ children }: LayoutProps<'/chats'>) {
  return (
    <AppGate bare>
      <ChatsFrame>{children}</ChatsFrame>
    </AppGate>
  );
}
