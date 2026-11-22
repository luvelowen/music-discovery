import type { DatabaseSync } from 'node:sqlite';
import { getMember, isBlocked, relationBetween } from './members.ts';

/**
 * Keeps only the parts of a JPEG that draw the picture. The browser already redraws photos,
 * but a hand-made request could skip that and smuggle in GPS details or other files.
 */
export function stripJpeg(bytes: Uint8Array): Uint8Array<ArrayBuffer> | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  let at = 2;
  while (at + 4 <= bytes.length && bytes[at] === 0xff) {
    const marker = bytes[at + 1]!;
    const end = at + 2 + ((bytes[at + 2]! << 8) | bytes[at + 3]!);
    if (end < at + 4 || end > bytes.length) return null;
    const details = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!details) parts.push(bytes.subarray(at, end));
    at = end;
    if (marker !== 0xda) continue;

    // Picture data follows. Stop at the end-of-image marker, so nothing after it is kept.
    for (let i = at; i + 1 < bytes.length; i++) {
      if (bytes[i] !== 0xff || bytes[i + 1] !== 0xd9) continue;
      parts.push(bytes.subarray(at, i + 2));
      const clean = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
      let offset = 0;
      for (const part of parts) {
        clean.set(part, offset);
        offset += part.length;
      }
      return clean;
    }
    return null;
  }
  return null;
}

/** A photo is served to its owner and to connections. Everyone else gets nothing. */
export function photoFor(db: DatabaseSync, viewer: string, owner: string) {
  if (viewer !== owner) {
    if (!getMember(db, viewer) || !getMember(db, owner) || isBlocked(db, viewer, owner)) return null;
    if (relationBetween(db, viewer, owner) !== 'connected') return null;
  }
  const row = db.prepare("SELECT json_extract(profile, '$.photo') AS photo FROM users WHERE id = ?").get(owner) as { photo: string | null } | undefined;
  const base64 = row?.photo?.match(/^data:image\/jpeg;base64,([A-Za-z\d+/]+=*)$/)?.[1];
  return base64 ? stripJpeg(Buffer.from(base64, 'base64')) : null;
}
