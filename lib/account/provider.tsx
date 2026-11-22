'use client';

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { EMPTY_PROFILE } from '../profile/types.ts';
import { EMPTY_SOCIAL } from '../social/types.ts';
import type { Account, ChangeInput } from './changes.ts';
import { AccountStore, type Snapshot } from './client-store.ts';

type Value = Snapshot & {
  signedIn: boolean;
  userId: string;
  email: string;
  emailChecked: boolean;
  change: (input: ChangeInput) => void;
  flush: () => Promise<boolean>;
};

const GUEST: Value = {
  signedIn: false,
  userId: '',
  email: '',
  emailChecked: false,
  account: { profile: EMPTY_PROFILE, social: EMPTY_SOCIAL },
  status: 'saved',
  change: () => {},
  flush: async () => true,
};

const AccountContext = createContext<Value>(GUEST);

type User = { id: string; email: string; emailChecked: boolean; account: Account };

function SignedIn({ user, children }: { user: User; children: ReactNode }) {
  const [store] = useState(() => new AccountStore(user.id, user.account));
  const snapshot = useSyncExternalStore(store.subscribe, store.read, () => store.initial);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (store.hasUnsaved()) event.preventDefault();
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') void store.flush();
    };
    const focus = () => void store.refresh();
    window.addEventListener('beforeunload', warn);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('beforeunload', warn);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [store]);

  return (
    <AccountContext value={{ ...snapshot, signedIn: true, userId: user.id, email: user.email, emailChecked: user.emailChecked, change: store.change, flush: store.flush }}>
      {children}
    </AccountContext>
  );
}

export function AccountProvider({ user, children }: { user: User | null; children: ReactNode }) {
  const lastUser = useRef(user?.id);
  useEffect(() => {
    const before = lastUser.current;
    lastUser.current = user?.id;
    // Signed out or switched: load the page afresh, so none of the last person's data stays in memory.
    if (before && before !== user?.id) window.location.reload();
  }, [user?.id]);

  // The key throws away the last person's data as soon as someone else signs in.
  if (user) return <SignedIn key={user.id} user={user}>{children}</SignedIn>;
  return <AccountContext value={GUEST}>{children}</AccountContext>;
}

export function useAccount() {
  return useContext(AccountContext);
}
