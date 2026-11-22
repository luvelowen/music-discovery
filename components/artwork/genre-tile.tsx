import { cn } from '@/components/ui/cn';
import type { GenreId } from '@/lib/music/genres';
import { Sleeve } from './sleeve';

type Props = {
  genre: GenreId;
  label: string;
  /** 1 for the first pick, 0 when it is not picked. */
  position: number;
  blocked: boolean;
  onToggle: () => void;
};

export function GenreTile({ genre, label, position, blocked, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={position > 0}
      aria-disabled={blocked || undefined}
      aria-label={label}
      className="group block w-full rounded-sleeve text-left"
    >
      <span
        className={cn(
          'relative block aspect-square rounded-sleeve outline-offset-2 transition-[outline-color,transform] duration-200 group-active:scale-[0.97]',
          position > 0 ? 'outline-4 outline-flame' : 'outline-2 outline-transparent group-hover:outline-seam',
        )}
      >
        <Sleeve genre={genre} className={cn('size-full rounded-sleeve border border-chalk/10 transition-opacity', blocked && 'opacity-30')} />
        {position > 0 && (
          <span className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full border border-night bg-chalk text-sm font-semibold text-night">
            {position}
          </span>
        )}
      </span>
      <span className={cn('mt-2.5 block text-sm leading-tight', position > 0 && 'font-semibold', blocked && 'text-muted')}>{label}</span>
    </button>
  );
}
