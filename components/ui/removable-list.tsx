'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/provider';

type Item = { key: string; title: string; detail?: string; leading?: ReactNode; onRemove: () => void };

export function RemovableList({ items }: { items: Item[] }) {
  const { t } = useI18n();
  if (items.length === 0) return null;

  return (
    <ul className="divide-y divide-line">
      {items.map(({ key, title, detail, leading, onRemove }) => (
        <li key={key} className="flex items-center gap-3 py-2.5">
          {leading}
          <div className="min-w-0 flex-1">
            <p className="font-medium break-words">{title}</p>
            {detail && <p className="text-sm break-all text-muted">{detail}</p>}
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={t.setup.remove(title)}
            className="grid size-11 shrink-0 place-items-center rounded-control text-muted transition-colors hover:bg-surface hover:text-chalk"
          >
            <X className="size-5" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
