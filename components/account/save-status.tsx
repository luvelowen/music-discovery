'use client';

import { cn } from '@/components/ui/cn';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';

/** `quiet` still tells screen readers, and shows itself when saving fails. */
export function SaveStatus({ className, quiet }: { className?: string; quiet?: boolean }) {
  const { t } = useI18n();
  const { status } = useAccount();
  const problem = status !== 'saved' && status !== 'saving';
  return <p role="status" className={quiet && !problem ? 'sr-only' : cn('text-xs', problem ? 'text-danger' : 'text-muted', className)}>{t.account.status[status]}</p>;
}
