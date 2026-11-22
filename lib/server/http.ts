import { currentUser } from './session.ts';

export const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** The checks every write shares: our own page, signed in, small, and meant for this account. */
export async function readWrite(request: Request, maxBody: number): Promise<{ userId: string; input: unknown } | Response> {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host || (origin !== `http://${host}` && origin !== `https://${host}`)) return reply({ error: 'invalid' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'invalid' }, 415);

  const user = await currentUser();
  if (!user) return reply({ error: 'signedOut' }, 401);
  if (Number(request.headers.get('content-length')) > maxBody) return reply({ error: 'tooLong' }, 413);
  const raw = await request.text();
  if (raw.length > maxBody) return reply({ error: 'tooLong' }, 413);

  let body: { userId?: unknown; input?: unknown };
  try {
    body = JSON.parse(raw) ?? {};
  } catch {
    return reply({ error: 'invalid' }, 400);
  }
  // A tab left open by one person must never act as the next.
  if (body.userId !== user.id) return reply({ error: 'signedOut' }, 409);
  return { userId: user.id, input: body.input };
}
