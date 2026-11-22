'use client';

import { useState, type FormEvent } from 'react';
import { CoverRecord } from '@/components/artwork/cover';
import { Button, ButtonLink } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { TextField } from '@/components/ui/field';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile } from '@/lib/profile/store';
import { getAgeGroup } from '@/lib/social/eligibility';
import { updateSocial, useSocial } from '@/lib/social/store';

const DATE_PARTS = [
  { key: 'year', length: 4, autoComplete: 'bday-year' },
  { key: 'month', length: 2, autoComplete: 'bday-month' },
  { key: 'day', length: 2, autoComplete: 'bday-day' },
] as const;

export function EligibilityScreen() {
  const { t } = useI18n();
  const words = t.community.gate;
  const { profile } = useProfile();
  const { age, student } = useSocial().social.eligibility;

  // The date lives only in this form's memory. It is never saved.
  const [date, setDate] = useState({ year: '', month: '', day: '' });
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [error, setError] = useState<'invalidDate' | 'studentRequired' | null>(null);

  if (age === 'minor') {
    return (
      <div className="gutter py-16 lg:py-24">
        <PageTitle focus title={words.minorTitle} body={words.minorBody} />
        <p className="mt-6 max-w-xl leading-relaxed">{words.minorHelp}</p>
        <ButtonLink href="/profile" className="mt-8">{words.backToProfile}</ButtonLink>
      </div>
    );
  }

  if (age === 'adult' && student === false) {
    return (
      <div className="gutter py-16 lg:py-24">
        <PageTitle focus title={words.notStudentTitle} body={words.notStudentBody} />
        <div className="mt-8 flex flex-wrap gap-2">
          <ButtonLink href="/profile">{words.backToProfile}</ButtonLink>
          <Button
            variant="quiet"
            onClick={() => {
              setAnswer(null);
              // Reopens the student question only. The age answer stays locked.
              updateSocial((social) => ({ ...social, eligibility: { ...social.eligibility, student: null } }));
            }}
          >
            {words.changeAnswer}
          </Button>
        </div>
      </div>
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const group = age === 'adult' ? age : getAgeGroup(Number(date.year || NaN), Number(date.month || NaN), Number(date.day || NaN), new Date());
    if (!group) return setError('invalidDate');
    if (answer === null) return setError('studentRequired');
    updateSocial((social) => ({
      ...social,
      // Nothing beyond the result is kept about someone under 18.
      eligibility: { age: group, student: group === 'minor' ? null : answer },
    }));
  }

  return (
    <div className="gutter grid items-center gap-16 py-8 lg:grid-cols-2 lg:py-16">
      <div className="max-w-lg">
        <PageTitle title={words.title} body={words.body} />
        <form noValidate onSubmit={submit} className="mt-8 space-y-7">
          {age === 'unknown' && (
            <fieldset>
              <legend className="mb-3 font-medium">{words.birth}</legend>
              <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
                {DATE_PARTS.map(({ key, length, autoComplete }) => (
                  <TextField
                    key={key}
                    label={words[key]}
                    inputMode="numeric"
                    autoComplete={autoComplete}
                    maxLength={length}
                    value={date[key]}
                    onChange={(event) => {
                      setDate({ ...date, [key]: event.target.value.replace(/\D/g, '') });
                      setError(null);
                    }}
                  />
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-1 font-medium">{words.student}</legend>
            <div className="flex gap-8">
              <Choice type="radio" name="student" label={words.yes} checked={answer === true} onChange={() => { setAnswer(true); setError(null); }} />
              <Choice type="radio" name="student" label={words.no} checked={answer === false} onChange={() => { setAnswer(false); setError(null); }} />
            </div>
          </fieldset>

          {error && <p role="alert" className="text-sm text-danger">{words[error]}</p>}
          <Button type="submit" className="w-full sm:w-auto sm:min-w-44">{words.submit}</Button>
          <p className="text-sm leading-relaxed text-muted">{words.unverified}</p>
        </form>
      </div>
      <CoverRecord genres={profile.genres} className="hidden w-full max-w-lg lg:block" />
    </div>
  );
}
