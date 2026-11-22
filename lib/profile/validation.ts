import { hasContactInfo } from '../safety/contact-info.ts';
import { LIMITS, type Profile } from './types.ts';

export type UsernameError = 'usernameLength' | 'usernameCharacters' | 'contactInfo';

/** Tidies spacing and removes invisible control characters that can disguise text. */
export function cleanText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/[\p{Cc}\s]+/gu, ' ')
    .trim();
}

export function checkUsername(value: string): UsernameError | null {
  const name = value.normalize('NFC');
  const length = [...name].length;
  if (length < LIMITS.usernameMin || length > LIMITS.usernameMax) return 'usernameLength';
  if (hasContactInfo(name)) return 'contactInfo';
  // Letters from any alphabet, so Mongolian usernames work.
  if (!/^[\p{L}\p{N}._]+$/u.test(name)) return 'usernameCharacters';
  return null;
}

export function checkBio(value: string): 'contactInfo' | null {
  return hasContactInfo(value) ? 'contactInfo' : null;
}

export function isComplete(profile: Profile): boolean {
  return profile.genres.length > 0 && !checkUsername(profile.username) && !checkBio(profile.bio);
}
