import type { DatabaseSync } from 'node:sqlite';
import { DAY } from '../social/types.ts';
import { ATTEMPT_WINDOW } from './accounts.ts';

const HOUR = 60 * 60 * 1000;

/** Removes only what has already expired, as the privacy notice promises. Never accounts, messages or reports. */
export function cleanUp(db: DatabaseSync, now = Date.now()) {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
  db.prepare('DELETE FROM email_codes WHERE created_at <= ?').run(now - DAY);
  db.prepare('DELETE FROM email_sends WHERE at <= ?').run(now - DAY);
  db.prepare('DELETE FROM request_log WHERE at <= ?').run(now - DAY);
  db.prepare('DELETE FROM login_attempts WHERE at <= ?').run(now - ATTEMPT_WINDOW);
}

/** Now, then every hour, whether or not anybody visits. It doesn't keep the app running by itself. */
export function keepTidy(db: DatabaseSync) {
  const tidy = () => {
    try {
      cleanUp(db);
    } catch (error) {
      console.error('Could not remove expired records:', error instanceof Error ? error.message : 'unknown error');
    }
  };
  tidy();
  setInterval(tidy, HOUR).unref();
}
