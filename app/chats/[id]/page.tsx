import { ChatThread } from '@/components/chat/chat-thread';
import { requireUser } from '@/lib/server/session';

export default async function Page({ params }: PageProps<'/chats/[id]'>) {
  await requireUser();
  const { id } = await params;
  return <ChatThread key={id} id={id} />;
}
