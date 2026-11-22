import Link from 'next/link';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import type { GenreId } from '@/lib/music/genres';

type Props = {
  communities: { id: GenreId; count: number; joined: boolean }[];
  selected: GenreId | null;
};

/** Categories are words only. */
export function CommunityShelf({ communities, selected }: Props) {
  const { t } = useI18n();
  const words = t.community.discover;

  return (
    <ul className="flex gap-x-5 overflow-x-auto md:flex-wrap md:overflow-visible">
      <li className="shrink-0">
        <Link
          href="/discover"
          scroll={false}
          aria-current={selected ? undefined : 'true'}
          className={cn('inline-flex min-h-11 items-center text-sm whitespace-nowrap', selected ? 'hover:text-accent' : 'text-accent')}
        >
          {words.everyone}
        </Link>
      </li>
      {communities.map(({ id, count, joined }) => {
        const active = id === selected;
        return (
          <li key={id} className="shrink-0">
            {/* Tapping the open category again goes back to everyone. */}
            <Link
              href={active ? '/discover' : `/discover?community=${id}`}
              scroll={false}
              aria-current={active ? 'true' : undefined}
              className={cn('inline-flex min-h-11 items-center gap-1.5 text-sm whitespace-nowrap', active ? 'text-accent' : 'hover:text-accent')}
            >
              {t.genres[id]}
              {(count > 0 || joined) && (
                <span className="text-muted">{[count || null, joined ? words.joinedLabel : null].filter(Boolean).join(', ')}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
