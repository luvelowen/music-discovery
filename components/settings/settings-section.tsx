import type { ReactNode } from 'react';

export function SettingsSection({ id, title, body, children }: { id?: string; title: string; body?: string; children: ReactNode }) {
  return (
    <section id={id} className="grid gap-x-16 gap-y-3 border-t border-seam py-8 lg:grid-cols-[1fr_1.7fr] lg:py-10">
      <div>
        <h2 className="text-3xl leading-none font-display font-extrabold">{title}</h2>
        {body && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>}
      </div>
      <div className="min-w-0 max-w-2xl">{children}</div>
    </section>
  );
}
