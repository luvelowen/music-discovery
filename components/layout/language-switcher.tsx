'use client';

import { cn } from '@/components/ui/cn';
import { LOCALES, LOCALE_NAMES } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/provider';

export function LanguageSwitcher() {
  const { locale, t, setLocale } = useI18n();
  return (
    <div role="group" aria-label={t.languageLabel} className="flex shrink-0 gap-1">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
          className={cn(
            'min-h-11 rounded-control px-3 text-sm font-medium transition-colors',
            option === locale ? 'bg-mist text-ink' : 'text-muted hover:text-ink',
          )}
        >
          {LOCALE_NAMES[option]}
        </button>
      ))}
    </div>
  );
}
