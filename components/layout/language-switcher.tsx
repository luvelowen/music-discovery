'use client';

import { cn } from '@/components/ui/cn';
import { LOCALES, LOCALE_NAMES } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/provider';

export function LanguageSwitcher() {
  const { locale, t, setLocale } = useI18n();
  return (
    <div role="group" aria-label={t.languageLabel} className="flex shrink-0">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
          className={cn('min-h-11 px-2 text-sm', option === locale ? 'font-medium text-accent' : 'text-muted hover:text-chalk')}
        >
          {LOCALE_NAMES[option]}
        </button>
      ))}
    </div>
  );
}
