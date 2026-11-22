import type { ReactNode } from 'react';

/** A grouped list: the title outside, the contents on one rounded surface. */
export function SettingsSection({ id, title, body, children }: { id?: string; title: string; body?: string; children: ReactNode }) {
  return (
    <section id={id} className="max-w-3xl scroll-mt-4 pt-7">
      <h2 className="text-lg font-bold">{title}</h2>
      {body && <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>}
      <div className="mt-2.5 min-w-0 rounded-panel bg-surface px-4 py-3 sm:px-5">{children}</div>
    </section>
  );
}
