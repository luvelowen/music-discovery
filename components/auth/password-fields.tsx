'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { TextField } from '@/components/ui/field';
import { useI18n } from '@/lib/i18n/provider';
import type { AuthError } from '@/lib/server/accounts';

/** `choosing` adds the second box, for a new password. */
export function PasswordFields({ choosing, error }: { choosing?: boolean; error?: AuthError }) {
  const { t } = useI18n();
  const words = t.account;
  const [visible, setVisible] = useState(false);
  const type = visible ? 'text' : 'password';

  return (
    <>
      <TextField
        name="password"
        type={type}
        label={choosing === true ? words.newPassword : words.password}
        autoComplete={choosing ? 'new-password' : 'current-password'}
        maxLength={128}
        help={choosing ? words.passwordHelp : undefined}
        error={error === 'password' ? words.errors.password : null}
        className="pr-14"
        // Inside the box, on the right, where people expect it.
        action={
          <button
            type="button"
            aria-label={visible ? words.hidePassword : words.showPassword}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
            className="absolute top-1 right-1 grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-raised hover:text-chalk"
          >
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        }
      />
      {choosing && (
        <TextField name="again" type={type} label={words.again} autoComplete="new-password" maxLength={128} error={error === 'match' ? words.errors.match : null} />
      )}
    </>
  );
}
