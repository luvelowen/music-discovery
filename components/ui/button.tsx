import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from './cn';

// Pill buttons, as in Spotify and Apple Music. A light press-down on tap, nothing else moves.
const VARIANTS = {
  primary: 'bg-deep font-bold text-chalk hover:bg-deep-lit',
  secondary: 'border border-edge font-semibold text-chalk hover:border-chalk hover:bg-surface',
  quiet: 'text-accent hover:text-chalk',
  destructive: 'border border-edge text-danger hover:border-chalk hover:bg-surface',
  danger: 'bg-chalk font-bold text-night hover:bg-accent',
};

type Variant = { variant?: keyof typeof VARIANTS };

function styles(variant: keyof typeof VARIANTS, className?: string) {
  return cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2 text-center font-medium transition-[color,background-color,border-color,transform] active:scale-[0.97] disabled:active:scale-100',
    VARIANTS[variant],
    className,
  );
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ComponentProps<'button'> & Variant) {
  return <button type={type} className={styles(variant, className)} {...props} />;
}

export function ButtonLink({ variant = 'primary', className, ...props }: ComponentProps<typeof Link> & Variant) {
  return <Link className={styles(variant, className)} {...props} />;
}
