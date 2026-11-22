import type { DatabaseSync } from 'node:sqlite';
import type { Privacy } from '../lib/social/types.ts';
import type { Profile } from '../lib/profile/types.ts';
import * as accounts from '../lib/server/accounts.ts';
import { openDatabase } from '../lib/server/db.ts';
import { hashPassword } from '../lib/server/password.ts';
import { applyPeople } from '../lib/server/people.ts';

export const NOW = Date.UTC(2026, 10, 22, 4);
export const PASS = 'correct horse battery';
const HASH = await hashPassword(PASS);

type Options = { profile?: Partial<Profile>; privacy?: Partial<Privacy>; checked?: boolean };

/** A throwaway database with ready-to-meet test people in it. */
export function world() {
  const db = openDatabase(':memory:');
  let count = 0;
  function person(name: string, { profile, privacy, checked = true }: Options = {}) {
    count += 1;
    const id = accounts.createUser(db, `person${count}@example.com`, HASH, NOW, NOW)!;
    if (checked) accounts.markEmailChecked(db, id, NOW);
    accounts.saveChanges(db, id, [
      { id: 'p', kind: 'profile', patch: { username: name, genres: ['rock', 'jazz'], ...profile } },
      { id: 'q', kind: 'privacy', patch: { discoverable: true, ...privacy } },
    ], NOW);
    return id;
  }
  return { db, person };
}

export function connect(db: DatabaseSync, from: string, to: string) {
  applyPeople(db, from, { kind: 'send', personId: to }, NOW);
  applyPeople(db, to, { kind: 'accept', personId: from }, NOW);
}
