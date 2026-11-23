'use client';

import Link from 'next/link';
import { startTransition, useActionState } from 'react';
import { forgotAction, logInAction, signUpAction, type AuthState } from '@/app/auth-actions';
import { LegalLinks } from '@/components/legal/legal-links';
import { Button, ButtonLink } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { TextField } from '@/components/ui/field';
import { shownMark } from '@/lib/consent/text';
import { useI18n } from '@/lib/i18n/provider';
import { AuthFrame } from './auth-frame';
import { PasswordFields } from './password-fields';

const DATE_PARTS = [
  { key: 'year', length: 4, autoComplete: 'bday-year' },
  { key: 'month', length: 2, autoComplete: 'bday-month' },
  { key: 'day', length: 2, autoComplete: 'bday-day' },
] as const;

const ACTIONS = { signup: signUpAction, login: logInAction, forgot: forgotAction };

export function AuthForm({ mode, email }: { mode: keyof typeof ACTIONS; email?: string }) {
  const { t, locale } = useI18n();
  const words = t.account;
  const [{ error }, send, pending] = useActionState<AuthState, FormData>(ACTIONS[mode], {});

  const joining = mode === 'signup';
  const title = { signup: words.signUpTitle, login: words.logInTitle, forgot: words.forgotTitle }[mode];
  const body = { signup: words.signUpBody, login: undefined, forgot: words.forgotBody }[mode];
  const submit = { signup: words.signUp, login: words.logIn, forgot: words.sendCode }[mode];

  return (
    <AuthFrame title={title} body={body}>
      <form
        action={send}
        noValidate
        // Sent by hand so an error doesn't wipe what was typed. Without JavaScript the action still works.
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => send(data));
        }}
        className="mt-7 space-y-5"
      >
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
          error={error === 'email' ? words.errors.email : null}
        />
        {mode !== 'forgot' && <PasswordFields choosing={joining} error={error} />}

        {mode === 'login' && (
          <div className="-mt-3 flex justify-end">
            <Link href="/forgot" className="inline-flex min-h-11 items-center text-sm text-accent hover:underline">{words.forgot}</Link>
          </div>
        )}

        {joining && (
          <>
            <fieldset>
              <legend className="mb-2 font-medium">{words.birth}</legend>
              <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
                {DATE_PARTS.map(({ key, length, autoComplete }) => (
                  <TextField key={key} name={key} label={words[key]} inputMode="numeric" autoComplete={autoComplete} maxLength={length} />
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">{words.birthHelp}</p>
              {error === 'birth' && <p role="alert" className="mt-2 text-sm text-danger">{words.errors.birth}</p>}
            </fieldset>
            <div>
              {/* Which words were on the screen, so that is what gets saved as agreed. */}
              <input type="hidden" name="shownLocale" value={locale} />
              <input type="hidden" name="shownMark" value={shownMark('signup', locale)} />
              <Choice type="checkbox" name="consent" label={words.consent} className="items-start! text-sm leading-relaxed" />
              <p className="mt-1 text-xs leading-relaxed text-muted">{words.consentNote}</p>
              <LegalLinks newTab />
              {error === 'consent' && <p role="alert" className="mt-2 text-sm text-danger">{words.errors.consent}</p>}
            </div>
          </>
        )}

        {(error === 'minor' || error === 'wrong' || error === 'tooMany' || error === 'sendFailed' || error === 'suspended' || error === 'closed' || error === 'changed') && (
          <p role="alert" className="text-sm leading-relaxed text-danger">{words.errors[error]}</p>
        )}
        <Button type="submit" disabled={pending} className="h-12 w-full disabled:opacity-70">{pending ? words.working : submit}</Button>
      </form>

      {mode === 'forgot' ? (
        <Link href={email ? '/settings' : '/login'} className="mt-6 inline-flex min-h-11 items-center text-sm text-accent hover:underline">{t.setup.back}</Link>
      ) : (
        <div className="mt-8 border-t border-line pt-6">
          <p className="mb-3 text-center text-sm text-muted">{joining ? words.haveAccount : words.noAccount}</p>
          <ButtonLink href={joining ? '/login' : '/signup'} variant="secondary" className="h-12 w-full">
            {joining ? words.logIn : words.signUp}
          </ButtonLink>
        </div>
      )}
    </AuthFrame>
  );
}
