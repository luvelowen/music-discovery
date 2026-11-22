'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePeople } from '../people/provider.tsx';
import { useAccount } from '../account/provider.tsx';
import type { ChatInput, ChatList, ChatProblem, Thread } from './types.ts';

type Result<T> = { ok: true; value: T } | { ok: false; error: ChatProblem };

type Value = {
  list: ChatList | null;
  problem: ChatProblem | null;
  unread: number;
  act: (input: ChatInput) => Promise<Result<null>>;
  getThread: (personId: string, before?: number) => Promise<Result<Thread>>;
};

const OFF: Value = {
  list: null,
  problem: null,
  unread: 0,
  act: async () => ({ ok: false, error: 'signedOut' }),
  getThread: async () => ({ ok: false, error: 'signedOut' }),
};

const CHECK_EVERY = 5000;
const ChatContext = createContext<Value>(OFF);

async function request<T>(url: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15_000), ...init });
    if (response.status === 401 || response.status === 409) return { ok: false, error: 'signedOut' };
    if (response.status >= 500) return { ok: false, error: 'offline' };
    const body = await response.json();
    return response.ok ? { ok: true, value: body as T } : { ok: false, error: (body as { error: ChatProblem }).error };
  } catch {
    return { ok: false, error: 'offline' };
  }
}

function Live({ userId, children }: { userId: string; children: ReactNode }) {
  const { status, flush } = useAccount();
  const { overview } = usePeople();
  const [list, setList] = useState<ChatList | null>(null);
  const [problem, setProblem] = useState<ChatProblem | null>(null);
  const latest = useRef(0);
  const stopped = useRef(false);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const refresh = useCallback(async () => {
    if (stopped.current) return;
    const turn = ++latest.current;
    const result = await request<ChatList & { userId: string }>('/api/chat');
    if (turn !== latest.current) return; // A newer answer is on its way.
    if (!result.ok || result.value.userId !== userId) {
      const error = result.ok ? 'signedOut' : result.error;
      stopped.current = error === 'signedOut';
      setProblem(error);
      return;
    }
    setProblem(null);
    setList({ consentAt: result.value.consentAt, chats: result.value.chats });
  }, [userId]);

  // New connections, removals and blocks change the list once they have been saved.
  const connected = overview?.connected.map((person) => person.id).join() ?? '';
  const settled = status === 'saved';
  useEffect(() => {
    if (settled) void refresh();
  }, [connected, settled, refresh]);

  useEffect(() => {
    const check = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = setInterval(check, CHECK_EVERY);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [refresh]);

  const act = useCallback(async (input: ChatInput): Promise<Result<null>> => {
    // A connection made a moment ago has to reach the server before a message can follow it.
    await flushRef.current();
    const result = await request<unknown>('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, input }),
    });
    if (!result.ok) return result;
    await refresh();
    return { ok: true, value: null };
  }, [userId, refresh]);

  const getThread = useCallback(async (personId: string, before?: number): Promise<Result<Thread>> => {
    await flushRef.current();
    const query = new URLSearchParams({ with: personId, ...(before ? { before: String(before) } : {}) });
    const result = await request<Thread & { userId: string }>(`/api/chat?${query}`);
    if (result.ok && result.value.userId !== userId) return { ok: false, error: 'signedOut' };
    return result;
  }, [userId]);

  const value = useMemo<Value>(() => {
    const unread = list?.chats.reduce((total, chat) => total + chat.unread, 0) ?? 0;
    return { list, problem, unread, act, getThread };
  }, [list, problem, act, getThread]);

  return <ChatContext value={value}>{children}</ChatContext>;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { signedIn, userId } = useAccount();
  return signedIn ? <Live key={userId} userId={userId}>{children}</Live> : <ChatContext value={OFF}>{children}</ChatContext>;
}

export function useChat() {
  return useContext(ChatContext);
}
