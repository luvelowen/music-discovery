'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/field';
import { useI18n } from '@/lib/i18n/provider';
import { useProfile, useUpdateProfile } from '@/lib/profile/store';
import { LIMITS, PROMPTS, type PromptId } from '@/lib/profile/types';
import { cleanText } from '@/lib/profile/validation';
import { hasContactInfo } from '@/lib/safety/contact-info';

type Draft = { id: PromptId; text: string };

export function AnswerFields() {
  const { t } = useI18n();
  const words = t.me;
  const { profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [drafts, setDrafts] = useState<Draft[]>(profile.answers);

  function save(next: Draft[]) {
    setDrafts(next);
    // A box with a phone number in it isn't saved until that's taken out.
    const answers = next
      .map((draft) => ({ id: draft.id, text: cleanText(draft.text) }))
      .filter((draft) => draft.text && !hasContactInfo(draft.text));
    updateProfile(() => ({ answers }));
  }

  return (
    <div className="space-y-5">
      {drafts.map((draft) => (
        <div key={draft.id} className="flex items-start gap-1">
          <div className="min-w-0 flex-1">
            <TextArea
              label={words.prompts[draft.id]}
              rows={2}
              value={draft.text}
              maxLength={LIMITS.answer}
              error={hasContactInfo(draft.text) ? t.errors.contactInfo : null}
              onChange={(event) => save(drafts.map((item) => (item.id === draft.id ? { ...item, text: event.target.value } : item)))}
            />
          </div>
          <Button variant="quiet" className="w-11 shrink-0 px-0!" aria-label={t.setup.remove(words.prompts[draft.id])} onClick={() => save(drafts.filter((item) => item.id !== draft.id))}>
            <X className="size-5" aria-hidden />
          </Button>
        </div>
      ))}
      {drafts.length < LIMITS.answers && (
        <ul className="divide-y divide-line">
          {PROMPTS.filter((id) => !drafts.some((draft) => draft.id === id)).map((id) => (
            <li key={id}>
              <button type="button" onClick={() => setDrafts([...drafts, { id, text: '' }])} className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm hover:text-accent">
                <Plus className="size-4 shrink-0 text-accent" aria-hidden />
                {words.prompts[id]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
