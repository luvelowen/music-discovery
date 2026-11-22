import { cn } from '@/components/ui/cn';

type Props<T extends string> = {
  label: string;
  options: readonly T[];
  names: Record<T, string>;
  chosen: readonly T[];
  max: number;
  onChange: (next: T[]) => void;
};

export function ChipPicker<T extends string>({ label, options, names, chosen, max, onChange }: Props<T>) {
  const full = chosen.length >= max;
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = chosen.includes(option);
        const blocked = full && !active;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            aria-disabled={blocked || undefined}
            onClick={() => {
              if (active) onChange(chosen.filter((item) => item !== option));
              else if (!blocked) onChange([...chosen, option]);
            }}
            className={cn(
              'min-h-11 rounded-control px-3.5 text-sm',
              active ? 'bg-accent font-semibold text-night' : blocked ? 'bg-raised text-muted' : 'bg-raised hover:text-accent',
            )}
          >
            {names[option]}
          </button>
        );
      })}
    </div>
  );
}
