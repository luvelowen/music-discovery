import { randomBytes } from 'node:crypto';
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { databaseFile } from './db.ts';
import { sendSmtp } from './smtp.ts';

/*
 * With SMTP_USER and SMTP_PASS in .env.local, emails are really sent.
 * Without them they are written to data/outbox, so the app can be tried on this computer.
 * Never log an email: it holds a code that opens an account.
 */
export type Mail = { to: string; subject: string; text: string };
export type Delivery = 'email' | 'file';

const KEEP = 24 * 60 * 60 * 1000;

function settings() {
  const user = process.env.SMTP_USER?.trim();
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  // Google shows its app passwords in groups with spaces.
  const pass = host === 'smtp.gmail.com' ? process.env.SMTP_PASS?.replace(/\s/g, '') : process.env.SMTP_PASS;
  return user && pass ? { host, port: Number(process.env.SMTP_PORT || 465), user, pass } : null;
}

export function deliveryMethod(): Delivery {
  return settings() ? 'email' : 'file';
}

const outbox = () => path.join(/*turbopackIgnore: true*/ path.dirname(databaseFile()), 'outbox');

/** Deleting an account removes its emails from the local folder too. */
export async function clearOutbox(email: string) {
  for (const name of await readdir(outbox()).catch(() => [])) {
    if (!name.endsWith('.txt')) continue;
    const file = path.join(/*turbopackIgnore: true*/ outbox(), name);
    if ((await readFile(file, 'utf8').catch(() => '')).startsWith(`To: ${email}\n`)) await unlink(file).catch(() => {});
  }
}

export async function sendMail(mail: Mail) {
  const smtp = settings();
  if (smtp) return sendSmtp(smtp, mail);
  // Writing codes to a file is only for trying the app locally, never for a public address.
  if (process.env.APP_HOSTS) throw new Error('Email is not set up');

  const folder = outbox();
  await mkdir(folder, { recursive: true });
  for (const name of await readdir(folder)) {
    if (!name.endsWith('.txt')) continue;
    const file = path.join(/*turbopackIgnore: true*/ folder, name);
    await stat(file).then((info) => (Date.now() - info.mtimeMs > KEEP ? unlink(file) : undefined)).catch(() => {});
  }
  const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomBytes(3).toString('hex')}.txt`;
  await writeFile(path.join(/*turbopackIgnore: true*/ folder, name), `To: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`, 'utf8');
}
