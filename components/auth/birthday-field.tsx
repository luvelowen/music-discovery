'use client';

import { CalendarCheck, ShieldCheck } from 'lucide-react';
import { useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/components/ui/cn';
import { useI18n } from '@/lib/i18n/provider';
import { getAgeGroup } from '@/lib/social/eligibility';

const PARTS = [
  { key: 'year', length: 4, autoComplete: 'bday-year' },
  { key: 'month', length: 2, autoComplete: 'bday-month' },
  { key: 'day', length: 2, autoComplete: 'bday-day' },
] as const;
type Part = (typeof PARTS)[number]['key'];

/**
 * Three big boxes in Mongolian date order: year, month, day. Typing moves on by itself, Backspace moves back,
 * and pasting 2001-03-14 fills all three.
 * The date shown underneath only says the date is real. It never says whether someone is old enough:
 * that is checked once, on the server, so changing the year until it passes doesn't work.
 */
export function BirthdayField({ error, legendHidden }: { error?: string | null; legendHidden?: boolean }) {
  const { t, locale } = useI18n();
  const words = t.account;
  const id = useId();
  const [value, setValue] = useState<Record<Part, string>>({ year: '', month: '', day: '' });
  const boxes = useRef<Record<Part, HTMLInputElement | null>>({ year: null, month: null, day: null });

  const focus = (index: number) => {
    const part = PARTS[index];
    if (part) boxes.current[part.key]?.focus();
  };

  // Digits beyond a box's length (fast typing, autofill) flow on into the next box.
  const change = (start: number, raw: string) => {
    let rest = raw.replace(/\D/g, '');
    const next: Partial<Record<Part, string>> = {};
    let index = start;
    let moveTo = start;
    while (index < PARTS.length) {
      const { key, length } = PARTS[index]!;
      // A month of 2 to 9, or a day of 4 to 9, can only be one digit.
      const take = (key === 'month' && /^[2-9]/.test(rest)) || (key === 'day' && /^[4-9]/.test(rest)) ? 1 : length;
      next[key] = rest.slice(0, take);
      rest = rest.slice(take);
      const done = next[key]!.length === take;
      moveTo = done ? index + 1 : index;
      if (!done || !rest) break;
      index++;
    }
    setValue((old) => ({ ...old, ...next }));
    if (moveTo !== start) focus(Math.min(moveTo, PARTS.length - 1));
  };

  const back = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && event.currentTarget.value === '' && index > 0) {
      event.preventDefault();
      focus(index - 1);
    }
  };

  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    const match = event.clipboardData.getData('text').trim().match(/^(\d{4})\D(\d{1,2})\D(\d{1,2})$/);
    if (!match) return;
    event.preventDefault();
    setValue({ year: match[1]!, month: match[2]!, day: match[3]! });
    focus(2);
  };

  const [year, month, day] = [Number(value.year), Number(value.month), Number(value.day)];
  const real = value.year.length === 4 && value.month && value.day && getAgeGroup(year, month, day, new Date()) !== null;
  const shown = real
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
    : null;

  return (
    <fieldset aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}>
      <legend className={cn('mb-3 text-sm font-semibold', legendHidden && 'sr-only')}>{words.birth}</legend>
      <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-2.5">
        {PARTS.map(({ key, autoComplete }, index) => (
          <label key={key} className="min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-muted">{words[key]}</span>
            <input
              ref={(node) => {
                boxes.current[key] = node;
              }}
              name={key}
              value={value[key]}
              onChange={(event) => change(index, event.target.value)}
              onKeyDown={(event) => back(index, event)}
              onPaste={paste}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={autoComplete}
              placeholder={words.birthPlaceholder[key]}
              aria-invalid={error ? true : undefined}
              className={cn(
                'display h-16 w-full min-w-0 rounded-panel border bg-surface text-center text-2xl tabular-nums transition-colors placeholder:text-chalk/25',
                'focus:border-accent focus:bg-sidebar focus-visible:outline-offset-1',
                error ? 'border-danger' : value[key] ? 'border-accent/60' : 'border-edge hover:border-chalk',
              )}
            />
          </label>
        ))}
      </div>

      <p aria-live="polite" className={cn('mt-3 flex min-h-6 items-center gap-2 text-sm font-semibold', shown ? 'text-accent' : 'text-transparent')}>
        {shown && <CalendarCheck className="size-4 shrink-0" aria-hidden />}
        {shown}
      </p>
      <p id={`${id}-help`} className="mt-2 flex gap-2 text-sm leading-relaxed text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        {words.birthHelp}
      </p>
      {error && <p id={`${id}-error`} role="alert" className="mt-3 text-sm leading-relaxed text-danger">{error}</p>}
    </fieldset>
  );
}
