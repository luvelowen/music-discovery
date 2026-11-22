import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from './cn';

const VARIANTS = {
  primary: 'bg-ink text-paper hover:bg-pine',
  secondary: 'border border-edge bg-paper text-ink hover:border-ink',
  quiet: 'text-ink hover:bg-mist',
  danger: 'bg-danger text-paper hover:bg-danger/90',
};

type Variant = { variant?: keyof typeof VARIANTS };

function styles(variant: keyof typeof VARIANTS, className?: string) {
  return cn(
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-5 py-2 text-center font-medium transition-colors duration-200',
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
