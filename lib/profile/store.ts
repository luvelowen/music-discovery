'use client';

import { useAccount } from '../account/provider.tsx';
import type { Profile } from './types.ts';

export function useProfile() {
  return { profile: useAccount().account.profile };
}

/** Shows the change at once and saves it to the account. */
export function useUpdateProfile() {
  const { account, change } = useAccount();
  return (next: (profile: Profile) => Partial<Profile>) => {
    const patch = next(account.profile);
    if (Object.keys(patch).length) change({ kind: 'profile', patch });
  };
}
