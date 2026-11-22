'use client';

import { Compass, MessageCircle, Settings, UserRound, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/profile/avatar';
import { cn } from '@/components/ui/cn';
import { useAccount } from '@/lib/account/provider';
import { useChat } from '@/lib/chat/provider';
import { usePeople } from '@/lib/people/provider';
import { useI18n } from '@/lib/i18n/provider';
import { isComplete } from '@/lib/profile/validation';
import { LanguageSwitcher } from './language-switcher';

const ITEMS = [
  { key: 'discover', href: '/discover', icon: Compass, also: '/people' },
  { key: 'chats', href: '/chats', icon: MessageCircle },
  { key: 'connections', href: '/connections', icon: UsersRound },
  { key: 'profile', href: '/profile', icon: UserRound },
  { key: 'settings', href: '/settings', icon: Settings, also: '/account' },
] as const;

/** Absent from welcome, sign-in and setup, to keep those focused. */
export function useInApp() {
  const path = usePathname();
  const { signedIn, account } = useAccount();
  return signedIn && /^\/(discover|chats|connections|profile|settings|people|account)(\/|$)/.test(path) && (path === '/profile/edit' || isComplete(account.profile));
}

export function AppNav({ placement }: { placement: 'side' | 'bottom' }) {
  const { t } = useI18n();
  const path = usePathname();
  const { account: { profile } } = useAccount();
  const { overview } = usePeople();
  const { unread } = useChat();

  const waiting = overview?.incoming.length ?? 0;
  const side = placement === 'side';

  const list = (
    <ul className={side ? 'space-y-1' : 'grid grid-cols-5'}>
      {ITEMS.map((item) => {
        const active = path.startsWith(item.href) || ('also' in item && path.startsWith(item.also));
        const Icon = item.icon;
        const count = item.key === 'connections' ? waiting : item.key === 'chats' ? unread : 0;
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center',
                side ? 'min-h-11 gap-3 rounded-control px-2.5' : 'relative min-h-16 flex-col justify-center gap-1 text-[0.6875rem] tracking-tight',
                side && (active ? 'bg-raised font-semibold' : 'hover:bg-surface'),
                !side && (active ? 'text-accent' : 'text-muted'),
              )}
            >
              <Icon className={cn('size-5 shrink-0', side && 'text-accent')} strokeWidth={active ? 2.2 : 1.7} aria-hidden />
              {t.community.nav[item.key]}
              {count > 0 && (
                <span className={cn('font-semibold text-accent', side ? 'ml-auto' : 'absolute top-1.5 left-1/2 ml-3')}>{count}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  if (!side) {
    return (
      <nav aria-label={t.community.nav.label} className="sticky bottom-0 z-20 border-t border-line bg-sidebar pb-[env(safe-area-inset-bottom)] lg:hidden">
        {list}
      </nav>
    );
  }

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col overflow-y-auto border-r border-line bg-sidebar p-3 lg:flex">
      <Link href="/" className="mb-5 flex min-h-12 items-center px-2.5 leading-tight font-bold">{t.appName}</Link>
      <nav aria-label={t.community.nav.label}>{list}</nav>
      <div className="mt-auto pt-6">
        <LanguageSwitcher />
        <Link href="/profile" className="mt-2 flex min-h-14 items-center gap-3 rounded-control px-2.5 hover:bg-surface">
          <Avatar profile={profile} className="size-9 text-sm" />
          <span className="min-w-0 truncate text-sm">{profile.username}</span>
        </Link>
      </div>
    </div>
  );
}
