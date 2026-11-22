import { cn } from '@/components/ui/cn';
import type { GenreId } from '@/lib/music/genres';
import { Sleeve } from './sleeve';

// How 1 to 5 genres share a 6 x 6 square. Each entry is [column, row, width, height].
type Tile = readonly [number, number, number, number];
const LAYOUTS: readonly (readonly Tile[])[] = [
  [],
  [[1, 1, 6, 6]],
  [[1, 1, 6, 4], [1, 5, 6, 2]],
  [[1, 1, 4, 6], [5, 1, 2, 3], [5, 4, 2, 3]],
  [[1, 1, 4, 4], [5, 1, 2, 4], [1, 5, 3, 2], [4, 5, 3, 2]],
  [[1, 1, 4, 4], [5, 1, 2, 2], [5, 3, 2, 2], [1, 5, 3, 2], [4, 5, 3, 2]],
];

export function Cover({ genres, className }: { genres: readonly GenreId[]; className?: string }) {
  const layout = LAYOUTS[genres.length] ?? [];
  return (
    <div aria-hidden className={cn('grid aspect-square grid-cols-6 grid-rows-6 overflow-hidden rounded-sleeve bg-seam outline outline-chalk/10', className)}>
      {genres.map((genre, index) => {
        const [column, row, width, height] = layout[index] ?? [1, 1, 6, 6];
        return (
          <div key={genre} className="relative min-h-0 min-w-0" style={{ gridArea: `${row} / ${column} / span ${height} / span ${width}` }}>
            <Sleeve genre={genre} className="absolute inset-0 size-full" />
          </div>
        );
      })}
    </div>
  );
}

/** The signature element: a personal sleeve with its record slipping out. */
export function CoverRecord({ genres, className }: { genres: readonly GenreId[]; className?: string }) {
  return (
    <div aria-hidden className={cn('relative aspect-[4/3]', className)}>
      <svg
        viewBox="0 0 100 100"
        className={cn(
          'absolute top-[3%] h-[94%] transition-[left] duration-700 ease-out',
          genres.length ? 'left-[27.5%]' : 'left-[4%]',
        )}
      >
        <circle cx="50" cy="50" r="50" className="fill-vinyl" />
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx="50" cy="50" r={23 + i * 3} fill="none" className="stroke-night/40" strokeWidth="0.35" />
        ))}
        <circle cx="50" cy="50" r="17" className="fill-lamp" />
        <circle cx="50" cy="50" r="2" className="fill-night" />
      </svg>
      <Cover genres={genres} className="absolute inset-y-0 left-0 h-full" />
    </div>
  );
}
