'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAccount } from '../account/provider.tsx';
import type { DiscoverPage, Overview, PeopleInput, PeopleProblem, Seen } from './types.ts';

type Result<T> = { ok: true; value: T } | { ok: false; error: PeopleProblem };

type Value = {
  overview: Overview | null;
  problem: PeopleProblem | null;
  /** Goes up whenever a screen showing people should ask again. */
  revision: number;
  act: (input: PeopleInput) => Promise<Result<null>>;
  getPerson: (id: string) => Promise<Result<{ person: Seen | null }>>;
  getDiscover: (query: URLSearchParams) => Promise<Result<DiscoverPage>>;
};

const signedOut = async () => ({ ok: false, error: 'signedOut' }) as const;
const OFF: Value = { overview: null, problem: null, revision: 0, act: signedOut, getPerson: signedOut, getDiscover: signedOut };
const CHECK_EVERY = 5000;
const PeopleContext = createContext<Value>(OFF);

async function request<T>(url: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15_000), ...init });
    if (response.status === 401 || response.status === 409) return { ok: false, error: 'signedOut' };
    if (response.status >= 500) return { ok: false, error: 'offline' };
    const body = await response.json();
    return response.ok ? { ok: true, value: body as T } : { ok: false, error: (body as { error: PeopleProblem }).error };
  } catch {
    return { ok: false, error: 'offline' };
  }
}

function Live({ userId, children }: { userId: string; children: ReactNode }) {
  const { status, flush, emailChecked } = useAccount();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [problem, setProblem] = useState<PeopleProblem | null>(null);
  const [revision, setRevision] = useState(0);
  const latest = useRef(0);
  const stopped = useRef(false);
  const last = useRef('');
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const refresh = useCallback(async () => {
    if (stopped.current) return;
    const turn = ++latest.current;
    const result = await request<Overview & { userId: string }>('/api/people');
    if (turn !== latest.current) return; // A newer answer is on its way.
    if (!result.ok || result.value.userId !== userId) {
      const error = result.ok ? 'signedOut' : result.error;
      stopped.current = error === 'signedOut';
      setProblem(error);
      return;
    }
    setProblem(null);
    const { userId: _, ...value } = result.value;
    const text = JSON.stringify(value);
    if (text === last.current) return;
    last.current = text;
    setOverview(value);
    setRevision((number) => number + 1);
  }, [userId]);

  // My own profile and privacy decide whom I see, so ask again once a change has been saved.
  const settled = status === 'saved';
  useEffect(() => {
    if (!settled) return;
    setRevision((number) => number + 1);
    void refresh();
  }, [settled, emailChecked, refresh]);

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

  const act = useCallback(async (input: PeopleInput): Promise<Result<null>> => {
    await flushRef.current();
    const result = await request<unknown>('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, input }),
    });
    await refresh();
    setRevision((number) => number + 1);
    return result.ok ? { ok: true, value: null } : result;
  }, [userId, refresh]);

  const mine = useCallback(async <T,>(url: string): Promise<Result<T>> => {
    const result = await request<T & { userId: string }>(url);
    if (result.ok && result.value.userId !== userId) return { ok: false, error: 'signedOut' };
    return result;
  }, [userId]);

  const getPerson = useCallback((id: string) => mine<{ person: Seen | null }>(`/api/people?${new URLSearchParams({ id })}`), [mine]);
  const getDiscover = useCallback((query: URLSearchParams) => mine<DiscoverPage>(`/api/people?view=discover&${query}`), [mine]);

  const value = useMemo(() => ({ overview, problem, revision, act, getPerson, getDiscover }), [overview, problem, revision, act, getPerson, getDiscover]);
  return <PeopleContext value={value}>{children}</PeopleContext>;
}

export function PeopleProvider({ children }: { children: ReactNode }) {
  const { signedIn, userId } = useAccount();
  return signedIn ? <Live key={userId} userId={userId}>{children}</Live> : <PeopleContext value={OFF}>{children}</PeopleContext>;
}

export function usePeople() {
  return useContext(PeopleContext);
}
