import { ButtonLink } from '@/components/ui/button';
import { getI18n } from '@/lib/i18n/server';

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="gutter py-24">
      <h1 className="mb-8 text-4xl font-semibold tracking-tight">{t.notFound.title}</h1>
      <ButtonLink href="/">{t.notFound.action}</ButtonLink>
    </div>
  );
}
