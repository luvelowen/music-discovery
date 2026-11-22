import { ButtonLink } from '@/components/ui/button';
import { getI18n } from '@/lib/i18n/server';

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="gutter py-24">
      <h1 className="poster mb-8 text-6xl sm:text-8xl">{t.notFound.title}</h1>
      <ButtonLink href="/">{t.notFound.action}</ButtonLink>
    </div>
  );
}
