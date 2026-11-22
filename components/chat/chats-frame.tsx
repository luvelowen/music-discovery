'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { PageTitle } from '@/components/ui/page-title';
import { useChat } from '@/lib/chat/provider';
import { useI18n } from '@/lib/i18n/provider';
import { ChatConsent } from './chat-consent';
import { ChatListPane } from './chat-list';

/** One pane on phones. On wide screens, the list stays beside the open chat. */
export function ChatsFrame({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { list, problem } = useChat();
  const open = usePathname() !== '/chats';

  if (!list) {
    return (
      <div className="gutter pt-8 pb-14">
        <PageTitle title={t.chat.title} />
        <p role="status" className="mt-4 text-muted">{problem ? t.chat.errors[problem] : t.chat.loading}</p>
        {problem === 'signedOut' && <ButtonLink href="/login" className="mt-4">{t.account.logIn}</ButtonLink>}
      </div>
    );
  }
  if (list.consentAt === null) return <ChatConsent />;

  return (
    <div className={cn('flex min-w-0 flex-1 xl:h-dvh xl:flex-none', open && 'h-[calc(100dvh-4rem)] flex-none lg:h-dvh')}>
      <div className={cn('relative w-full min-w-0 xl:block xl:w-80 xl:shrink-0 xl:overflow-y-auto xl:border-r xl:border-line', open && 'hidden')}>
        <ChatListPane open={open} />
      </div>
      <div className={cn('min-w-0 flex-1 xl:block', !open && 'hidden')}>{children}</div>
    </div>
  );
}

export function NoChatChosen() {
  const { t } = useI18n();
  return <p className="grid h-full place-items-center p-8 text-center text-muted">{t.chat.choose}</p>;
}
