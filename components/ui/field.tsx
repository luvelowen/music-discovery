import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from './cn';

type FieldProps = { label: string; help?: string; error?: string | null };

// text-base (16px) matters: anything smaller makes iPhones zoom in when you tap the field.
const control = (error?: string | null) =>
  cn(
    'w-full min-w-0 rounded-control border bg-surface px-4 text-base transition-colors placeholder:text-muted/70 focus:border-accent focus:bg-sidebar focus-visible:outline-offset-1',
    error ? 'border-danger' : 'border-edge hover:border-chalk',
  );

function Wrapper({ id, label, help, error, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      {children}
      {help && <p id={`${id}-help`} className="mt-2 text-sm text-muted">{help}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

function describe(id: string, help?: string, error?: string | null) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': cn(help && `${id}-help`, error && `${id}-error`) || undefined,
  };
}

/** `action` sits beside the input, which keeps it aligned when help or an error appears below. */
export function TextField({ label, help, error, action, className, ...props }: FieldProps & { action?: ReactNode } & ComponentProps<'input'>) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} help={help} error={error}>
      <div className="relative flex gap-2">
        <input id={id} autoComplete="off" className={cn(control(error), 'h-13', className)} {...describe(id, help, error)} {...props} />
        {action}
      </div>
    </Wrapper>
  );
}

export function TextArea({ label, help, error, ...props }: FieldProps & ComponentProps<'textarea'>) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} help={help} error={error}>
      <textarea id={id} rows={3} className={cn(control(error), 'block resize-none py-3')} {...describe(id, help, error)} {...props} />
    </Wrapper>
  );
}
