'use client';

import { useAccount } from '../account/provider.tsx';

export function useSocial() {
  const { account, change } = useAccount();
  return { social: account.social, change };
}
