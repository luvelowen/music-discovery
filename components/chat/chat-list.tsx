'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/profile/avatar';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { PageTitle } from '@/components/ui/page-title';
import { useChat } from '@/lib/chat/provider';
import { usePeople } from '@/lib/people/provider';
import { formatDateTime } from '@/lib/format-date';
import { useI18n } from '@/lib/i18n/provider';

export function ChatListPane({ open }: { open: boolean }) {
  const { t } = useI18n();
  const words = t.chat;
  const path = usePathname();
  const { list, problem } = useChat();
  const { overview } = usePeople();
  const today = formatDateTime(Date.now()).slice(0, 10);

  const rows = (list?.chats ?? []).flatMap((chat) => {
    const seen = overview?.connected.find((item) => item.id === chat.personId)?.profile;
    return seen ? [{ ...chat, seen }] : [];
  });

  return (
    <div className="px-5 pt-8 pb-10 xl:px-3">
      <div className="xl:px-2">
        {/* One main heading on each screen: the open chat takes it over. */}
        {open ? <h2 className="title">{words.title}</h2> : <PageTitle title={words.title} body={words.body} />}
        {problem && <p role="status" className="mt-2 text-sm text-danger">{words.errors[problem]}</p>}
      </div>

      {rows.length ? (
        <ul className="mt-5 space-y-0.5">
          {rows.map(({ personId, seen, last, unread }) => {
            const active = path === `/chats/${personId}`;
            const when = last ? formatDateTime(last.at) : '';
            return (
              <li key={personId}>
                <Link
                  href={`/chats/${personId}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex min-h-18 items-center gap-3 rounded-control px-2 py-2.5', active ? 'bg-raised' : 'hover:bg-surface')}
                >
                  <Avatar profile={seen} className="size-11 text-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate font-semibold">{seen.username}</span>
                      {last && <span className="shrink-0 text-xs text-muted">{when.startsWith(today) ? when.slice(11) : when.slice(5, 10)}</span>}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span dir="auto" className={cn('min-w-0 truncate text-sm', unread ? 'font-semibold' : 'text-muted')}>
                        {last ? `${last.mine ? `${words.you}: ` : ''}${last.body}` : words.start}
                      </span>
                      {unread > 0 && (
                        <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-xs font-semibold text-night">
                          <span aria-hidden>{unread}</span>
                          <span className="sr-only">{words.unread(unread)}</span>
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-7 xl:px-2">
          <p className="font-semibold">{words.emptyTitle}</p>
          <p className="mt-1 mb-5 text-sm leading-relaxed text-muted">{words.emptyBody}</p>
          <ButtonLink href="/discover">{words.find}</ButtonLink>
        </div>
      )}
    </div>
  );
}
