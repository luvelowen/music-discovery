import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SetupScreen } from '@/components/setup/setup-screen';
import { getI18n } from '@/lib/i18n/server';
import { isStep } from '@/lib/steps';

export async function generateMetadata({ params }: PageProps<'/setup/[step]'>): Promise<Metadata> {
  const [{ step }, { t }] = await Promise.all([params, getI18n()]);
  return { title: isStep(step) ? t.steps[step] : t.notFound.title };
}

export default async function Page({ params, searchParams }: PageProps<'/setup/[step]'>) {
  const [{ step }, query] = await Promise.all([params, searchParams]);
  if (!isStep(step)) notFound();
  // ?edit=1 means "came from the profile", so the main button saves and goes back there.
  return <SetupScreen key={step} step={step} editing={query.edit === '1'} />;
}
