import { parseChange, type Change } from '@/lib/account/changes';
import { saveChanges, toAccount } from '@/lib/server/accounts';
import { getDb } from '@/lib/server/db';
import { currentUser } from '@/lib/server/session';

const MAX_BODY = 700_000; // Room for one resized photo and a batch of changes.
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET() {
  const user = await currentUser();
  if (!user) return reply({ error: 'signedOut' }, 401);
  return reply({ userId: user.id, account: toAccount(user) });
}

export async function POST(request: Request) {
  // Only our own page may save. A form or script on another website or port is refused.
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host || (origin !== `http://${host}` && origin !== `https://${host}`)) return reply({ error: 'origin' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'type' }, 415);

  const user = await currentUser();
  if (!user) return reply({ error: 'signedOut' }, 401);
  if (Number(request.headers.get('content-length')) > MAX_BODY) return reply({ error: 'size' }, 413);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply({ error: 'size' }, 413);
  let body: { userId?: unknown; changes?: unknown };
  try {
    body = JSON.parse(raw) ?? {};
  } catch {
    return reply({ error: 'json' }, 400);
  }
  // A tab left open by one person must never save into the account of the next.
  if (body.userId !== user.id) return reply({ error: 'otherAccount' }, 409);
  if (!Array.isArray(body.changes) || !body.changes.length || body.changes.length > 50) return reply({ error: 'changes' }, 400);

  const changes = body.changes.map(parseChange);
  if (changes.some((change) => !change)) return reply({ error: 'changes' }, 400);

  const saved = saveChanges(getDb(), user.id, changes as Change[]);
  return saved ? reply(saved) : reply({ error: 'signedOut' }, 401);
}
