import type { ComponentProps } from 'react';
import { cn } from './cn';

/** A radio button or checkbox with a label that is easy to tap. */
export function Choice({ label, className, ...props }: { label: string } & ComponentProps<'input'>) {
  return (
    <label className={cn('flex min-h-12 cursor-pointer items-center gap-3 py-2', className)}>
      <input className="size-5 shrink-0 accent-pine" {...props} />
      <span>{label}</span>
    </label>
  );
}
