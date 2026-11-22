'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { useI18n } from '@/lib/i18n/provider';

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    // The kind of error only. Its details could hold someone's data.
    console.error('Screen failed:', error instanceof Error ? error.name : 'unknown');
  }, [error]);

  return (
    <div className="gutter py-20">
      <PageTitle focus title={t.failed.title} body={t.failed.body} />
      <Button className="mt-6" onClick={() => retry()}>{t.failed.action}</Button>
    </div>
  );
}
