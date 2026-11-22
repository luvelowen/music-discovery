'use client';

import { Compass, Settings, UserRound, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import { usePeople } from '@/lib/demo/use-people';
import { useProfile } from '@/lib/profile/store';
import { isComplete } from '@/lib/profile/validation';
import { canViewPerson } from '@/lib/social/policy';
import { useSocial } from '@/lib/social/store';

const ITEMS = [
  { key: 'discover', href: '/discover', icon: Compass, also: '/people' },
  { key: 'connections', href: '/connections', icon: UsersRound },
  { key: 'profile', href: '/profile', icon: UserRound },
  { key: 'settings', href: '/settings', icon: Settings },
] as const;

/** Top bar on desktop, bottom bar on phones. Absent from welcome and setup, to keep those focused. */
export function AppNav({ placement }: { placement: 'top' | 'bottom' }) {
  const { t } = useI18n();
  const path = usePathname();
  const { profile } = useProfile();
  const { social } = useSocial();
  const people = usePeople();

  const inApp = /^\/(discover|connections|profile|settings|people)(\/|$)/.test(path);
  if (!inApp || !isComplete(profile)) return null;

  const waiting = people.filter((person) => social.relations[person.id] === 'incoming' && canViewPerson(social, profile, person)).length;
  const top = placement === 'top';

  return (
    <nav
      aria-label={t.community.nav.label}
      className={top ? 'hidden lg:block' : 'sticky bottom-0 z-20 border-t border-seam bg-night pb-[env(safe-area-inset-bottom)] lg:hidden'}
    >
      <ul className={top ? 'flex gap-1' : 'grid grid-cols-4'}>
        {ITEMS.map((item) => {
          const active = path.startsWith(item.href) || ('also' in item && path.startsWith(item.also));
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-center transition-colors',
                  top ? 'min-h-11 gap-2 rounded-control px-3 text-sm' : 'relative min-h-16 flex-col gap-1 text-xs',
                  active ? 'font-semibold text-flame' : 'text-muted hover:text-chalk',
                                  )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                </span>
                {t.community.nav[item.key]}
                {item.key === 'connections' && waiting > 0 && (
                  <span className={cn('grid size-5 place-items-center rounded-full bg-flame text-[0.6875rem] font-semibold text-night', !top && 'absolute top-1.5 left-1/2 ml-2')}>
                    {waiting}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
