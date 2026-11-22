'use client';

import { cn } from '@/components/ui/cn';
import { useAccount } from '@/lib/account/provider';
import { useI18n } from '@/lib/i18n/provider';

export function SaveStatus({ className }: { className?: string }) {
  const { t } = useI18n();
  const { status } = useAccount();
  const problem = status !== 'saved' && status !== 'saving';
  return <p role="status" className={cn('text-xs', problem ? 'text-danger' : 'text-muted', className)}>{t.account.status[status]}</p>;
}
