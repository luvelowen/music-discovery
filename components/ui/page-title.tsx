'use client';

import { useEffect, useRef } from 'react';

/** Use `focus` when this title replaces a screen after an action, so it gets announced. */
export function PageTitle({ title, body, focus }: { title: string; body?: string; focus?: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focus) heading.current?.focus();
  }, [focus]);

  return (
    <div>
      <h1 ref={heading} tabIndex={focus ? -1 : undefined} className="title">
        {title}
      </h1>
      {body && <p className="mt-2 max-w-xl leading-relaxed text-muted">{body}</p>}
    </div>
  );
}
