import { getI18n } from '@/lib/i18n/server';
import { applyChat, listChats, parseChatInput, readThread } from '@/lib/server/chat';
import { getDb } from '@/lib/server/db';
import { currentUser } from '@/lib/server/session';
import type { ChatError } from '@/lib/chat/types';

const MAX_BODY = 12_000;
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const refused = (error: ChatError) => reply({ error }, error === 'consent' || error === 'notConnected' ? 403 : error === 'tooMany' ? 429 : 400);

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
  // Only our own page may write. A form or script on another website or port is refused.
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host || (origin !== `http://${host}` && origin !== `https://${host}`)) return reply({ error: 'invalid' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'invalid' }, 415);

  const user = await currentUser();
  if (!user) return reply({ error: 'signedOut' }, 401);
  if (Number(request.headers.get('content-length')) > MAX_BODY) return reply({ error: 'tooLong' }, 413);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply({ error: 'tooLong' }, 413);

  let body: { userId?: unknown; input?: unknown };
  try {
    body = JSON.parse(raw) ?? {};
  } catch {
    return refused('invalid');
  }
  // A tab left open by one person must never write into the next person's chats.
  if (body.userId !== user.id) return reply({ error: 'signedOut' }, 409);
  const input = parseChatInput(body.input);
  if (!input) return refused('invalid');

  const result = applyChat(getDb(), user.id, input, (await getI18n()).t.chat.testReplyText);
  return result.ok ? reply({ ok: true }) : refused(result.error);
}
