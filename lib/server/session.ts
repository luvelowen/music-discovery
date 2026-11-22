import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createSession, endSession, SESSION_DAYS, userForSession } from './accounts.ts';
import { getDb } from './db.ts';

const COOKIE = 'session';
const CODE_COOKIE = 'email_code';
const ALLOWED_HOSTS = (process.env.APP_HOSTS || 'localhost,127.0.0.1,[::1]').split(',').map((host) => host.trim().toLowerCase());

/** Another website can point its own address at this computer. Answer only to our own addresses. */
export async function isOurHost() {
  return ALLOWED_HOSTS.includes(((await headers()).get('host') ?? '').replace(/:\d+$/, '').toLowerCase());
}

export const currentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !(await isOurHost())) return null;
  return userForSession(getDb(), token) ?? null;
});

/** Put this at the top of every page that belongs to an account. */
export async function requireUser() {
  return (await currentUser()) ?? redirect('/login');
}

export async function startSession(userId: string) {
  const store = await cookies();
  const old = store.get(COOKIE)?.value;
  if (old) endSession(getDb(), old);
  store.set(COOKIE, createSession(getDb(), userId), {
    httpOnly: true, // Scripts on the page can't read it.
    sameSite: 'lax',
    secure: (await headers()).get('x-forwarded-proto') === 'https',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) endSession(getDb(), token);
  store.delete(COOKIE);
}

/** Remembers which emailed code this browser is waiting for. */
export async function saveCodeToken(token: string) {
  (await cookies()).set(CODE_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: (await headers()).get('x-forwarded-proto') === 'https',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
}

export async function readCodeToken() {
  return (await cookies()).get(CODE_COOKIE)?.value;
}

export async function clearCodeToken() {
  (await cookies()).delete(CODE_COOKIE);
}
