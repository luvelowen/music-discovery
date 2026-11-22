import { NoChatChosen } from '@/components/chat/chats-frame';
import { requireUser } from '@/lib/server/session';

export default async function Page() {
  await requireUser();
  return <NoChatChosen />;
}
