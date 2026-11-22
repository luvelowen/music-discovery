const EMAIL = /\S+@\S+\.\S+/u;
const HANDLE = /(^|[^\p{L}\p{N}])@[\p{L}\p{N}_.]{2,}/u;
const LINK = /https?:\/\/|www\.|\b(t\.me|wa\.me|m\.me|discord\.gg)\b|\b[a-z\d-]{2,}\.(com|mn|net|org|gg)\b/i;
const PHONE = /(\d[\s()._-]{0,3}){7}\d/;
const YEAR_RANGE = /\b(19|20)\d\d\s?[-–]\s?(19|20)\d\d\b/g;

/**
 * Catches the common ways contact details end up in public text.
 * It is a helpful nudge, not moderation: the server must repeat this check,
 * and human review is still needed for anything disguised.
 */
export function hasContactInfo(text: string): boolean {
  const value = text.normalize('NFKC').replace(YEAR_RANGE, ' ');
  return [EMAIL, HANDLE, LINK, PHONE].some((pattern) => pattern.test(value));
}
