import { cn } from './cn';

/** The app's mark, the same ring as app/icon.svg: a record seen from above, or an earbud. Decorative. */
export function AppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('shrink-0', className)}>
      <rect width="32" height="32" rx="8" className="fill-deep" />
      <circle cx="16" cy="16" r="9.5" fill="none" strokeWidth="3" className="stroke-chalk" />
      <circle cx="16" cy="16" r="3" className="fill-accent" />
    </svg>
  );
}
