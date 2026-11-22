import { CHAT_LIMITS, type ChatError } from './types.ts';

/** Plain text only. Keeps line breaks and emoji, removes characters that can disguise what a message says. */
export function cleanMessage(raw: string): { text: string } | { error: ChatError } {
  // An early limit, so an enormous text costs nothing to refuse.
  if (raw.length > CHAT_LIMITS.length * 4) return { error: 'tooLong' };
  const text = raw
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\p{Bidi_Control}/gu, '')
    .replace(/(?!\n)\p{Cc}/gu, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // Something must be visible: not only spaces or zero-width characters.
  if (!/[^\p{C}\p{Z}\p{Mn}]/u.test(text)) return { error: 'empty' };
  return [...text].length > CHAT_LIMITS.length ? { error: 'tooLong' } : { text };
}
