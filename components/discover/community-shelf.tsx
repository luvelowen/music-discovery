import { Check } from 'lucide-react';
import Link from 'next/link';
import { Sleeve } from '@/components/artwork/sleeve';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import type { GenreId } from '@/lib/music/genres';

type Props = {
  communities: { id: GenreId; count: number; joined: boolean }[];
  selected: GenreId | null;
};

export function CommunityShelf({ communities, selected }: Props) {
  const { t } = useI18n();
  const words = t.community.discover;

  return (
    <ul className="gutter flex gap-3.5 overflow-x-auto py-3">
      {communities.map(({ id, count, joined }) => {
        const active = id === selected;
        return (
          <li key={id} className="w-28 shrink-0">
            {/* Tapping the open community again goes back to everyone. */}
            <Link href={active ? '/discover' : `/discover?community=${id}`} scroll={false} aria-current={active ? 'true' : undefined} className="group block rounded-sleeve">
              <span className={cn('relative block aspect-square rounded-sleeve outline-2 outline-offset-2', active ? 'outline-chalk' : 'outline-transparent group-hover:outline-seam')}>
                <Sleeve genre={id} className="size-full rounded-sleeve border border-chalk/10" />
                {joined && (
                  <span className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full border border-night bg-chalk text-night">
                    <Check className="size-4" aria-hidden />
                    <span className="sr-only">{words.joinedLabel}</span>
                  </span>
                )}
              </span>
              <span className={cn('mt-2.5 block text-sm leading-tight', active ? 'font-semibold' : 'font-medium')}>{t.genres[id]}</span>
              <span className="mt-0.5 block text-sm text-muted">{words.people(count)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
