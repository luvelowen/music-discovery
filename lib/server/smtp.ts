import { randomUUID } from 'node:crypto';
import { connect } from 'node:tls';

type Settings = { host: string; port: number; user: string; pass: string };
type Message = { to: string; subject: string; text: string };

const TIMEOUT = 15_000;
const base64 = (text: string) => Buffer.from(text, 'utf8').toString('base64');
const ADDRESS = /^[^\s<>,;]+@[^\s<>,;]+$/;

/** The small part of SMTP this app needs: one plain-text email over an encrypted, certificate-checked connection. */
export function sendSmtp({ host, port, user, pass }: Settings, { to, subject, text }: Message): Promise<void> {
  // A line break inside an address could smuggle in extra recipients.
  if (!ADDRESS.test(user) || !ADDRESS.test(to)) return Promise.reject(new Error('Bad email address'));

  const message = [
    `From: <${user}>`,
    `To: <${to}>`,
    `Subject: =?UTF-8?B?${base64(subject)}?=`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${randomUUID()}@${user.split('@')[1]}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    ...(base64(text).match(/.{1,76}/g) ?? []),
    '.',
  ].join('\r\n');

  const steps: [expected: number, send: string | null][] = [
    [220, 'EHLO localhost'],
    [250, 'AUTH LOGIN'],
    [334, base64(user)],
    [334, base64(pass)],
    [235, `MAIL FROM:<${user}>`],
    [250, `RCPT TO:<${to}>`],
    [250, 'DATA'],
    [354, message],
    [250, null],
  ];

  return new Promise((resolve, reject) => {
    const socket = connect({ host, port, servername: host, minVersion: 'TLSv1.2' });
    let buffer = '';
    let step = 0;
    let settled = false;

    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      if (error) {
        socket.destroy();
        reject(error);
      } else {
        socket.end('QUIT\r\n');
        resolve();
      }
    }

    socket.setEncoding('utf8');
    socket.setTimeout(TIMEOUT, () => (settled ? socket.destroy() : finish(new Error('Email server timed out'))));
    socket.on('error', finish);
    socket.on('close', () => finish(new Error('Email server closed the connection')));
    socket.on('data', (chunk: string) => {
      buffer += chunk;
      let end: number;
      while (!settled && (end = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (/^\d{3}-/.test(line)) continue; // More lines of the same reply follow.
        const [expected, send] = steps[step]!;
        // The reply isn't included in the error: it can repeat the email address.
        if (Number(line.slice(0, 3)) !== expected) return finish(new Error(`Email server said ${line.slice(0, 3)} at step ${step + 1}`));
        step += 1;
        if (send === null) return finish();
        socket.write(`${send}\r\n`);
      }
    });
  });
}
