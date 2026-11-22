'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { getI18n } from '@/lib/i18n/server';
import { isComplete } from '@/lib/profile/validation';
import * as accounts from '@/lib/server/accounts';
import { getDb } from '@/lib/server/db';
import { canTakeSignUps } from '@/lib/server/operator';
import { clearOutbox, sendMail, type Mail } from '@/lib/server/mail';
import { clearCodeToken, clearSession, currentUser, isOurHost, readCodeToken, saveCodeToken, startSession } from '@/lib/server/session';
import * as verification from '@/lib/server/verification';

export type AuthState = { error?: accounts.AuthError; sent?: number };

const AGE_LOCK = 'age_check';
const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
};
const number = (form: FormData, key: string) => Number(text(form, key) || NaN);

// The subject and body never say it's a dating app: someone else may see the notification.
async function write({ to, kind, code }: verification.CodeMail): Promise<Mail> {
  const words = (await getI18n()).t.account.mail;
  if (kind === 'exists') return { to, subject: words.existsSubject, text: words.existsBody };
  return { to, subject: words.subject, text: words.body(code, verification.CODE.minutes) };
}

async function deliverNow(mail: Mail) {
  try {
    await sendMail(mail);
    return true;
  } catch (error) {
    console.error('Email was not sent:', (error as Error).message);
    return false;
  }
}

/** For resets the answer can't wait for the email: the delay would show that the account exists. */
async function deliverLater(message: verification.CodeMail) {
  const mail = await write(message);
  after(async () => void (await deliverNow(mail)));
}

export async function signUpAction(_: AuthState, form: FormData): Promise<AuthState> {
  if (!(await isOurHost())) return { error: 'wrong' };
  if (!canTakeSignUps()) return { error: 'closed' };
  const store = await cookies();
  // A short lock, so changing the year and pressing again doesn't work.
  if (store.get(AGE_LOCK)) return { error: 'minor' };

  const db = getDb();
  const started = await verification.beginSignUp(db, {
    email: text(form, 'email'),
    password: text(form, 'password'),
    again: text(form, 'again'),
    year: number(form, 'year'),
    month: number(form, 'month'),
    day: number(form, 'day'),
    consent: form.get('consent') === 'on',
  });
  if (!started.ok) {
    if (started.error === 'minor') store.set(AGE_LOCK, '1', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 24 * 60 * 60 });
    return { error: started.error };
  }
  if (!(await deliverNow(await write(started.mail!)))) {
    verification.forgetCode(db, started.token);
    return { error: 'sendFailed' };
  }
  await saveCodeToken(started.token);
  redirect('/code');
}

export async function forgotAction(_: AuthState, form: FormData): Promise<AuthState> {
  if (!(await isOurHost())) return { error: 'wrong' };
  const started = verification.beginReset(getDb(), text(form, 'email'));
  if (!started.ok) return { error: started.error };
  if (started.mail) await deliverLater(started.mail);
  await saveCodeToken(started.token);
  redirect('/code');
}

export async function startCheckAction(): Promise<AuthState> {
  const user = await currentUser();
  if (!user) redirect('/login');
  const db = getDb();
  const started = verification.beginCheck(db, user);
  if (!started.ok) return { error: started.error };
  if (!(await deliverNow(await write(started.mail!)))) {
    verification.forgetCode(db, started.token);
    return { error: 'sendFailed' };
  }
  await saveCodeToken(started.token);
  redirect('/code');
}

export async function resendAction(): Promise<AuthState> {
  if (!(await isOurHost())) return { error: 'wrong' };
  const db = getDb();
  const token = await readCodeToken();
  const purpose = token ? verification.findCode(db, token)?.purpose : undefined;
  if (!token || !purpose) return { error: 'expired' };
  const next = verification.resend(db, token);
  if (!next.ok) return { error: next.error };
  if (next.mail) {
    if (purpose === 'reset') await deliverLater(next.mail);
    else if (!(await deliverNow(await write(next.mail)))) return { error: 'sendFailed' };
  }
  return { sent: Date.now() };
}

export async function codeAction(_: AuthState, form: FormData): Promise<AuthState> {
  if (!(await isOurHost())) return { error: 'wrong' };
  const db = getDb();
  const token = await readCodeToken();
  const purpose = token ? verification.findCode(db, token)?.purpose : undefined;
  if (!token || !purpose) return { error: 'expired' };
  const typed = text(form, 'code');

  if (purpose === 'check') {
    const user = await currentUser();
    if (!user) redirect('/login');
    const result = verification.finishCheck(db, token, typed, user);
    if (!result.ok) return { error: result.error };
    await clearCodeToken();
    redirect('/settings');
  }

  const result = purpose === 'signup'
    ? verification.finishSignUp(db, token, typed)
    : await verification.finishReset(db, token, typed, text(form, 'password'), text(form, 'again'));
  if (!result.ok) return { error: result.error };
  await clearCodeToken();
  await startSession(result.userId);
  redirect(purpose === 'signup' || !isComplete(accounts.accountOf(db, result.userId).profile) ? '/setup/genres' : '/profile');
}

export async function logInAction(_: AuthState, form: FormData): Promise<AuthState> {
  if (!(await isOurHost())) return { error: 'wrong' };
  const db = getDb();
  const result = await accounts.logIn(db, text(form, 'email'), text(form, 'password'));
  if (!result.ok) return { error: result.error };
  await startSession(result.userId);
  redirect(isComplete(accounts.accountOf(db, result.userId).profile) ? '/profile' : '/setup/genres');
}

export async function logOutAction() {
  if (await isOurHost()) {
    await clearSession();
    await clearCodeToken();
  }
  redirect('/');
}

export async function deleteAccountAction(_: AuthState, form: FormData): Promise<AuthState> {
  const user = await currentUser();
  if (!user) redirect('/login');
  const error = await accounts.deleteAccount(getDb(), user, text(form, 'password'));
  if (error) return { error };
  await clearOutbox(user.email);
  await clearSession();
  await clearCodeToken();
  redirect('/');
}
