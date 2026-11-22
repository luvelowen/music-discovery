import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/*
 * The database is one file on this computer: data/app.db
 * It is excluded from Git, so uploading the code never uploads anyone's data.
 */
export const DB_LABEL = 'data/app.db';

const SCHEMA = `
  PRAGMA foreign_keys = ON;
  PRAGMA secure_delete = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    adult         INTEGER NOT NULL CHECK (adult = 1),
    consent_at    INTEGER NOT NULL,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL,
    profile       TEXT NOT NULL,
    social        TEXT NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  ) STRICT;

  CREATE INDEX IF NOT EXISTS sessions_by_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS login_attempts (
    email_hash TEXT NOT NULL,
    at         INTEGER NOT NULL
  ) STRICT;

  -- Added later. New tables only, so older databases upgrade by themselves and lose nothing.
  CREATE TABLE IF NOT EXISTS email_checks (
    user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    checked_at INTEGER NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS email_codes (
    id_hash       TEXT PRIMARY KEY,
    purpose       TEXT NOT NULL,
    email         TEXT NOT NULL,
    user_id       TEXT REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT,
    consent_at    INTEGER,
    code_hash     TEXT,
    tries         INTEGER NOT NULL,
    created_at    INTEGER NOT NULL,
    expires_at    INTEGER NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS email_sends (
    email_hash TEXT NOT NULL,
    at         INTEGER NOT NULL
  ) STRICT;

  -- Chat. People on both sides are ids, so real accounts fit later without a new shape.
  CREATE TABLE IF NOT EXISTS chat_consents (
    user_id   TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    agreed_at INTEGER NOT NULL
  ) STRICT;

  CREATE TABLE IF NOT EXISTS messages (
    seq          INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id    TEXT NOT NULL,
    sender_id    TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    body         TEXT NOT NULL,
    created_at   INTEGER NOT NULL,
    UNIQUE (sender_id, client_id)
  ) STRICT;

  CREATE INDEX IF NOT EXISTS messages_by_pair ON messages(sender_id, recipient_id, seq);
  CREATE INDEX IF NOT EXISTS messages_by_time ON messages(sender_id, created_at);

  CREATE TABLE IF NOT EXISTS chat_reads (
    user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    other_id TEXT NOT NULL,
    seq      INTEGER NOT NULL,
    PRIMARY KEY (user_id, other_id)
  ) STRICT;
`;

export function openDatabase(file: string) {
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

export function databaseFile() {
  return process.env.APP_DB_PATH || path.join(/*turbopackIgnore: true*/ process.cwd(), 'data', 'app.db');
}

// Kept on globalThis so saving a file during development doesn't open a second connection.
// Change the version in the name when the schema changes, so a running preview picks it up.
const shared = globalThis as typeof globalThis & { appDatabaseV3?: DatabaseSync };

export function getDb() {
  shared.appDatabaseV3 ??= openDatabase(databaseFile());
  return shared.appDatabaseV3;
}
