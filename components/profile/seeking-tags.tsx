'use client';

import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import type { Seeking } from '@/lib/profile/types';

/** Give it an already filtered profile's list, never the raw one. */
export function SeekingTags({ seeking, className }: { seeking: readonly Seeking[]; className?: string }) {
  const { t } = useI18n();
  if (!seeking.length) return null;
  return (
    <p className={cn('flex flex-wrap gap-x-3 text-sm font-semibold', className)}>
      <span className="sr-only">{t.profile.seeking}: </span>
      {seeking.map((value) => (
        <span key={value} className={value === 'dating' ? 'text-flame' : 'text-blush'}>{t.seeking[value]}</span>
      ))}
    </p>
  );
}
