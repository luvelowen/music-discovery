import { getDb } from '@/lib/server/db';
import { photoFor } from '@/lib/server/photo';
import { currentUser } from '@/lib/server/session';

export async function GET(_: Request, { params }: RouteContext<'/api/photo/[id]'>) {
  const user = await currentUser();
  const { id } = await params;
  const photo = user ? photoFor(getDb(), user.id, id) : null;
  // The same answer for "no photo" and "not allowed".
  if (!photo) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return new Response(photo, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' } });
}
