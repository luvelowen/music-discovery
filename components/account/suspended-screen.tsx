'use client';

import { logOutAction } from '@/app/auth-actions';
import { LegalLinks } from '@/components/legal/legal-links';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';

/** All a suspended person can open. Nothing here shows or changes anybody else. */
export function SuspendedScreen({ contact }: { contact: string | null }) {
  const { t } = useI18n();
  const words = t.account.suspension;
  return (
    <div className="gutter py-14">
      <div className="max-w-xl">
        <PageTitle focus title={words.title} body={words.body} />
        <dl className="mt-6 divide-y divide-line rounded-panel bg-surface px-4 text-sm sm:px-5">
          <div className="py-3">
            <dt className="text-muted">{t.legal.who.contact}</dt>
            <dd className="mt-1 [overflow-wrap:anywhere]">{contact ?? t.legal.who.noContact}</dd>
          </div>
          <div className="py-3">
            <dt className="text-muted">{words.restTitle}</dt>
            <dd className="mt-1 leading-relaxed">{words.rest}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <a href="/api/export" download className="inline-flex min-h-11 items-center justify-center rounded-control bg-deep px-5 py-2 font-semibold text-chalk hover:bg-deep-lit">
            {t.account.data.download}
          </a>
          <form action={logOutAction}>
            <Button type="submit" variant="secondary">{t.account.logOut}</Button>
          </form>
        </div>
        <LegalLinks className="mt-4" />
      </div>
    </div>
  );
}
