'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePeople } from '@/lib/demo/use-people';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile } from '@/lib/profile/store';
import { demoReceiveRequest } from '@/lib/social/actions';
import { canReceiveFrom } from '@/lib/social/policy';
import { updateSocial, useSocial } from '@/lib/social/store';

type Result = { kind: 'hidden' | 'nobody' | 'none' } | { kind: 'received'; name: string };

/** Prototype only. Delete with lib/demo when real accounts arrive. */
export function DemoTools({ onReceived }: { onReceived: () => void }) {
  const { t } = useI18n();
  const words = t.community.demo;
  const { profile } = useProfile();
  const { social } = useSocial();
  const people = usePeople();
  const [result, setResult] = useState<Result | null>(null);

  function receive() {
    const sender = people.find((person) => canReceiveFrom(social, profile, person));
    if (!sender) {
      setResult({ kind: !social.privacy.discoverable ? 'hidden' : social.privacy.requests === 'nobody' ? 'nobody' : 'none' });
      return;
    }
    updateSocial((state) => demoReceiveRequest(state, profile, sender));
    setResult({ kind: 'received', name: sender.profile.username });
    onReceived();
  }

  return (
    <aside className="mt-10 rounded-control border border-dashed border-edge p-5">
      <h2 className="font-semibold">{words.title}</h2>
      <p className="mt-1 mb-4 text-sm text-muted">{words.body}</p>
      <Button variant="secondary" onClick={receive}>{words.receive}</Button>
      <p role="status" className="mt-3 min-h-5 text-sm text-flame">
        {result && (result.kind === 'received' ? words.received(result.name) : words[result.kind])}
      </p>
    </aside>
  );
}
