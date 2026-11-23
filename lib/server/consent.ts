import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { consentWording, shownMark, type ConsentKind, type Shown } from '../consent/text.ts';
import type { Locale } from '../i18n/config.ts';
import { operator } from './operator.ts';

/*
 * Proof of consent: which words, in which language, when, and when it was withdrawn.
 * Events are only ever added. They go when the account is deleted.
 */
export type Agreed = { hash: string; locale: Locale };

/** Saves the words that were shown. Null when they are no longer the current words. */
export function keepText(db: DatabaseSync, kind: ConsentKind, shown: Shown | null | undefined): Agreed | null {
  if (!shown || shown.mark !== shownMark(kind, shown.locale)) return null;
  // Who runs the app and where data is kept are part of what people agree to.
  const body = JSON.stringify({ wording: consentWording(kind, shown.locale), operator: operator() });
  const hash = createHash('sha256').update(body).digest('hex');
  db.prepare('INSERT INTO consent_texts VALUES (?, ?) ON CONFLICT DO NOTHING').run(hash, body);
  return { hash, locale: shown.locale };
}

/** An agreement with no text is one given before the app saved wording. */
export function recordAgreed(db: DatabaseSync, userId: string, kind: ConsentKind, agreed: Agreed | null, at: number) {
  db.prepare("INSERT INTO consent_events (user_id, kind, action, text_hash, locale, at) VALUES (?, ?, 'agreed', ?, ?, ?)")
    .run(userId, kind, agreed?.hash ?? null, agreed?.locale ?? null, at);
}

export function recordWithdrawn(db: DatabaseSync, userId: string, kind: ConsentKind, agreedAt: number, at: number) {
  const proof = db.prepare("SELECT 1 FROM consent_events WHERE user_id = ? AND kind = ? AND action = 'agreed'").get(userId, kind);
  if (!proof) recordAgreed(db, userId, kind, null, agreedAt);
  db.prepare("INSERT INTO consent_events (user_id, kind, action, text_hash, locale, at) VALUES (?, ?, 'withdrawn', NULL, NULL, ?)").run(userId, kind, at);
}

export function consentHistory(db: DatabaseSync, userId: string) {
  const rows = db
    .prepare('SELECT kind, action, locale, at, body FROM consent_events LEFT JOIN consent_texts ON hash = text_hash WHERE user_id = ? ORDER BY consent_events.id')
    .all(userId) as { kind: ConsentKind; action: 'agreed' | 'withdrawn'; locale: Locale | null; at: number; body: string | null }[];
  return rows.map(({ body, ...row }) => ({ ...row, text: body === null ? null : (JSON.parse(body) as object) }));
}
