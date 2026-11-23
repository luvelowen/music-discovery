'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { forgotAction, logInAction, signUpAction, type AuthState } from '@/app/auth-actions';
import { LegalLinks } from '@/components/legal/legal-links';
import { Button, ButtonLink } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { cn } from '@/components/ui/cn';
import { TextField } from '@/components/ui/field';
import { shownMark } from '@/lib/consent/text';
import { useI18n } from '@/lib/i18n/provider';
import type { AuthError } from '@/lib/server/accounts';
import { getAgeGroup } from '@/lib/social/eligibility';
import { AuthFrame } from './auth-frame';
import { BirthdayField } from './birthday-field';
import { PasswordFields } from './password-fields';

const ACTIONS = { signup: signUpAction, login: logInAction, forgot: forgotAction };

// Sign-up asks one thing at a time, like Tinder and Spotify: account, birthday, agreement.
const STEPS = 3;
const stepOf = (error: AuthError): number =>
  error === 'email' || error === 'password' || error === 'match' ? 0 : error === 'birth' || error === 'minor' ? 1 : 2;

const GENERAL: AuthError[] = ['wrong', 'tooMany', 'sendFailed', 'suspended', 'closed', 'changed'];

/** Quick checks before moving on. The server checks everything again; these only save a wasted trip. */
function check(step: number, form: FormData): AuthError | null {
  const text = (key: string) => String(form.get(key) ?? '');
  if (step === 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text('email').trim())) return 'email';
    const length = [...text('password')].length;
    if (length < 10 || length > 128) return 'password';
    return text('password').normalize('NFC') === text('again').normalize('NFC') ? null : 'match';
  }
  if (step === 1) {
    // Only whether the date is real. Whether it is old enough is the server's answer alone.
    return getAgeGroup(Number(text('year') || NaN), Number(text('month') || NaN), Number(text('day') || NaN), new Date()) ? null : 'birth';
  }
  return form.get('consent') === 'on' ? null : 'consent';
}

