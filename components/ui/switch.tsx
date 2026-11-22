import { useId } from 'react';
import { cn } from './cn';

type Props = { label: string; help?: string; checked: boolean; onChange: (checked: boolean) => void };

export function Switch({ label, help, checked, onChange }: Props) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-5 py-4">
      <div className="min-w-0">
        <p id={id} className="font-medium">{label}</p>
        {help && <p id={`${id}-help`} className="mt-1 text-sm leading-relaxed text-muted">{help}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        aria-describedby={help ? `${id}-help` : undefined}
        onClick={() => onChange(!checked)}
        className="grid h-11 w-12 shrink-0 place-items-center rounded-control"
      >
        <span className={cn('relative h-7 w-12 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-edge')}>
          <span className={cn('absolute top-1 left-1 size-5 rounded-full bg-night transition-transform', checked && 'translate-x-5')} />
        </span>
      </button>
    </div>
  );
}
