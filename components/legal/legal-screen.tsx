'use client';

import { LegalLinks } from '@/components/legal/legal-links';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';

type Props = { page: 'privacy' | 'rules'; operator?: { name: string | null; contact: string | null; location: string | null } };

export function LegalScreen({ page, operator }: Props) {
  const { t } = useI18n();
  const words = t.legal[page];
  const who = t.legal.who;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-8 pb-16">
      <PageTitle title={words.title} body={words.body} />
      {operator && (
        <dl className="mt-6 divide-y divide-line rounded-panel bg-surface px-4 text-sm sm:px-5">
          {([[who.name, operator.name ?? who.noName], [who.contact, operator.contact ?? who.noContact], [who.location, operator.location ?? who.noLocation]] as const).map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="text-muted">{label}</dt>
              <dd className="[overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {words.sections.map(([title, ...points]) => (
        <section key={title} className="mt-7">
          <h2 className="text-lg font-bold">{title}</h2>
          <ul className="mt-2 space-y-2 leading-relaxed">
            {points.map((point) => <li key={point} className="text-[0.9375rem]">{point}</li>)}
          </ul>
        </section>
      ))}
      <LegalLinks className="mt-8" />
    </div>
  );
}
