import { isGenreId } from '@/lib/music/genres';
import { getDb } from '@/lib/server/db';
import { readWrite, reply } from '@/lib/server/http';
import { applyPeople, discover, getOverview, getPerson, parsePeopleInput } from '@/lib/server/people';
import { currentUser } from '@/lib/server/session';

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return reply({ error: 'signedOut' }, 401);
  const query = new URL(request.url).searchParams;
  const db = getDb();

  const id = query.get('id');
  if (id) return reply({ userId: user.id, person: getPerson(db, user.id, id) });

  if (query.get('view') === 'discover') {
    const genre = query.get('genre');
    const page = discover(db, user.id, {
      genre: isGenreId(genre) ? genre : null,
      seeking: query.get('seeking'),
      search: query.get('search'),
      limit: Math.floor(Number(query.get('limit'))) || undefined,
    });
    return reply({ userId: user.id, ...page });
  }
  return reply({ userId: user.id, ...getOverview(db, user.id) });
}

export async function POST(request: Request) {
  const read = await readWrite(request, 8000);
  if (read instanceof Response) return read;
  const input = parsePeopleInput(read.input);
  if (!input) return reply({ error: 'invalid' }, 400);

  const result = applyPeople(getDb(), read.userId, input);
  if (result.ok) return reply({ ok: true });
  const status = result.error === 'invalid' ? 400 : result.error === 'dailyLimit' || result.error === 'reportLimit' ? 429 : 403;
  return reply({ error: result.error }, status);
}
