import type { Shown } from '../consent/text.ts';

export const CHAT_LIMITS = { length: 1000, page: 50, perMinute: 20, perDay: 500, evidence: 30 } as const;

export type ChatError = 'consent' | 'changed' | 'theyOff' | 'notConnected' | 'empty' | 'tooLong' | 'tooMany' | 'invalid';
/** What the screen can add: connection trouble, or a signed-out tab. */
export type ChatProblem = ChatError | 'offline' | 'signedOut';

export type Message = { seq: number; mine: boolean; body: string; at: number };
export type ChatSummary = { personId: string; last: Message | null; unread: number };
export type ChatList = { consentAt: number | null; chats: ChatSummary[] };

/** `first` is the oldest message still shown, so a screen can drop anything cleared before it. */
export type Thread = { messages: Message[]; first: number | null; more: boolean; theyOn: boolean };

export type ChatInput =
  | { kind: 'consent'; shown: Shown }
  | { kind: 'off' }
  | { kind: 'send'; personId: string; id: string; text: string }
  | { kind: 'read'; personId: string; seq: number }
  | { kind: 'delete'; personId: string };
