import type { ChatError } from '@/lib/chat/types';
import { applyChat, listChats, parseChatInput, readThread } from '@/lib/server/chat';
import { getDb } from '@/lib/server/db';
import { readWrite, reply } from '@/lib/server/http';
import { currentUser } from '@/lib/server/session';

const refused = (error: ChatError) =>
  reply({ error }, error === 'consent' || error === 'notConnected' || error === 'theyOff' ? 403 : error === 'tooMany' ? 429 : 400);

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return reply({ error: 'signedOut' }, 401);

  const query = new URL(request.url).searchParams;
  const them = query.get('with');
  if (!them) return reply({ userId: user.id, ...listChats(getDb(), user.id) });

  const before = query.has('before') ? Number(query.get('before')) : undefined;
  if (before !== undefined && (!Number.isSafeInteger(before) || before < 1)) return refused('invalid');
  const thread = readThread(getDb(), user.id, them, before);
  return thread.ok ? reply({ userId: user.id, ...thread }) : refused(thread.error);
}

export async function POST(request: Request) {
  const read = await readWrite(request, 12_000);
  if (read instanceof Response) return read;
  const input = parseChatInput(read.input);
  if (!input) return refused('invalid');

  const result = applyChat(getDb(), read.userId, input);
  return result.ok ? reply({ ok: true }) : refused(result.error);
}
