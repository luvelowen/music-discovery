'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
        action={
          <Button variant="secondary" className="w-12 shrink-0 px-0!" aria-label={visible ? words.hidePassword : words.showPassword} onClick={() => setVisible(!visible)}>
            {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </Button>
        }
      />
      {choosing && (
        <TextField name="again" type={type} label={words.again} autoComplete="new-password" maxLength={128} error={error === 'match' ? words.errors.match : null} />
      )}
    </>
  );
}
