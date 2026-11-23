import { getDb } from '@/lib/server/db';
import { exportData } from '@/lib/server/export';
import { reply } from '@/lib/server/http';
import { currentUser, suspendedUser } from '@/lib/server/session';

export async function GET() {
  // The one thing a suspended person can still fetch: their own data.
  const user = (await currentUser()) ?? (await suspendedUser());
  if (!user) return reply({ error: 'signedOut' }, 401);
  return new Response(JSON.stringify(exportData(getDb(), user), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="my-data.json"',
      'Cache-Control': 'no-store',
    },
  });
}
