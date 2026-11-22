'use client';

import { ArrowUp } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { cleanMessage } from '@/lib/chat/clean';
import { CHAT_LIMITS, type ChatProblem } from '@/lib/chat/types';
import { useI18n } from '@/lib/i18n/provider';

type Props = { onSend: (requestId: string, text: string) => Promise<ChatProblem | null> };

export function Composer({ onSend }: Props) {
  const { t } = useI18n();
  const words = t.chat;
  const field = useId();
  const box = useRef<HTMLTextAreaElement>(null);
  const busy = useRef(false);
  const attempt = useRef<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ChatProblem | null>(null);

  async function run(work: () => Promise<ChatProblem | null>) {
    if (busy.current) return false;
    busy.current = true;
    setSending(true);
    const problem = await work();
    busy.current = false;
    setSending(false);
    setError(problem);
    return !problem;
  }

  async function send() {
    const checked = cleanMessage(text);
    if ('error' in checked) return setError(checked.error);
    attempt.current ??= crypto.randomUUID(); // The same id on a retry, so it's saved once.
    const id = attempt.current;
    if (await run(() => onSend(id, text))) {
      attempt.current = null;
      setText('');
    }
    box.current?.focus();
  }

  function key(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    // On a touch keyboard Enter makes a new line, and the button sends.
    if (window.matchMedia('(pointer: coarse)').matches) return;
    event.preventDefault();
    void send();
  }

  return (
    <div className="relative border-t border-line px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4">
      <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex items-end gap-2">
        <label htmlFor={field} className="sr-only">{words.input}</label>
        <textarea
          ref={box}
          id={field}
          rows={1}
          value={text}
          readOnly={sending}
          maxLength={CHAT_LIMITS.length}
          placeholder={words.placeholder}
          onKeyDown={key}
          onChange={(event) => {
            setText(event.target.value);
            attempt.current = null;
            setError(null);
          }}
          className="field-sizing-content max-h-36 min-h-12 min-w-0 flex-1 resize-none rounded-dialog border border-edge bg-surface px-4 py-2.5 text-base placeholder:text-muted"
        />
        <Button type="submit" aria-label={words.send} aria-disabled={sending || undefined} className="w-12 shrink-0 rounded-full! px-0!">
          <ArrowUp className="size-5" aria-hidden />
        </Button>
      </form>
      <div className="flex min-h-6 items-center justify-end gap-3 pt-1">
        {error && <p role="alert" className="text-right text-xs text-danger">{words.errors[error]}</p>}
        {!error && text.length >= CHAT_LIMITS.length - 100 && <p className="text-xs text-muted tabular-nums">{text.length}/{CHAT_LIMITS.length}</p>}
      </div>
    </div>
  );
}