export function AuthForm({ mode, email }: { mode: keyof typeof ACTIONS; email?: string }) {
  const { t, locale } = useI18n();
  const words = t.account;
  const [state, send, pending] = useActionState<AuthState, FormData>(ACTIONS[mode], {});
  const form = useRef<HTMLFormElement>(null);

  const joining = mode === 'signup';
  const [step, setStep] = useState(0);
  const [problem, setProblem] = useState<AuthError | undefined>();
  // Until the page is interactive, every step shows at once, so sign-up still works without JavaScript.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const stepped = joining && ready;

  // Each answer from the server shows its problem on the step it belongs to.
  useEffect(() => {
    setProblem(state.error);
    if (joining && state.error) setStep(stepOf(state.error));
  }, [state, joining]);

  const go = (next: number) => {
    setProblem(undefined);
    setStep(next);
    // The next box, so the keyboard stays up on phones.
    requestAnimationFrame(() => form.current?.querySelector<HTMLInputElement>(`[data-step="${next}"] input:not([type=hidden])`)?.focus());
  };

  const forward = () => {
    const found = check(step, new FormData(form.current!));
    if (found) return setProblem(found);
    go(step + 1);
  };

  const error = (kind: AuthError) => (problem === kind ? words.errors[kind] : null);
  const general = problem && GENERAL.includes(problem) ? words.errors[problem] : null;

  const titles = {
    signup: [[words.signUpTitle, words.signUpBody], [words.birthTitle, words.birthBody], [words.agreeTitle, words.agreeBody]][stepped ? step : 0]!,
    login: [words.logInTitle, words.logInBody],
    forgot: [words.forgotTitle, words.forgotBody],
  }[mode];
  const submit = { signup: words.signUp, login: words.logIn, forgot: words.sendCode }[mode];
  const last = !stepped || step === STEPS - 1;

  const progress = stepped && (
    <div className="mb-7 flex items-center gap-3">
      <button
        type="button"
        onClick={() => go(step - 1)}
        disabled={step === 0}
        aria-label={t.setup.back}
        className="-ml-2.5 grid size-11 shrink-0 place-items-center rounded-full text-chalk transition-colors hover:bg-surface disabled:invisible"
      >
        <ChevronLeft className="size-6" aria-hidden />
      </button>
      <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1} aria-label={words.step(step + 1, STEPS)}>
        {Array.from({ length: STEPS }, (_, index) => (
          <span key={index} className={cn('h-1 flex-1 rounded-full transition-colors', index <= step ? 'bg-accent' : 'bg-raised')} />
        ))}
      </div>
      <span className="shrink-0 text-xs font-semibold text-muted tabular-nums">{step + 1}/{STEPS}</span>
    </div>
  );

  return (
    <AuthFrame title={titles[0]!} body={titles[1]} top={progress}>
      <form
        ref={form}
        action={send}
        noValidate
        // Sent by hand so an error doesn't wipe what was typed. Without JavaScript the action still works.
        onSubmit={(event) => {
          event.preventDefault();
          if (!last) return forward(); // Enter moves to the next step.
          const data = new FormData(event.currentTarget);
          if (stepped) {
            const found = check(step, data);
            if (found) return setProblem(found);
          }
          startTransition(() => send(data));
        }}
        // A problem disappears as soon as someone starts fixing it.
        onChange={() => problem && setProblem(undefined)}
        className="mt-8 flex flex-1 flex-col lg:flex-none"
      >
        <div data-step={0} hidden={stepped && step !== 0} className="space-y-5">
          <TextField
            name="email"
            type="email"
            label={words.email}
            defaultValue={email}
            readOnly={Boolean(email)}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            placeholder="name@example.com"
            error={error('email')}
          />
          {mode !== 'forgot' && <PasswordFields choosing={joining} error={problem} />}
          {mode === 'login' && (
            <div className="-mt-2 flex justify-end">
              <Link href="/forgot" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline">{words.forgot}</Link>
            </div>
          )}
        </div>

        {joining && (
          <>
            <div data-step={1} hidden={stepped && step !== 1} className={cn(!stepped && 'mt-7')}>
              <BirthdayField legendHidden={stepped} error={error('birth') ?? error('minor')} />
            </div>

            <div data-step={2} hidden={stepped && step !== 2} className={cn(!stepped && 'mt-7')}>
              {/* Which words were on the screen, so that is what gets saved as agreed. */}
              <input type="hidden" name="shownLocale" value={locale} />
              <input type="hidden" name="shownMark" value={shownMark('signup', locale)} />
              <div className={cn('rounded-panel border bg-surface px-4 py-2', problem === 'consent' ? 'border-danger' : 'border-line')}>
                <Choice type="checkbox" name="consent" label={words.consent} className="items-start! text-sm leading-relaxed [&_input]:mt-0.5" />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">{words.consentNote}</p>
              <LegalLinks newTab />
              {problem === 'consent' && <p role="alert" className="mt-2 text-sm text-danger">{words.errors.consent}</p>}
            </div>
          </>
        )}

        {general && <p role="alert" className="mt-5 text-sm leading-relaxed text-danger">{general}</p>}

        {/* On phones the main button waits at the bottom, where the thumb is. */}
        <div className="sticky bottom-0 -mx-5 mt-auto bg-night px-5 pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:mx-0 lg:mt-7 lg:p-0">
          {/* Always a submit button, so Enter works too. Before the last step, submitting only moves on. */}
          <Button type="submit" disabled={pending} className="h-13 w-full text-base disabled:opacity-70">
            {pending ? words.working : last ? submit : words.next}
          </Button>
        </div>
      </form>

      {mode === 'forgot' ? (
        <Link href={email ? '/settings' : '/login'} className="mt-4 inline-flex min-h-11 items-center self-center text-sm font-semibold text-accent hover:underline">{t.setup.back}</Link>
      ) : (
        <div className="mt-4 flex items-center justify-center gap-1 text-sm lg:mt-8 lg:border-t lg:border-line lg:pt-6">
          <span className="text-muted">{joining ? words.haveAccount : words.noAccount}</span>
          <ButtonLink href={joining ? '/login' : '/signup'} variant="quiet" className="px-2! font-bold">
            {joining ? words.logIn : words.signUp}
          </ButtonLink>
        </div>
      )}
    </AuthFrame>
  );
}
