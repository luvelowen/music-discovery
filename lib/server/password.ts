import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// scrypt is deliberately slow, so guessing passwords from a stolen database is expensive.
const N = 2 ** 17;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize('NFC'), salt, KEY_LENGTH, { N, r: R, p: P, maxmem: 256 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt:${N}:${R}:${P}:${salt.toString('base64url')}:${(await derive(password, salt)).toString('base64url')}`;
}

/** With no saved value it does the same work, so timing doesn't reveal whether an email is registered. */
export async function checkPassword(password: string, saved: string | undefined) {
  const [, , , , salt, key] = saved?.split(':') ?? [];
  const actual = await derive(password, salt ? Buffer.from(salt, 'base64url') : Buffer.alloc(16));
  const expected = key ? Buffer.from(key, 'base64url') : Buffer.alloc(KEY_LENGTH);
  return timingSafeEqual(actual, expected) && Boolean(key);
}
