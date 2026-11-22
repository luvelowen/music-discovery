import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from './cn';

const VARIANTS = {
  primary: 'bg-accent font-semibold text-night hover:bg-chalk',
  secondary: 'bg-raised text-accent hover:bg-line',
  quiet: 'text-accent hover:text-chalk',
  destructive: 'bg-raised text-danger hover:bg-line',
  danger: 'bg-danger font-semibold text-night hover:bg-chalk',
};

type Variant = { variant?: keyof typeof VARIANTS };

function styles(variant: keyof typeof VARIANTS, className?: string) {
  return cn(
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-5 py-2 text-center font-medium transition-colors',
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
